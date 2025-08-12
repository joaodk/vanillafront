import React from 'react';
import { useTranscription } from '../providers/TranscriptionProvider';

const TranscriptionSettings: React.FC = () => {
  const { modelStatus, loadingProgress } = useTranscription();

  const getStatusDisplay = () => {
    switch (modelStatus) {
      case 'uninitialized':
        return { text: 'Not initialized', color: 'text-gray-500' };
      case 'loading':
        return { text: `Loading... ${loadingProgress}%`, color: 'text-blue-500' };
      case 'ready':
        return { text: 'Ready', color: 'text-green-500' };
      case 'error':
        return { text: 'Error loading model', color: 'text-red-500' };
      default:
        return { text: 'Unknown', color: 'text-gray-500' };
    }
  };

  const status = getStatusDisplay();

  return (
    <div className="p-4 space-y-4">
      <div>
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Model Information
        </h5>
        <div className="space-y-2">
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Model: </span>
            <span className="text-xs font-medium text-gray-900 dark:text-white">Whisper Base</span>
          </div>
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Status: </span>
            <span className={`text-xs font-medium ${status.color}`}>{status.text}</span>
          </div>
          {modelStatus === 'loading' && (
            <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
      
      <div>
        <label htmlFor="model-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Model:
        </label>
        <select
          id="model-select"
          value="whisper-base"
          disabled={true}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="whisper-base">Whisper Base (Default)</option>
        </select>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          More models coming soon
        </p>
      </div>
    </div>
  );
};

export default TranscriptionSettings;
