import type { Route } from "../+types/root";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { ThreadList } from "~/components/assistant-ui/thread-list";
import { Thread } from "~/components/assistant-ui/thread";


export default function ChatPage() {
  const runtime = useChatRuntime({
    api: "/api/chat",
  });  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="grid h-[calc(100dvh-4rem)] grid-cols-[200px_minmax(0,1fr)] gap-x-2 px-4 py-4">
        <ThreadList />
        <Thread />
      </div>
    </AssistantRuntimeProvider>  )
}
