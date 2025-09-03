import type { FC } from "react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useTranscription } from "~/features/transcription/providers/TranscriptionProvider";
import { RouteProtection } from "~/components";

const TranscriptionsPage: FC = () => {
  const [markdown, setMarkdown] = useState("");

  useEffect(() => {
    fetch("/transcriptions.md")
      .then((response) => response.text())
      .then((text) => setMarkdown(text));
  }, []);

  const [files, setFiles] = useState<Array<{ url: string; name: string }>>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [transcription, setTranscription] = useState<string>("");
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [isTranscribingAll, setIsTranscribingAll] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [fileStatuses, setFileStatuses] = useState<Array<{
    status: 'pending' | 'processing' | 'completed' | 'error';
    transcription?: string;
    error?: string;
    progress?: number;
  }>>([]);
  const { transcribeAudio, loadModel, modelStatus } = useTranscription();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles).map((file) => ({
        url: URL.createObjectURL(file),
        name: file.name,
      }));
      setFiles((prev) => [...prev, ...newFiles]);
      setFileStatuses((prev) => [...prev, ...Array(newFiles.length).fill({ status: 'pending' })]);
    }
  };

  const downloadTranscription = (text: string, fileName: string) => {
    const txtBlob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(txtBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName.replace(/\.[^/.]+$/, "")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const transcribeSingleFile = async (file: { url: string; name: string }, fileIndex: number) => {
    try {
      // Update status to processing
      setFileStatuses(prev => prev.map((status, idx) => 
        idx === fileIndex ? { ...status, status: 'processing', progress: 0 } : status
      ));

      if (modelStatus !== "ready") {
        await loadModel();
      }

      // Fetch the file as a Blob
      const response = await fetch(file.url);
      const blob = await response.blob();

      // Create an AudioContext to decode the audio
      const audioContext = new AudioContext();
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const duration = audioBuffer.duration; // seconds
      const chunkDuration = 30; // seconds
      const totalChunks = Math.ceil(duration / chunkDuration);
      let fullTranscription = "";

      for (let i = 0; i < totalChunks; i++) {
        const startSec = i * chunkDuration;
        const endSec = Math.min((i + 1) * chunkDuration, duration);
        
        // Extract audio data for this chunk
        const startSample = Math.floor(startSec * audioBuffer.sampleRate);
        const endSample = Math.floor(endSec * audioBuffer.sampleRate);
        const chunkLength = endSample - startSample;

        // Create a new audio buffer for the chunk
        const chunkBuffer = audioContext.createBuffer(
          audioBuffer.numberOfChannels,
          chunkLength,
          audioBuffer.sampleRate
        );

        // Copy data from original buffer to chunk buffer
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
          const originalData = audioBuffer.getChannelData(channel);
          const chunkData = chunkBuffer.getChannelData(channel);
          for (let j = 0; j < chunkLength; j++) {
            chunkData[j] = originalData[startSample + j];
          }
        }

        // Convert the audio buffer to a WAV blob
        const wavBlob = await audioBufferToWav(chunkBuffer);
        
        const text = await transcribeAudio(wavBlob);
        if (text) {
          fullTranscription += (fullTranscription ? " " : "") + text;
        }

        // Update progress for this file
        const chunkProgress = Math.round(((i + 1) / totalChunks) * 100);
        setFileStatuses(prev => prev.map((status, idx) => 
          idx === fileIndex ? { ...status, progress: chunkProgress } : status
        ));
      }

      audioContext.close();

      // Update status to completed and store transcription
      setFileStatuses(prev => prev.map((status, idx) => 
        idx === fileIndex ? { ...status, status: 'completed', transcription: fullTranscription } : status
      ));

      // Automatically download the transcription
      downloadTranscription(fullTranscription, file.name);

      return fullTranscription;
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      setFileStatuses(prev => prev.map((status, idx) => 
        idx === fileIndex ? { ...status, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' } : status
      ));
      return null;
    }
  };

  const handleTranscribeAll = async () => {
    if (files.length === 0) return;
    
    setIsTranscribingAll(true);
    
    if (modelStatus !== "ready") {
      await loadModel();
    }

    // Process files sequentially
    for (let i = 0; i < files.length; i++) {
      await transcribeSingleFile(files[i], i);
    }

    setIsTranscribingAll(false);
  };

  const handleTranscribe = async () => {
    if (selectedIndex === null) return;
    const file = files[selectedIndex];
    setIsTranscribing(true);
    setProgress(0);
    setTranscription("");

    if (modelStatus !== "ready") {
      await loadModel();
    }

    try {
      // Fetch the file as a Blob
      const response = await fetch(file.url);
      const blob = await response.blob();

      // Create an AudioContext to decode the audio
      const audioContext = new AudioContext();
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const duration = audioBuffer.duration; // seconds
      const chunkDuration = 30; // seconds
      const totalChunks = Math.ceil(duration / chunkDuration);

      for (let i = 0; i < totalChunks; i++) {
        const startSec = i * chunkDuration;
        const endSec = Math.min((i + 1) * chunkDuration, duration);
        
        // Extract audio data for this chunk
        const startSample = Math.floor(startSec * audioBuffer.sampleRate);
        const endSample = Math.floor(endSec * audioBuffer.sampleRate);
        const chunkLength = endSample - startSample;

        // Create a new audio buffer for the chunk
        const chunkBuffer = audioContext.createBuffer(
          audioBuffer.numberOfChannels,
          chunkLength,
          audioBuffer.sampleRate
        );

        // Copy data from original buffer to chunk buffer
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
          const originalData = audioBuffer.getChannelData(channel);
          const chunkData = chunkBuffer.getChannelData(channel);
          for (let j = 0; j < chunkLength; j++) {
            chunkData[j] = originalData[startSample + j];
          }
        }

        // Convert the audio buffer to a WAV blob
        const wavBlob = await audioBufferToWav(chunkBuffer);
        
        const text = await transcribeAudio(wavBlob);
        if (text) {
          setTranscription((prev) => (prev ? prev + " " : "") + text);
        }
        setProgress(Math.round(((i + 1) / totalChunks) * 100));
      }

      audioContext.close();
    } catch (error) {
      console.error("Error processing audio:", error);
    }

    setIsTranscribing(false);
  };

  // Helper function to convert AudioBuffer to WAV blob
  const audioBufferToWav = async (buffer: AudioBuffer): Promise<Blob> => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length;
    
    // Create a WAV file header
    const wavBuffer = new ArrayBuffer(44 + length * numChannels * 2);
    const view = new DataView(wavBuffer);
    
    // Write WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF'); // RIFF header
    view.setUint32(4, 36 + length * numChannels * 2, true); // file length
    writeString(8, 'WAVE'); // WAVE header
    writeString(12, 'fmt '); // format chunk identifier
    view.setUint32(16, 16, true); // format chunk length
    view.setUint16(20, 1, true); // sample format (1 = PCM)
    view.setUint16(22, numChannels, true); // number of channels
    view.setUint32(24, sampleRate, true); // sample rate
    view.setUint32(28, sampleRate * numChannels * 2, true); // byte rate
    view.setUint16(32, numChannels * 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    writeString(36, 'data'); // data chunk identifier
    view.setUint32(40, length * numChannels * 2, true); // data chunk length
    
    // Write audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([wavBuffer], { type: 'audio/wav' });
  };

  return (
    <RouteProtection>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* File selector */}
        <div>
            <input
            type="file"
            accept="video/*"
            multiple
            onChange={handleFileSelect}
            className="border p-2"
          />
        </div>

        {/* Files table */}
        {files.length > 0 && (
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1 text-left">#</th>
                <th className="border px-2 py-1 text-left">File Name</th>
                <th className="border px-2 py-1 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file, idx) => {
                const status = fileStatuses[idx] || { status: 'pending' };
                return (
                  <tr
                    key={idx}
                    className={`cursor-pointer ${
                      selectedIndex === idx ? "bg-blue-100" : ""
                    }`}
                    onClick={() => setSelectedIndex(idx)}
                  >
                    <td className="border px-2 py-1">{idx + 1}</td>
                    <td className="border px-2 py-1">{file.name}</td>
                    <td className="border px-2 py-1">
                      {status.status === 'pending' && '⏸️ Pending'}
                      {status.status === 'processing' && `⏳ Processing (${status.progress}%)`}
                      {status.status === 'completed' && '✅ Completed'}
                      {status.status === 'error' && `❌ Error: ${status.error}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Transcribe buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleTranscribe}
            disabled={selectedIndex === null || isTranscribing || isTranscribingAll}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isTranscribing ? `Transcribing (${progress}%)` : "Transcribe Selected"}
          </button>

          <button
            onClick={handleTranscribeAll}
            disabled={files.length === 0 || isTranscribingAll || isTranscribing}
            className="bg-purple-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isTranscribingAll ? "Processing All Files..." : "Transcribe All"}
          </button>
        </div>

        {/* Transcription textarea */}
        <div className="mt-4">
          <textarea
            value={transcription}
            readOnly
            className="w-full h-40 p-2 border rounded resize-none"
            placeholder="Transcription will appear here..."
          />
          {transcription && (
            <button
              onClick={() => {
                const txtBlob = new Blob([transcription], { type: "text/plain" });
                const url = URL.createObjectURL(txtBlob);
                const a = document.createElement("a");
                a.href = url;
                const fileName = selectedIndex !== null ? files[selectedIndex].name.replace(/\.[^/.]+$/, "") : "transcription";
                a.download = `${fileName}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="mt-2 bg-green-500 text-white px-3 py-1 rounded"
            >
              Save as .txt
            </button>
          )}
        </div>

        {/* Markdown content */}
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>
    </RouteProtection>
  );
};

export default TranscriptionsPage;
