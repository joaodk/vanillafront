import { useState, useEffect } from "react";
import { useSpeechSynthesizer } from './SpeechSynthesizerProvider';
import { useTheme } from './ThemeProvider'; // Import useTheme
import * as ort from "onnxruntime-web";
import { phonemize } from 'phonemizer';

interface SpeakButtonProps {
  text: string;
  className?: string;
}

interface Voice {
  [key: string]: Float32Array;
}

import { GenerateIcon, BusyLoadingIcon, PlayIcon, StopIcon } from './ui/audioIcons';

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

const SpeakButton: React.FC<SpeakButtonProps> = ({ text, className = "" }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [hasGeneratedAudio, setHasGeneratedAudio] = useState(false); // New state
  const { speechSynthesizer, isLoading, error } = useSpeechSynthesizer();
  const { isDark } = useTheme(); // Use the theme hook

  const handleAudioEnded = () => {
    setIsPlaying(false);
    // Keep hasGeneratedAudio true if audio was successfully generated
    // It will be reset by useEffect when text changes
  };

  const handleSpeak = async () => {
    if (!speechSynthesizer || isLoading || error || !text.trim()) return;

    if (isPlaying) {
      // If already playing, stop it
      speechSynthesizer.stopAudio();
      setIsPlaying(false);
      return;
    }

    if (generatedAudioUrl) {
      // If audio already generated, just play it
      try {
        setIsPlaying(true);
        await speechSynthesizer.playAudio(generatedAudioUrl, handleAudioEnded);
      } catch (err) {
        console.error("Error playing cached speech:", err);
        setIsPlaying(false);
        speechSynthesizer.fallbackToBrowserSpeech(text);
      }
      return;
    }

    // If no audio generated, synthesize new speech
    setIsGenerating(true);
    setIsPlaying(false); // Ensure playing state is false during generation
    setGeneratedAudioUrl(null); // Clear previous URL before new generation
    setHasGeneratedAudio(false); // Reset this before new generation

    // Introduce a small delay to ensure "generating..." state is visible
    await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay

    try {
      const url = await speechSynthesizer.synthesizeSpeech(text);
      setGeneratedAudioUrl(url);
      setHasGeneratedAudio(true); // Set to true after successful generation
      setIsPlaying(true);
      await speechSynthesizer.playAudio(url, handleAudioEnded);
    } catch (err) {
      console.error("Error generating or playing speech:", err);
      speechSynthesizer.fallbackToBrowserSpeech(text);
      setIsPlaying(false);
      setHasGeneratedAudio(false); // Reset if generation failed
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStop = () => {
    if (speechSynthesizer) {
      speechSynthesizer.stopAudio();
    }
    setIsPlaying(false);
  };

  // Reset generated audio when text changes
  useEffect(() => {
    setGeneratedAudioUrl(null);
    setIsPlaying(false);
    setHasGeneratedAudio(false); // Reset hasGeneratedAudio when text changes
    if (speechSynthesizer) {
      speechSynthesizer.stopAudio();
    }
  }, [text, speechSynthesizer]);

  const buttonContent = () => {
    const iconClassName = isDark ? "text-white" : "text-black"; // Conditionally apply text color

    if (isLoading) {
      return <BusyLoadingIcon size={24} className={iconClassName} />;
    } else if (isGenerating) {
      return <BusyLoadingIcon size={24} className={iconClassName} />; // Busy/Loading for generation
    } else if (isPlaying) {
      return <StopIcon size={24} className={iconClassName} />; // Stop icon during playback
    } else if (!hasGeneratedAudio) {
      return <GenerateIcon size={24} className={iconClassName} />; // Generate icon if no audio yet
    } else {
      return <PlayIcon size={24} className={iconClassName} />; // Play icon if audio generated
    }
  };

  const buttonAction = () => {
    if (isPlaying) {
      return handleStop;
    } else {
      return handleSpeak;
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={buttonAction()}
        disabled={isLoading || isGenerating || !!error || !text.trim()}
        className={`px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {buttonContent()}
      </button>
    </div>
  );
};

export default SpeakButton;
