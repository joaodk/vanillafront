import type { Route } from "../+types/root";
import { AUDIO_CHAT_API } from "~/lib/constants";
import { Thread } from "~/components/assistant-ui/thread";
import { VanillaRuntimeProvider } from "~/VanillaRuntimeProvider";
import { useState } from "react";
import { RouteProtection } from "~/components";
import { SpeechSynthesizerProvider } from "~/features/speech/providers/SpeechSynthesizerProvider";
import { VoiceToggleProvider } from "~/providers/VoiceToggleProvider";
import { VoiceToggle } from "~/components/VoiceToggle";
import { TranscriptionProvider } from "~/features/transcription/providers/TranscriptionProvider";
import { SpacebarRecorder } from "~/components/SpacebarRecorder";



export default function AudioChatPage() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  return (
    <RouteProtection>
            <div className="grid h-[calc(100dvh-4rem)] grid-cols-none md:grid-cols-[200px_minmax(0,1fr)] gap-x-2 px-4 py-4">
              <div>

              </div>
              <div className="flex flex-col h-full relative">
                <div className="flex-1">
                  <VanillaRuntimeProvider endpoint={AUDIO_CHAT_API}>
                    <Thread />
                  </VanillaRuntimeProvider>
                </div>
              </div>
              
              {/* Voice controls positioned at bottom-left of screen */}
              <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-10">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Speak answer</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">-coming soon-</span>
                </div>
              </div>
            </div>


    </RouteProtection>
  )
}
