import React, { useContext, useState } from 'react';
import { useSpeechSynthesizer } from './SpeechSynthesizerProvider';

const SpeechSettings: React.FC = () => {
  const { speechSynthesizer, selectedVoice, setSelectedVoice, speechSpeed, setSpeechSpeed, voices } = useSpeechSynthesizer();

  const handleVoiceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVoice(event.target.value);
  };

  const handleSpeedChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSpeechSpeed(parseFloat(event.target.value));
  };

  if (!speechSynthesizer || !voices) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <label htmlFor="voice-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Voice:
        </label>
        <select
          id="voice-select"
          value={selectedVoice}
          onChange={handleVoiceChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          {Object.keys(voices).map((voiceName) => (
            <option key={voiceName} value={voiceName}>
              {voiceName}
            </option>
          ))}
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
          className="mt-1 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
        />
      </div>
    </div>
  );
};

export default SpeechSettings;
