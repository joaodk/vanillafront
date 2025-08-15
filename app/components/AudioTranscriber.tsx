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
  const [transcript, setTranscript] = useState<string>("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load the Whisper model on component mount
  useEffect(() => {
    loadModel();
  }, [loadModel]);


  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        const fileName = `recording-${Date.now()}.webm`;
        setRecordings((prev) => [...prev, { url, fileName }]);
        // stop all tracks
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  }, []);

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Ensure model is loaded when component mounts
  useEffect(() => {
    loadModel();
  }, [loadModel]);

  return (
    <TranscriptionProvider>
      <div className="flex flex-col gap-4">
        <textarea
          readOnly
          value={transcript}
          className="w-full h-32 p-2 border rounded mb-4"
        />
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

      {isRecording && (
        <span className="text-red-500 animate-pulse">
          Recording...
        </span>
      )}
      </div>
    </TranscriptionProvider>
  );
}
