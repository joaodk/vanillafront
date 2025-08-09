import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import WhisperClient, { type Progress } from '../client/whisperClient';

// Define the state of the transcription model
export type ModelStatus = 'uninitialized' | 'loading' | 'ready' | 'error';

interface TranscriptionContextType {
  modelStatus: ModelStatus;
  transcribeAudio: (audioBlob: Blob) => Promise<string | null>;
  loadingProgress: number;
}

const TranscriptionContext = createContext<TranscriptionContextType | undefined>(undefined);

interface TranscriptionProviderProps {
  children: ReactNode;
}

export const TranscriptionProvider: React.FC<TranscriptionProviderProps> = ({ children }) => {
  const [whisperClient, setWhisperClient] = useState<WhisperClient | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelStatus>('uninitialized');
  const [loadingProgress, setLoadingProgress] = useState<number>(0);

  useEffect(() => {
    const client = new WhisperClient();
    setWhisperClient(client);

    const loadModel = async () => {
      setModelStatus('loading');
      try {
        await client.load((progress: Progress) => {
          setLoadingProgress(Math.round(progress.progress * 100));
        });
        setModelStatus('ready');
      } catch (error) {
        console.error("Failed to load Whisper model:", error);
        setModelStatus('error');
      }
    };

    loadModel();
  }, []);

  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string | null> => {
    if (modelStatus !== 'ready' || !whisperClient) {
      console.warn("Model not ready for transcription.");
      return null;
    }
    return whisperClient.transcribeAudio(audioBlob);
  }, [modelStatus, whisperClient]);

  return (
    <TranscriptionContext.Provider value={{ modelStatus, transcribeAudio, loadingProgress }}>
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
