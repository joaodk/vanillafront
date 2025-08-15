import React, { useState, useRef, useCallback, useEffect } from "react";
import { TranscriptionProvider, useTranscription } from "~/features/transcription/providers/TranscriptionProvider";

type Recording = {
  url: string;
  fileName: string;
};

export default function AudioTranscriber() {
  const { transcribeAudio, loadModel } = useTranscription();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  // Refs for stream and recording flag
  const streamRef = useRef<MediaStream | null>(null);
  const isRecordingRef = useRef(false);

  useEffect(() => {
    loadModel();
  }, [loadModel]);

  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      isRecordingRef.current = true;
      setIsRecording(true);

      while (isRecordingRef.current && streamRef.current) {
        // Record one 5-second segment
        const options = MediaRecorder.isTypeSupported("audio/webm; codecs=opus")
          ? { mimeType: "audio/webm; codecs=opus" }
          : undefined;
        const recorder = new MediaRecorder(streamRef.current, options);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        recorder.start();
        await sleep(5000);
        recorder.stop();

        // Wait for onstop to fire to ensure chunks are collected
        await new Promise<void>((resolve) => {
          recorder.onstop = () => resolve();
        });

        // Build blob and append to recordings
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: chunks[0].type });
          const url = URL.createObjectURL(blob);
          const fileName = `recording-${Date.now()}.webm`;
          setRecordings((prev) => [...prev, { url, fileName }]);
        }
      }
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    setIsRecording(false);
    // Clean up stream
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const toggleRecording = () => {
    isRecording ? stopRecording() : startRecording();
  };

  return (
    <TranscriptionProvider>
      <div className="flex flex-col gap-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">File</th>
              <th className="text-left p-2">Play</th>
            </tr>
          </thead>
          <tbody>
            {recordings.map((rec, idx) => (
              <tr key={idx} className="border-b">
                <td className="p-2">{rec.fileName}</td>
                <td className="p-2">
                  <audio controls src={rec.url} className="w-full" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          className={`px-4 py-2 rounded-md text-white ${
            isRecording ? "bg-red-500" : "bg-blue-500"
          }`}
          onClick={toggleRecording}
        >
          {isRecording ? "Stop" : "Start"}
        </button>
      </div>
    </TranscriptionProvider>
  );
}
