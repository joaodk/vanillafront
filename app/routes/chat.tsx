import type { Route } from "../+types/root";
import { CHAT_API } from "~/lib/constants";
import { Thread } from "~/components/assistant-ui/thread";
import { VanillaRuntimeProvider } from "~/VanillaRuntimeProvider";
import { useState } from "react";
import { RouteProtection } from "~/components";

export default function ChatPage() {
  return (
    <RouteProtection>
      <div className="grid h-[calc(100dvh-4rem)] grid-cols-none md:grid-cols-[200px_minmax(0,1fr)] gap-x-2 px-4 py-4">
        <div />
        <div className="flex flex-col h-full relative">
          <div className="flex-1">
            <VanillaRuntimeProvider endpoint={CHAT_API}>
              <Thread />
            </VanillaRuntimeProvider>
          </div>
        </div>
      </div>
    </RouteProtection>
  );
}
