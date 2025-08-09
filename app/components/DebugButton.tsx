import { type FC, useState, useEffect } from "react";
import WhisperClient, { type Progress } from '../client/whisperClient';

interface DebugButtonProps {
  audioUrl: string;
}

const DebugButton: FC<DebugButtonProps> = ({ audioUrl }) => {
  const [whisperClient, setWhisperClient] = useState<WhisperClient | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>("");
  const [transcriptionResult, setTranscriptionResult] = useState<string>("");

  useEffect(() => {
    const client = new WhisperClient();
    setWhisperClient(client);
  }, []);

  const handleDebugClick = async () => {
    if (!whisperClient) {
      setLoadingStatus("Client not initialized.");
      return;
    }

    setTranscriptionResult("");
    setLoadingStatus("Loading model...");
    await whisperClient.load((progress: Progress) => {
      setLoadingStatus(`Loading: ${Math.round(progress.progress * 100)}%`);
    });
    setLoadingStatus("Model Loaded!");

    try {
      setLoadingStatus("Fetching audio...");
      const response = await fetch(audioUrl);
      const audioBlob = await response.blob();
      setLoadingStatus("Transcribing audio...");
      const transcription = await whisperClient.transcribeAudio(audioBlob);
      if (transcription) {
        setTranscriptionResult(`Transcription: ${transcription}`);
        console.log("Transcription:", transcription);
      } else {
        setTranscriptionResult("Transcription failed.");
        console.error("Transcription failed.");
      }
    } catch (error) {
      setTranscriptionResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
      console.error("Error during transcription:", error);
    } finally {
      setLoadingStatus("");
    }
  };

  return (
    <button
      className="ml-2 px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600"
      onClick={handleDebugClick}
      disabled={!whisperClient || loadingStatus.startsWith("Loading model...") || loadingStatus.startsWith("Transcribing audio...")}
    >
      {loadingStatus || transcriptionResult || "*"}
    </button>
  );
};

export default DebugButton;
