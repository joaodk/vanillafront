import { Protect } from "@clerk/clerk-react";
import { useState, useCallback } from "react";
import { Link } from "react-router";
import AudioTranscriber from "~/components/AudioTranscriber";
import SilenceDetector from "~/components/SilenceDetector";


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
    <Protect
      condition={(has) => has({ plan: "full_access" })}
      fallback={
        <div className="flex items-center justify-center h-[calc(100dvh-4rem)]">
          <div className="text-center p-8 max-w-md mx-auto">
            <div className="mb-6">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Premium Feature
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You need the Full Access plan to use the chat feature.
              </p>
            </div>
            <Link
              to="/pricing"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              View Plans
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      }
    >
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
    </Protect>
  )
}
