import React from 'react';
import { useSpeechSynthesizer } from '../features/speech/providers/SpeechSynthesizerProvider';
import { useTranscription } from '../features/transcription/providers/TranscriptionProvider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { BrainCircuit } from 'lucide-react';

export const ModelStatusIndicator: React.FC = () => {
  const {
    isModelLoaded: isSynthLoaded,
    isLoading: isSynthLoading,
    error: synthError,
    loadModel: loadSynthModel,
  } = useSpeechSynthesizer();

  const {
    modelStatus: transcriptionStatus,
    loadingProgress: transcriptionProgress,
    loadModel: loadTranscriptionModel,
  } = useTranscription();

  const isTranscriptionLoading = transcriptionStatus === 'loading';
  const isTranscriptionReady = transcriptionStatus === 'ready';
  const transcriptionError = transcriptionStatus === 'error';

  const isLoading = isSynthLoading || isTranscriptionLoading;
  const isLoaded = isSynthLoaded && isTranscriptionReady;
  const isError = synthError !== null || transcriptionError;

  const handleClick = () => {
    if (isError) {
        if (synthError) loadSynthModel();
        if (transcriptionError) loadTranscriptionModel();
        return;
    }
    if (!isLoaded && !isLoading) {
      loadSynthModel();
      loadTranscriptionModel();
    }
  };

  const getTooltipText = () => {
    if (isError) return 'Error loading one or more models. Click to retry.';
    if (isLoaded) return 'AI Models Loaded';
    if (isLoading) {
        if (isSynthLoading && isTranscriptionLoading) return `Loading models... (${Math.round(transcriptionProgress / 2)}%)`;
        if (isSynthLoading) return 'Loading speech model...';
        if (isTranscriptionLoading) return `Loading transcription model... (${transcriptionProgress}%)`;
    }
    return 'Load AI Models';
  };

  const synthProgress = isSynthLoaded ? 50 : (isSynthLoading ? 25 : 0);
  const transProgress = isTranscriptionReady ? 50 : (isTranscriptionLoading ? (typeof transcriptionProgress === 'number' && !isNaN(transcriptionProgress) ? transcriptionProgress / 2 : 0) : 0);
  const progress = synthProgress + transProgress;
  const circumference = 2 * Math.PI * 8; //circle around the icon

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleClick}
            className="relative h-8 w-8 flex items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-950"
            disabled={isLoading}
          >
            <div className="absolute inset-0">
              <svg className="h-full w-full" viewBox="0 0 32 32">
                {/* Background ring */}
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  fill="none"
                  strokeWidth="2"
                  className={
                    isLoaded ? "stroke-green-500" :
                    isError ? "stroke-red-500" :
                    isLoading ? "stroke-gray-200 dark:stroke-gray-700" :
                    "stroke-gray-500"
                  }
                  strokeDasharray={isLoading || isLoaded || isError ? undefined : "2 4"}
                />
                {/* Progress ring */}
                {isLoading && (
                  <circle
                    cx="16"
                    cy="16"
                    r="12"
                    fill="none"
                    strokeWidth="2"
                    stroke="currentColor"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (progress / 100) * circumference}
                    className="text-blue-500"
                    style={{
                      transition: 'stroke-dashoffset 0.2s',
                      transform: 'rotate(-90deg)',
                      transformOrigin: 'center',
                    }}
                  />
                )}
              </svg>
            </div>
            <BrainCircuit
              className={`h-4 w-4 ${//icon size
                isLoaded ? "text-green-500" :
                isError ? "text-red-500" :
                "text-gray-500"
              }`}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
