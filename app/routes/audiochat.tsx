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

  // Function to handle inserting transcribed text into the composer
  const handleTranscriptionComplete = (text: string) => {
    // Find the composer input element
    const composerInput = document.querySelector('[data-testid="composer-input"]') as HTMLTextAreaElement;
    if (!composerInput) {
      // Fallback: try to find textarea with the specific placeholder
      const fallbackInput = document.querySelector('textarea[placeholder="Write a message..."]') as HTMLTextAreaElement;
      if (fallbackInput) {
        insertTextIntoInput(fallbackInput, text);
      }
      return;
    }
    insertTextIntoInput(composerInput, text);
  };

  // Helper function to insert text at cursor position or append
  const insertTextIntoInput = (input: HTMLTextAreaElement, text: string) => {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const currentValue = input.value;
    
    // Add space before text if there's existing content and it doesn't end with whitespace
    const textToInsert = currentValue && !currentValue.endsWith(' ') && !currentValue.endsWith('\n') 
      ? ` ${text}` 
      : text;
    
    // Insert text at cursor position
    const newValue = currentValue.substring(0, start) + textToInsert + currentValue.substring(end);
    
    // Update the input value
    input.value = newValue;
    
    // Trigger input event to notify React of the change
    const event = new Event('input', { bubbles: true });
    input.dispatchEvent(event);
    
    // Set cursor position after inserted text
    const newCursorPosition = start + textToInsert.length;
    input.setSelectionRange(newCursorPosition, newCursorPosition);
    
    // Focus the input
    input.focus();
  };

  return (
    <RouteProtection>
      <SpeechSynthesizerProvider autoLoadModel={true}>
        <VoiceToggleProvider>
          <TranscriptionProvider autoLoadModel={true}>
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
                  <span className="text-sm text-gray-600 dark:text-gray-400">Spoken answers</span>
                  <VoiceToggle />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Push spacebar to talk</span>
                  <SpacebarRecorder onTranscriptionComplete={handleTranscriptionComplete} />
                </div>
              </div>
            </div>
          </TranscriptionProvider>
        </VoiceToggleProvider>
      </SpeechSynthesizerProvider>
    </RouteProtection>
  )
}
