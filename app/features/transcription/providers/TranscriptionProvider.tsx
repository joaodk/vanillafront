import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { pipeline, env, read_audio } from '@xenova/transformers';

// Configure transformers to use local models
env.allowLocalModels = true;
env.allowRemoteModels = false;
env.localModelPath = './model/';
env.cacheDir = './model/';

export interface Progress {
  progress: number;
  // Add other properties if they exist in the progress object
}

// Define the state of the transcription model
export type ModelStatus = 'uninitialized' | 'loading' | 'ready' | 'error';

interface TranscriptionContextType {
  modelStatus: ModelStatus;
  transcribeAudio: (audioBlob: Blob) => Promise<string | null>;
  loadingProgress: number;
  loadModel: () => Promise<void>;
}

const TranscriptionContext = createContext<TranscriptionContextType | undefined>(undefined);

interface TranscriptionProviderProps {
  children: ReactNode;
  autoLoadModel?: boolean;
}

export const TranscriptionProvider: React.FC<TranscriptionProviderProps> = ({ children, autoLoadModel = false }) => {
  const transcriberRef = useRef<any>(null); // Use useRef to hold the transcriber instance
  const [modelStatus, setModelStatus] = useState<ModelStatus>('uninitialized');
  const [loadingProgress, setLoadingProgress] = useState<number>(0);

  const loadModel = useCallback(async () => {
    if (transcriberRef.current || modelStatus === 'loading' || modelStatus === 'ready') {
      if(transcriberRef.current) setModelStatus('ready');
      return;
    }

    setModelStatus('loading');
    console.log("Loading Whisper model...");

    try {
      transcriberRef.current = await pipeline(
        'automatic-speech-recognition',
        'whisper-tiny', // Use local model name
        {
          progress_callback: (progress: Progress) => {
            setLoadingProgress(Math.round(progress.progress * 100));
          }
        }
      );
      setModelStatus('ready');
      console.log("Whisper model loaded successfully.");
    } catch (error) {
      console.error("Error loading Whisper model:", error);
      setModelStatus('error');
    }
  }, [modelStatus]);

  useEffect(() => {
    if (autoLoadModel) {
      loadModel();
    }
  }, [autoLoadModel, loadModel]);

  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string | null> => {
    if (modelStatus !== 'ready' || !transcriberRef.current) {
      console.warn("Model not ready for transcription.");
      return null;
    }

    console.log("Transcribing audio...");
    let audioData: Float32Array | null = null;
    try {
      const audioUrl = URL.createObjectURL(audioBlob);
      audioData = await read_audio(audioUrl, 16000);
      URL.revokeObjectURL(audioUrl);

      const result = await transcriberRef.current(audioData);
      console.log("Transcription complete:", result.text);
      return result.text;
    } catch (error) {
      console.error("Error transcribing audio:", error);
      return null;
    }
  }, [modelStatus]);

  return (
    <TranscriptionContext.Provider value={{ modelStatus, transcribeAudio, loadingProgress, loadModel }}>
      {children}
    </TranscriptionContext.Provider>
  );
};

export const useTranscription = () => {
  const context = useContext(TranscriptionContext);
  if (context === undefined) {
    throw new Error('useTranscription must be used within a TranscriptionProvider');
  }
  return context;
};
