import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranscription } from '~/features/transcription/providers/TranscriptionProvider';

interface SpacebarRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

type RecordingState = 'idle' | 'recording' | 'transcribing';

export const SpacebarRecorder: React.FC<SpacebarRecorderProps> = ({ onTranscriptionComplete }) => {
  const [state, setState] = useState<RecordingState>('idle');
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { transcribeAudio, modelStatus } = useTranscription();

  // Helper function to encode audio data into WAV format (reusing from AudioRecorder)
  const encodeWAV = (audioBuffer: AudioBuffer) => {
    const numOfChannels = 1; // Force mono
    const sampleRate = 16000; // Force 16 kHz
    const format = 1; // PCM
    const bitDepth = 16; // 16-bit PCM

    // Always take the first channel for mono output
    const result = audioBuffer.getChannelData(0);

    const dataLength = result.length * (bitDepth / 8);
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    let offset = 0;
    const writeString = (str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    // RIFF chunk descriptor
    writeString('RIFF'); offset += 4;
    view.setUint32(offset, 36 + dataLength, true); offset += 4;
    writeString('WAVE'); offset += 4;

    // FMT sub-chunk
    writeString('fmt '); offset += 4;
    view.setUint32(offset, 16, true); offset += 4; // Subchunk1Size for PCM
    view.setUint16(offset, format, true); offset += 2; // AudioFormat
    view.setUint16(offset, numOfChannels, true); offset += 2; // NumChannels
    view.setUint32(offset, sampleRate, true); offset += 4; // SampleRate
    view.setUint32(offset, sampleRate * numOfChannels * (bitDepth / 8), true); offset += 4; // ByteRate
    view.setUint16(offset, numOfChannels * (bitDepth / 8), true); offset += 2; // BlockAlign
    view.setUint16(offset, bitDepth, true); offset += 2; // BitsPerSample

    // DATA sub-chunk
    writeString('data'); offset += 4;
    view.setUint32(offset, dataLength, true); offset += 4;

    // Write the PCM samples
    floatTo16BitPCM(view, offset, result);

    return new Blob([view], { type: 'audio/wav' });
  };

  const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array) => {
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  };

  const resampleAndDownmixAudioBuffer = async (audioBuffer: AudioBuffer, targetSampleRate: number, targetChannelCount: number): Promise<AudioBuffer> => {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const originalSampleRate = audioBuffer.sampleRate;
    const originalLength = audioBuffer.length;

    // Create an OfflineAudioContext for resampling and downmixing
    const offlineAudioContext = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(
      targetChannelCount,
      (originalLength / originalSampleRate) * targetSampleRate,
      targetSampleRate
    );

    const source = offlineAudioContext.createBufferSource();
    source.buffer = audioBuffer;

    // Downmix to mono if necessary
    let downmixedBuffer: AudioBuffer;
    if (numberOfChannels > targetChannelCount) {
      const monoBuffer = offlineAudioContext.createBuffer(1, originalLength, originalSampleRate);
      const inputData = audioBuffer.getChannelData(0); // Take the first channel for simplicity
      monoBuffer.copyToChannel(inputData, 0);
      downmixedBuffer = monoBuffer;
    } else {
      downmixedBuffer = audioBuffer;
    }

    const downmixedSource = offlineAudioContext.createBufferSource();
    downmixedSource.buffer = downmixedBuffer;
    downmixedSource.connect(offlineAudioContext.destination);
    downmixedSource.start(0);

    return offlineAudioContext.startRendering();
  };

  const startRecording = useCallback(async () => {
    if (state !== 'idle' || modelStatus !== 'ready') return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
        },
      });

      setAudioStream(stream);
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        setState('transcribing');
        
        try {
          const audioBlobWebm = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Convert to WAV format for better transcription
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const arrayBuffer = await audioBlobWebm.arrayBuffer();
          const originalAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          // Resample and downmix the audio buffer to 16kHz mono
          const processedAudioBuffer = await resampleAndDownmixAudioBuffer(originalAudioBuffer, 16000, 1);
          const wavBlob = encodeWAV(processedAudioBuffer);

          // Transcribe the audio
          const transcription = await transcribeAudio(wavBlob);
          
          if (transcription && transcription.trim()) {
            onTranscriptionComplete(transcription.trim());
          }
          
          await audioContext.close();
        } catch (error) {
          console.error('Error processing audio:', error);
        } finally {
          setState('idle');
          cleanup();
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setState('recording');
    } catch (error) {
      console.error('Error starting recording:', error);
      setState('idle');
    }
  }, [state, modelStatus, transcribeAudio, onTranscriptionComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  }, [mediaRecorder]);

  const cleanup = useCallback(() => {
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
    setMediaRecorder(null);
  }, [audioStream]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space' && !event.repeat && state === 'idle') {
      event.preventDefault();
      startRecording();
    }
  }, [state, startRecording]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (event.code === 'Space' && state === 'recording') {
      event.preventDefault();
      stopRecording();
    }
  }, [state, stopRecording]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      cleanup();
    };
  }, [handleKeyDown, handleKeyUp, cleanup]);

  const getTooltipText = () => {
    switch (state) {
      case 'recording':
        return 'Recording... Release spacebar to stop';
      case 'transcribing':
        return 'Transcribing audio...';
      default:
        return modelStatus === 'ready' ? 'Hold spacebar to talk' : 'Transcription model not ready';
    }
  };

  const isDisabled = modelStatus !== 'ready';

  return (
    <button
      className={`p-2 rounded-md transition-colors ${
        isDisabled
          ? 'text-gray-400 cursor-not-allowed'
          : state === 'recording'
          ? 'text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/30 dark:hover:bg-red-900/50'
          : state === 'transcribing'
          ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30'
          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
      disabled={isDisabled}
      title={getTooltipText()}
      aria-label={getTooltipText()}
    >
      {state === 'recording' ? (
        // Recording icon with pulse animation
        <div className="flex items-center">
          <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
            <path d="M19 10v1a7 7 0 0 1-14 0v-1a1 1 0 0 1 2 0v1a5 5 0 0 0 10 0v-1a1 1 0 0 1 2 0z"/>
            <path d="M11 21h2a1 1 0 0 1 0 2h-2a1 1 0 0 1 0-2z"/>
          </svg>
        </div>
      ) : state === 'transcribing' ? (
        // Loading spinner
        <div className="flex items-center">
          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : (
        // Microphone icon
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      )}
    </button>
  );
};
