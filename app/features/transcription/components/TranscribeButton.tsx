import { type FC, useState } from "react";
import { useTranscription, type ModelStatus } from '../providers/TranscriptionProvider';
import { Button } from '../../../components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip";

interface TranscribeButtonProps {
  audioUrl: string;
}

const TranscribeButton: FC<TranscribeButtonProps> = ({ audioUrl }) => {
  const { modelStatus, transcribeAudio, loadingProgress } = useTranscription();
  const [transcriptionResult, setTranscriptionResult] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [transcriptionTime, setTranscriptionTime] = useState<number | null>(null);

  const handleTranscribeClick = async () => {
    if (transcriptionResult) {
      // If already transcribed, show the existing result
      alert(`Transcription: ${transcriptionResult}\nAudio Duration: ${audioDuration?.toFixed(2)}s\nTranscription Time: ${transcriptionTime?.toFixed(2)}ms`);
      return;
    }

    if (modelStatus !== 'ready') {
      alert(`Model not ready. Status: ${modelStatus}`);
      return;
    }

    setIsTranscribing(true);
    setTranscriptionResult(null); // Clear previous result if any
    setAudioDuration(null);
    setTranscriptionTime(null);

    try {
      const response = await fetch(audioUrl);
      const audioBlob = await response.blob();

      // Get audio duration
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const duration = audioBuffer.duration;
      setAudioDuration(duration);

      const startTime = performance.now();
      const transcription = await transcribeAudio(audioBlob);
      const endTime = performance.now();
      const timeTaken = endTime - startTime;
      setTranscriptionTime(timeTaken);

      if (transcription) {
        setTranscriptionResult(transcription);
        alert(`Transcription: ${transcription}\nAudio Duration: ${duration.toFixed(2)}s\nTranscription Time: ${timeTaken.toFixed(2)}ms`);
        console.log("Transcription:", transcription);
        console.log(`Audio Duration: ${duration.toFixed(2)}s`);
        console.log(`Transcription Time: ${timeTaken.toFixed(2)}ms`);
      } else {
        alert("Transcription failed.");
        console.error("Transcription failed.");
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : String(error)}`);
      console.error("Error during transcription:", error);
    } finally {
      setIsTranscribing(false);
    }
  };

  const getButtonText = () => {
    switch (modelStatus) {
      case 'uninitialized':
        return 'Initializing...';
      case 'loading':
        return `Loading Model (${loadingProgress}%)`;
      case 'ready':
        return isTranscribing ? 'Transcribing...' : (transcriptionResult ? 'Show Transcription' : 'Transcribe Audio');
      case 'error':
        return 'Model Error';
      default:
        return 'Transcribe';
    }
  };

  const isDisabled = modelStatus !== 'ready' || isTranscribing;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleTranscribeClick}
            disabled={isDisabled}
            className="ml-2 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {getButtonText()}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {modelStatus === 'loading'
              ? `Loading model: ${loadingProgress}%`
              : modelStatus === 'ready'
              ? isTranscribing
                ? 'Generating transcription...'
                : transcriptionResult
                  ? 'Click to show previously transcribed text'
                  : 'Click to transcribe audio'
              : `Model status: ${modelStatus}`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TranscribeButton;
