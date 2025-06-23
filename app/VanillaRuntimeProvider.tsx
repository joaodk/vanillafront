"use client";

"use client";

import type { ReactNode } from "react";
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
} from "@assistant-ui/react";
import { backendApiCall } from "./lib/backendApiCall";

const VanillaModelAdapter: ChatModelAdapter = {
  async *run(options) {
    const { messages, abortSignal, context } = options;
    const stream = await backendApiCall(options);

    let content = "";
    const toolCalls: any[] = [];

    if (stream) {
      const reader = stream.getReader();
      const textDecoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          const chunk = JSON.parse(textDecoder.decode(value));
          const delta = chunk.choices[0]?.delta;

          // Handle text content
          if (delta?.content) {
            content += delta.content;
          }

          // Handle tool calls
          if (delta?.tool_calls) {
            for (const toolCall of delta.tool_calls) {
              if (!toolCalls[toolCall.index]) {
                toolCalls[toolCall.index] = {
                  id: toolCall.id,
                  type: "function",
                  function: { name: "", arguments: "" },
                };
              }

              if (toolCall.function?.name) {
                toolCalls[toolCall.index].function.name = toolCall.function.name;
              }

              if (toolCall.function?.arguments) {
                toolCalls[toolCall.index].function.arguments +=
                  toolCall.function.arguments;
              }
            }
          }

          // Yield current state
          yield {
            content: [
              ...(content ? [{ type: "text" as const, text: content }] : []),
              ...toolCalls.map((tc) => ({
                type: "tool-call" as const,
                toolCallId: tc.id,
                toolName: tc.function.name,
                args: JSON.parse(tc.function.arguments || "{}"),
                argsText: tc.function.arguments || "{}",
              })),
            ],
          };
        }
      } catch (error) {
        console.error("Error reading stream:", error);
      } finally {
        reader.releaseLock();
      }
    }
  },
};

export function VanillaRuntimeProvider({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const runtime = useLocalRuntime(VanillaModelAdapter);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
