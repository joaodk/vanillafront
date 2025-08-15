import React, { useEffect, useRef } from 'react';

interface SilenceDetectorProps {
  audioStream: MediaStream | null;
  onSilenceDetected?: () => void;
  onSpeechDetected?: () => void;
  silenceThreshold?: number; // RMS value below which it's considered silence (e.g., 0.01 - 0.05)
  silenceDurationMs?: number; // Duration in ms to confirm silence
}

const SilenceDetector: React.FC<SilenceDetectorProps> = ({
  audioStream,
  onSilenceDetected,
  onSpeechDetected,
  silenceThreshold = 0.02, // Default threshold
  silenceDurationMs = 1000, // Default 1 second
}) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const isSilentRef = useRef<boolean>(false);

  useEffect(() => {
    if (!audioStream) {
      // Clean up if stream is removed
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      return;
    }

    // Initialize AudioContext and AnalyserNode
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 2048; // Fast Fourier Transform size
    
    // Connect stream to analyser
    mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(audioStream);
    mediaStreamSourceRef.current.connect(analyserRef.current);

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const detectSilence = () => {
      if (!analyserRef.current || !audioContextRef.current || audioContextRef.current.state === 'closed') {
        return;
      }

      analyserRef.current.getByteTimeDomainData(dataArray);

      // Calculate RMS (Root Mean Square) to get amplitude
      let sumSquares = 0;
      for (let i = 0; i < bufferLength; i++) {
        const sample = (dataArray[i] - 128) / 128; // Normalize to -1 to 1
        sumSquares += sample * sample;
      }
      const rms = Math.sqrt(sumSquares / bufferLength);

      if (rms < silenceThreshold) {
        // Potentially silent
        if (!silenceTimerRef.current) {
          silenceTimerRef.current = window.setTimeout(() => {
            if (!isSilentRef.current) {
              console.log('Silence detected!');
              onSilenceDetected?.();
              isSilentRef.current = true;
            }
          }, silenceDurationMs);
        }
      } else {
        // Speech detected
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        if (isSilentRef.current) {
          console.log('Speech detected!');
          onSpeechDetected?.();
          isSilentRef.current = false;
        }
      }

      requestAnimationFrame(detectSilence);
    };

    // Start detection
    requestAnimationFrame(detectSilence);

    // Cleanup function
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (mediaStreamSourceRef.current) {
        mediaStreamSourceRef.current.disconnect();
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      audioContextRef.current = null;
      analyserRef.current = null;
      mediaStreamSourceRef.current = null;
      isSilentRef.current = false;
    };
  }, [audioStream, silenceThreshold, silenceDurationMs, onSilenceDetected, onSpeechDetected]);

  return null; // This component doesn't render anything visible
};

export default SilenceDetector;
