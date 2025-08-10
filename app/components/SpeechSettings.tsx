import React, { useContext, useState } from 'react';
import { useSpeechSynthesizer } from './SpeechSynthesizerProvider';

const SpeechSettings: React.FC = () => {
  const { speechSynthesizer, isLoading, error, selectedVoice, setSelectedVoice, speechSpeed, setSpeechSpeed, voices } = useSpeechSynthesizer();

  const handleVoiceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVoice(event.target.value);
  };

  const handleSpeedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSpeechSpeed(parseFloat(event.target.value));
  };

  const getModelStatus = () => {
    if (isLoading) return { text: 'Loading...', color: 'text-blue-500' };
    if (error) return { text: 'Error', color: 'text-red-500' };
    if (speechSynthesizer && voices) return { text: 'Ready', color: 'text-green-500' };
    return { text: 'Not loaded', color: 'text-gray-500' };
  };

  const status = getModelStatus();

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div>
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Model Information
          </h5>
          <div className="space-y-2">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Model: </span>
              <span className="text-xs font-medium text-gray-900 dark:text-white">Kitten TTS Nano v0.1</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Status: </span>
              <span className="text-xs font-medium text-blue-500">Loading...</span>
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">Loading settings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 space-y-4">
        <div>
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Model Information
          </h5>
          <div className="space-y-2">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Model: </span>
              <span className="text-xs font-medium text-gray-900 dark:text-white">Kitten TTS Nano v0.1</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Status: </span>
              <span className="text-xs font-medium text-red-500">Error loading model</span>
            </div>
          </div>
        </div>
        <div className="text-sm text-red-500 dark:text-red-400">Failed to load speech synthesis model</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Model Information
        </h5>
        <div className="space-y-2">
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Model: </span>
            <span className="text-xs font-medium text-gray-900 dark:text-white">Kitten TTS Nano v0.1</span>
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Status: </span>
            <span className={`text-xs font-medium ${status.color}`}>{status.text}</span>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="voice-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Voice:
        </label>
        <select
          id="voice-select"
          value={selectedVoice}
          onChange={handleVoiceChange}
          disabled={isLoading || !voices}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {voices ? (
            Object.keys(voices).map((voiceName) => (
              <option key={voiceName} value={voiceName}>
                {voiceName}
              </option>
            ))
          ) : (
            <option value="">Loading voices...</option>
          )}
        </select>
      </div>
      <div>
        <label htmlFor="speed-range" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Speed: {speechSpeed.toFixed(1)}
        </label>
        <input
          type="range"
          id="speed-range"
          min="0.1"
          max="2.0"
          step="0.1"
          value={speechSpeed}
          onChange={handleSpeedChange}
          disabled={isLoading || !voices}
          className="mt-1 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
};

export default SpeechSettings;
