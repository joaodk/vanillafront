import { useState, useCallback } from "react";
import { Link } from "react-router";
import AudioTranscriber from "~/components/AudioTranscriber";
import SilenceDetector from "~/components/SilenceDetector";
import { RouteProtection } from "~/components";


export default function AudioChatPage() {
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [displayFileList, setDisplayFileList] = useState(false);
  const [listeningStatus, setListeningStatus] = useState<"idle" | "listening-speech" | "listening-silence">("idle");
  const [transcribingStatus, setTranscribingStatus] = useState<"idle" | "transcribing">("idle");

  const handleStreamAvailable = useCallback((stream: MediaStream | null) => {
    setAudioStream(stream);
    if (stream) {
      setListeningStatus("listening-silence"); // Start in silence detection mode
    } else {
      setListeningStatus("idle");
      setTranscribingStatus("idle");
    }
  }, []);

  const handleSilenceDetected = useCallback(() => {
    console.log("AudioChatPage: Silence detected!");
    setListeningStatus("listening-silence");
  }, []);

  const handleSpeechDetected = useCallback(() => {
    console.log("AudioChatPage: Speech detected!");
    setListeningStatus("listening-speech");
  }, []);

  const handleTranscribingChange = useCallback((isTranscribing: boolean) => {
    setTranscribingStatus(isTranscribing ? "transcribing" : "idle");
  }, []);

  return (
    <RouteProtection>
      <div className="grid h-[calc(100dvh-4rem)] grid-cols-none md:grid-cols-[200px_minmax(0,1fr)] gap-x-2 px-4 py-4">
        <div>

        </div>
        <AudioTranscriber 
          onStreamAvailable={handleStreamAvailable} 
          displayFileList={displayFileList} 
          onTranscribingChange={handleTranscribingChange}
          listeningStatus={listeningStatus}
          transcribingStatus={transcribingStatus}
        />
        {audioStream && (
          <SilenceDetector
            audioStream={audioStream}
            onSilenceDetected={handleSilenceDetected}
            onSpeechDetected={handleSpeechDetected}
          />
        )}
      </div>
    </RouteProtection>
  )
}
