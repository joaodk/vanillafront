import { useState, useEffect } from "react";
import { useSpeechSynthesizer } from './SpeechSynthesizerProvider';
import * as ort from "onnxruntime-web";
import { phonemize } from 'phonemizer';

interface SpeakButtonProps {
  text: string;
  className?: string;
}

interface Voice {
  [key: string]: Float32Array;
}


import React from 'react';

const AudioIcons = () => {
  return (
    <div className="p-8 bg-white dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">
        Audio Generation Icons
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* Generate Icon */}
        <div className="flex flex-col items-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            className="mb-4 text-gray-600 dark:text-gray-300"
            aria-label="Generate Audio"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <polygon
              points="9,8 9,16 15,12"
              fill="currentColor"
            />
            <circle
              cx="16"
              cy="8"
              r="1.5"
              fill="currentColor"
            />
            <circle
              cx="19"
              cy="10"
              r="1"
              fill="currentColor"
            />
            <circle
              cx="18"
              cy="6"
              r="0.8"
              fill="currentColor"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Generate
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Play button with sparkles for generating audio
          </p>
        </div>

        {/* Busy/Loading Icon */}
        <div className="flex flex-col items-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            className="mb-4 text-gray-600 dark:text-gray-300 animate-spin"
            aria-label="Generating Audio"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="31.416"
              strokeDashoffset="10"
              fill="none"
            />
            <circle cx="12" cy="6" r="2" fill="currentColor" />
            <circle cx="18" cy="12" r="1.5" fill="currentColor" />
            <circle cx="12" cy="18" r="1" fill="currentColor" />
            <circle cx="6" cy="12" r="1.5" fill="currentColor" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Generating
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Animated spinner for loading state
          </p>
        </div>

        {/* Play Icon */}
        <div className="flex flex-col items-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            className="mb-4 text-gray-600 dark:text-gray-300"
            aria-label="Play Audio"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <polygon
              points="10,8 16,12 10,16"
              fill="currentColor"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Play
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Classic play button with circle border
          </p>
        </div>

        {/* Stop Icon */}
        <div className="flex flex-col items-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            className="mb-4 text-gray-600 dark:text-gray-300"
            aria-label="Stop Audio"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <rect
              x="9"
              y="9"
              width="6"
              height="6"
              rx="1"
              fill="currentColor"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Stop
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Square stop icon with circle border
          </p>
        </div>

        {/* Error Icon */}
        <div className="flex flex-col items-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            className="mb-4 text-gray-600 dark:text-gray-300"
            aria-label="Error"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M15 9l-6 6m0-6l6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Error
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            X mark in circle for error states
          </p>
        </div>

        {/* Usage Example */}
        <div className="flex flex-col items-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Usage Example
          </h3>
          <div className="flex space-x-4">
            <button className="p-3 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="text-white"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <polygon
                  points="9,8 9,16 15,12"
                  fill="currentColor"
                />
                <circle
                  cx="16"
                  cy="8"
                  r="1.5"
                  fill="currentColor"
                />
                <circle
                  cx="19"
                  cy="10"
                  r="1"
                  fill="currentColor"
                />
                <circle
                  cx="18"
                  cy="6"
                  r="0.8"
                  fill="currentColor"
                />
              </svg>
            </button>
            <button className="p-3 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="text-white"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <polygon
                  points="10,8 16,12 10,16"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Code Examples */}
      <div className="mt-12 bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          React Component Examples
        </h2>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
{`// Generate Icon Component
const GenerateIcon = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <polygon
      points="9,8 9,16 15,12"
      fill="currentColor"
    />
    <circle cx="16" cy="8" r="1.5" fill="currentColor" />
    <circle cx="19" cy="10" r="1" fill="currentColor" />
    <circle cx="18" cy="6" r="0.8" fill="currentColor" />
  </svg>
);

// Play Icon Component
const PlayIcon = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
    <polygon points="10,8 16,12 10,16" fill="currentColor" />
  </svg>
);`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default AudioIcons;

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
    if (isLoading) {
      return "Loading...";
    } else if (isGenerating) {
      return "generating..."; // During generation
    } else if (isPlaying) {
      return "Stop"; // During playback
    } else if (!hasGeneratedAudio) {
      return "generate"; // Initial state, no audio generated yet
    } else {
      return "Play"; // Audio generated, not playing
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
        className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {buttonContent()}
      </button>
    </div>
  );
};

export default SpeakButton;
