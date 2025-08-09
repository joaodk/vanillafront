import React, { useState, useEffect, useRef, useCallback } from 'react';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, fileName: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Helper function to encode audio data into WAV format
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
    try {
      console.log("will get usermedia")
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000, // Request 16kHz from the start
          channelCount: 1,    // Request mono from the start
        },
      });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      source.connect(analyserRef.current);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlobWebm = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        if (audioContextRef.current) {
          const arrayBuffer = await audioBlobWebm.arrayBuffer();
          const originalAudioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
          
          // Resample and downmix the audio buffer to 16kHz mono
          const processedAudioBuffer = await resampleAndDownmixAudioBuffer(originalAudioBuffer, 16000, 1);
          
          const wavBlob = encodeWAV(processedAudioBuffer);
          const fileName = `recording-${Date.now()}.wav`;
          onRecordingComplete(wavBlob, fileName);
        } else {
          // Fallback if audioContext is not available, though it should be
          const fileName = `recording-${Date.now()}.webm`;
          onRecordingComplete(audioBlobWebm, fileName);
        }

        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log('Recording started');
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please ensure it is connected and permissions are granted.');
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log('Recording stopped');
    }
  }, []);

  return (
    <div className="flex items-center space-x-2">
      <button
        className={`px-4 py-2 rounded-md text-white ${isRecording ? 'bg-red-500' : 'bg-blue-500'}`}
        onClick={isRecording ? stopRecording : startRecording}
      >
        {isRecording ? 'Click to Stop Recording' : 'Click to Record'}
      </button>
      {isRecording && (
        <span className="text-red-500 animate-pulse">Recording...</span>
      )}
    </div>
  );
};

export default AudioRecorder;
