import { useState, useEffect } from "react";
import * as ort from "onnxruntime-web";
import { phonemize } from 'phonemizer';

interface SpeakButtonProps {
  text: string;
  className?: string;
}

interface Voice {
  [key: string]: Float32Array;
}

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

const SpeakButton: React.FC<SpeakButtonProps> = ({ text, className = "" }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<ort.InferenceSession | null>(null);
  const [voices, setVoices] = useState<Voice | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadModel();
  }, []);

  const loadModel = async () => {
    try {
      // Configure ONNX Runtime
      ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/";

      // Load the ONNX model
      const session = await ort.InferenceSession.create("/model/kitten_tts_nano_v0_1.onnx");
      setSession(session);

      // Load voice embeddings
      const voicesResponse = await fetch("/model/voices.json");
      const voicesData = await voicesResponse.json();

      const processedVoices: Voice = {};
      for (const [voiceName, voiceArray] of Object.entries(voicesData)) {
        // Handle both 1D and 2D arrays (flatten if needed)
        const flatArray = Array.isArray((voiceArray as any)[0]) ? (voiceArray as any[]).flat() : voiceArray as number[];
        processedVoices[voiceName] = new Float32Array(flatArray);
      }
      //console.log(processedVoices)
      setVoices(processedVoices);
    } catch (error) {
      console.error("Error loading model:", error);
    }
  };

  const handleSpeak = async () => {
    if (!session || !voices || !text.trim()) return;

    setIsLoading(true);
    try {
        let session: ort.InferenceSession | null = null;
        let voices: Voice = {};
        console.log('Loading Kitten TTS model and voices...', 'loading');
        
        // Load the ONNX model
        session = await ort.InferenceSession.create('./model/kitten_tts_nano_v0_1.onnx');
        
        // Load real voice embeddings from JSON
        const voicesResponse = await fetch('./model/voices.json');
        const voicesData = await voicesResponse.json();
        
        // Convert to Float32Arrays
        for (const [voiceName, voiceArray] of Object.entries(voicesData)) {
            // Handle both 1D and 2D arrays (flatten if needed)
            const flatArray = Array.isArray((voiceArray as any)[0]) ? (voiceArray as any[]).flat() : voiceArray as number[];
            voices[voiceName] = new Float32Array(flatArray);
        }
        
        console.log('Model loaded successfully! Ready to generate speech.', 'ready');


      const textCleaner = new TextCleaner();
      console.log(text);
      // Simple text cleaning and tokenization
      var cleanText = text.toLowerCase().trim();
      console.log(cleanText);
      //const phonemes = phonemizeText(cleanText)
      const phonemesList = await phonemizeText(text);
      console.log(phonemesList)
      // Join phoneme segments and tokenize
      const allPhonemes = Array.isArray(phonemesList) ? phonemesList.join(' ') : phonemesList;
      const phonemeTokens = basicEnglishTokenize(allPhonemes);

      // Join back to string
      const phonemeString = phonemeTokens.join(' ');

      // convert to token IDs
      let tokenIds = textCleaner.clean(phonemeString);

      // Add start and end tokens
      tokenIds.unshift(0);
      tokenIds.push(0);

      const tokens = cleanText.split("").map(char => char.charCodeAt(0) % 256);
      
      // Create input tensors
      const selectedvoice = 'expr-voice-2-m';
      console.log("tokens:->")
      console.log(tokens)
      const inputIds = new ort.Tensor("int64", BigInt64Array.from(tokenIds.map(id => BigInt(id))), [1, tokenIds.length]);
      const style = new ort.Tensor("float32", voices[selectedvoice], [1, voices[selectedvoice].length]);
      const speed = new ort.Tensor("float32", new Float32Array([1.0]), [1]);

      const feeds = {
        input_ids: inputIds,
        style: style,
        speed: speed,
      };
      console.log(feeds)

      // Run inference
      const results = await session.run(feeds);
      const audioOutput = results[Object.keys(results)[0]];
      
      // Process audio output
      let audioData = audioOutput.data as Float32Array;
      
      // Create audio buffer
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = audioContext.createBuffer(1, audioData.length, 22050);
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

      // Create WAV file
      const wav = audioBufferToWav(audioBuffer);
      const blob = new Blob([wav], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      
      setAudioUrl(url);
      
      // Play audio
      const audio = new Audio(url);
      setAudioElement(audio);
      await audio.play();
      
    } catch (error) {
      console.error("Error generating speech:", error);
      // Fallback to browser speech synthesis
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

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

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleSpeak}
        disabled={isLoading || !text.trim()}
        className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isLoading ? "Generating..." : "Speak"}
      </button>
      
      {audioUrl && (
        <button
          onClick={handleStop}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Stop
        </button>
      )}
    </div>
  );
};

export default SpeakButton;
