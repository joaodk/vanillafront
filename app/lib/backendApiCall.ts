import { CHAT_API } from "./constants";
import type { ChatModelRunOptions } from "../../node_modules/@assistant-ui/react/src/runtimes/local/ChatModelAdapter";

export async function backendApiCall(options: ChatModelRunOptions): Promise<ReadableStream> {
  const { messages, abortSignal } = options;
  const response = await fetch(CHAT_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
    }),
    signal: abortSignal,
  });

  if (!response.body) {
    throw new Error("ReadableStream not supported in this environment");
  }

  return response.body;
}
