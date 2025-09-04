import type { Route } from "../+types/root";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { useEdgeRuntime } from "@assistant-ui/react-edge";
import { Link } from "react-router";
import { CHAT_API } from "~/lib/constants";
import { ThreadList } from "~/components/assistant-ui/thread-list";
import { Thread } from "~/components/assistant-ui/thread";
import { TranscribeButton } from "~/components";
import AudioRecorder from "~/components/AudioRecorder";
import { useState } from "react";
import { RouteProtection } from "~/components";
import { SpeechSynthesizerProvider } from "~/features/speech/providers/SpeechSynthesizerProvider";
import { VoiceToggleProvider } from "~/providers/VoiceToggleProvider";
import { VoiceToggle } from "~/components/VoiceToggle";




export default function ChatPage() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  return (
    <RouteProtection>
      <SpeechSynthesizerProvider autoLoadModel={true}>
        <VoiceToggleProvider>
          <div className="grid h-[calc(100dvh-4rem)] grid-cols-none md:grid-cols-[200px_minmax(0,1fr)] gap-x-2 px-4 py-4">
            <div>

            </div>
            <div className="flex flex-col h-full">
              {/* Voice toggle positioned below the assistant area */}
              <div className="flex justify-end mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Voice</span>
                  <VoiceToggle />
                </div>
              </div>
              <div className="flex-1">
                <Thread />
              </div>
            </div>
          </div>
        </VoiceToggleProvider>
      </SpeechSynthesizerProvider>
    </RouteProtection>
  )
}
