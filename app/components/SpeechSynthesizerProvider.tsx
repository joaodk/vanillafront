import React, { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import * as ort from "onnxruntime-web";
import { phonemize } from 'phonemizer';

interface Voice {
  [key: string]: Float32Array;
}

// Helper function to convert AudioBuffer to WAV
const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
  const length = buffer.length;
  const sampleRate = buffer.sampleRate;
  const arrayBuffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // WAV header
  writeString(0, "RIFF");
  view.setUint32(4, 36 + length * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, length * 2, true);

  // Audio data
  const channelData = buffer.getChannelData(0);
  let offset = 44;
  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, sample * 0x7fff, true);
    offset += 2;
  }

  return arrayBuffer;
};

// Text cleaning and tokenization functions
class TextCleaner {
    private wordIndexDictionary: { [key: string]: number };
    
    constructor() {
        const _pad = "$";
        const _punctuation = ';:,.!?¡¿—…"«»"" ';
        const _letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        const _letters_ipa = "ɑɐɒæɓʙβɔɕçɗɖðʤəɘɚɛɜɝɞɟʄɡɠɢʛɦɧħɥʜɨɪʝɭɬɫɮʟɱɯɰŋɳɲɴøɵɸθœɶʘɹɺɾɻʀʁɽʂʃʈʧʉʊʋⱱʌɣɤʍχʎʏʑʐʒʔʡʕʢǀǁǂǃˈˌːˑʼʴʰʱʲʷˠˤ˞↓↑→↗↘'̩'ᵻ";
        
        const symbols = [_pad, ...Array.from(_punctuation), ...Array.from(_letters), ...Array.from(_letters_ipa)];

        this.wordIndexDictionary = {};
        symbols.forEach((symbol, i) => {
            this.wordIndexDictionary[symbol] = i;
        });
    }
    
    clean(text: string): number[] {
        const indexes: number[] = [];
        for (const char of text) {
            if (this.wordIndexDictionary[char] !== undefined) {
                indexes.push(this.wordIndexDictionary[char]);
            }
        }
        return indexes;
    }
}

function basicEnglishTokenize(text: string): string[] {
    // Improved tokenizer for phonemes - keep IPA characters together
    // Split on whitespace but keep phoneme symbols as units
    return text.split(/\s+/).filter((token: string) => token.length > 0);
}

// Fallback simple phonemizer (kept as backup)
function simplePhonemeApproximation(text: string): string {
    return text.toLowerCase()
        .replace(/ph/g, 'f')
        .replace(/ch/g, 'tʃ')
        .replace(/sh/g, 'ʃ')
        .replace(/th/g, 'θ')
        .replace(/ng/g, 'ŋ')
        .replace(/a/g, 'ə')
        .replace(/e/g, 'ɛ')
        .replace(/i/g, 'ɪ')
        .replace(/o/g, 'ɔ')
        .replace(/u/g, 'ʊ');
}

// Proper phonemizer using phonemizer package
async function phonemizeText(text:string) {
    try {
        // Use phonemizer with espeak backend
        const phonemeResult = await phonemize(text, 'en-us');
        
        // Clean up the phonemes - remove excessive stress marks that might cause accent issues
        const cleanedPhonemes = Array.isArray(phonemeResult) 
            ? phonemeResult.map(p => p)
            : phonemeResult;

        return cleanedPhonemes || text;
    } catch (error) {
        console.warn('Phonemization failed, using simplified version:', error);
        // Fallback to simple approximation
        return simplePhonemeApproximation(text);
    }
}

export class SpeechSynthesizer {
  private session: ort.InferenceSession | null = null;
  public voices: Voice | null = null; // Make voices public
  private textCleaner: TextCleaner;
  private audioContext: AudioContext | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private audioEndedCallback: (() => void) | null = null;

  constructor() {
    this.textCleaner = new TextCleaner();
    ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/";
  }

  public async loadModel(): Promise<void> {
    if (this.session && this.voices) {
      console.log('Kitten TTS model already loaded.');
      return; // Model already loaded
    }
    try {
      this.session = await ort.InferenceSession.create("/model/kitten_tts_nano_v0_1.onnx");
      const voicesResponse = await fetch("/model/voices.json");
      const voicesData = await voicesResponse.json();

      const processedVoices: Voice = {};
      for (const [voiceName, voiceArray] of Object.entries(voicesData)) {
        const flatArray = Array.isArray((voiceArray as any)[0]) ? (voiceArray as any[]).flat() : voiceArray as number[];
        processedVoices[voiceName] = new Float32Array(flatArray);
      }
      this.voices = processedVoices;
      console.log('Kitten TTS model and voices loaded successfully!');
    } catch (error) {
      console.error("Error loading speech synthesis model:", error);
      throw error; // Re-throw to be handled by the component
    }
  }

  public async synthesizeSpeech(text: string, selectedVoice: string, speechSpeed: number): Promise<string> {
    if (!this.session || !this.voices) {
      throw new Error("Speech synthesis model not loaded.");
    }
    if (!text.trim()) {
      throw new Error("Text to synthesize cannot be empty.");
    }

    try {
      const phonemesList = await phonemizeText(text);
      const allPhonemes = Array.isArray(phonemesList) ? phonemesList.join(' ') : phonemesList;
      const phonemeTokens = basicEnglishTokenize(allPhonemes);
      const phonemeString = phonemeTokens.join(' ');
      let tokenIds = this.textCleaner.clean(phonemeString);

      // Add start and end tokens
      tokenIds.unshift(0);
      tokenIds.push(0);

      const inputIds = new ort.Tensor("int64", BigInt64Array.from(tokenIds.map(id => BigInt(id))), [1, tokenIds.length]);
      const style = new ort.Tensor("float32", this.voices[selectedVoice], [1, this.voices[selectedVoice].length]);
      const speedTensor = new ort.Tensor("float32", new Float32Array([speechSpeed]), [1]);

      const feeds = {
        input_ids: inputIds,
        style: style,
        speed: speedTensor,
      };

      const results = await this.session.run(feeds);
      const audioOutput = results[Object.keys(results)[0]];
      
      let audioData = audioOutput.data as Float32Array;
      
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioBuffer = this.audioContext.createBuffer(1, audioData.length, 22050);
      const channelData = audioBuffer.getChannelData(0);
      
      // Normalize audio
      let maxAbs = 0;
      for (let i = 0; i < audioData.length; i++) {
        maxAbs = Math.max(maxAbs, Math.abs(audioData[i]));
      }
      
      const normalizedGain = maxAbs > 0 ? 0.8 / maxAbs : 1;
      for (let i = 0; i < audioData.length; i++) {
        channelData[i] = audioData[i] * normalizedGain;
      }

      const wav = audioBufferToWav(audioBuffer);
      const blob = new Blob([wav], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      
      return url;
      
    } catch (error) {
      console.error("Error during speech synthesis:", error);
      throw error;
    }
  }

  public async playAudio(url: string, onAudioEnd?: () => void): Promise<void> {
    this.stopAudio(); // Stop any currently playing audio
    this.currentAudioElement = new Audio(url);
    if (onAudioEnd) {
      this.audioEndedCallback = onAudioEnd;
      this.currentAudioElement.onended = () => {
        if (this.audioEndedCallback) {
          this.audioEndedCallback();
        }
        this.currentAudioElement = null; // Clear element after playback
      };
    }
    await this.currentAudioElement.play();
  }

  public stopAudio(): void {
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
      this.currentAudioElement.onended = null; // Remove event listener
      this.currentAudioElement = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    this.audioEndedCallback = null; // Clear callback
  }

  public fallbackToBrowserSpeech(text: string): void {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("Browser speech synthesis not supported.");
    }
  }
}

interface SpeechSynthesizerContextType {
  speechSynthesizer: SpeechSynthesizer | null;
  isLoading: boolean;
  error: Error | null;
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  speechSpeed: number;
  setSpeechSpeed: (speed: number) => void;
  voices: Voice | null;
}

const SpeechSynthesizerContext = createContext<SpeechSynthesizerContextType>({
  speechSynthesizer: null,
  isLoading: true,
  error: null,
  selectedVoice: 'expr-voice-2-m', // Default voice
  setSelectedVoice: () => {},
  speechSpeed: 1.0, // Default speed
  setSpeechSpeed: () => {},
  voices: null,
});

interface SpeechSynthesizerProviderProps {
  children: ReactNode;
}

export const SpeechSynthesizerProvider: React.FC<SpeechSynthesizerProviderProps> = ({ children }) => {
  const [speechSynthesizer, setSpeechSynthesizer] = useState<SpeechSynthesizer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>('expr-voice-2-m'); // Default voice
  const [speechSpeed, setSpeechSpeed] = useState<number>(1.0); // Default speed
  const synthesizerRef = useRef<SpeechSynthesizer | null>(null);

  useEffect(() => {
    if (!synthesizerRef.current) {
      synthesizerRef.current = new SpeechSynthesizer();
      setSpeechSynthesizer(synthesizerRef.current);
    }

    const loadModel = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await synthesizerRef.current?.loadModel();
        // Set default voice if voices are loaded
        if (synthesizerRef.current?.voices) {
          const firstVoice = Object.keys(synthesizerRef.current.voices)[0];
          if (firstVoice) {
            setSelectedVoice(firstVoice);
          }
        }
      } catch (err) {
        console.error("Failed to load speech synthesizer model:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadModel();
  }, []);

  return (
    <SpeechSynthesizerContext.Provider value={{ 
      speechSynthesizer, 
      isLoading, 
      error, 
      selectedVoice, 
      setSelectedVoice, 
      speechSpeed, 
      setSpeechSpeed,
      voices: speechSynthesizer?.voices || null // Expose voices from the synthesizer instance
    }}>
      {children}
    </SpeechSynthesizerContext.Provider>
  );
};

export const useSpeechSynthesizer = () => {
  const context = useContext(SpeechSynthesizerContext);
  if (context === undefined) {
    throw new Error('useSpeechSynthesizer must be used within a SpeechSynthesizerProvider');
  }
  return context;
};
