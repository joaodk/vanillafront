import type { Route } from "../+types/root";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { useEdgeRuntime } from "@assistant-ui/react-edge";
import { CHAT_API } from "~/lib/constants";
import { ThreadList } from "~/components/assistant-ui/thread-list";
import { Thread } from "~/components/assistant-ui/thread";




export default function ChatPage() {

  

  
  return (
      <div className="grid h-[calc(100dvh-4rem)] grid-cols-[200px_minmax(0,1fr)] gap-x-2 px-4 py-4">
        <div>
          coming hopefully soon
        </div>
        <Thread />
      </div>

     )
}
