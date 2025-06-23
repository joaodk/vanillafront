"use client";

"use client";

import type { ReactNode } from "react";
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
} from "@assistant-ui/react";
import { backendApiCall } from "./lib/backendApiCall";
import { useAuthData } from "./lib/auth";

const VanillaModelAdapter: ChatModelAdapter = {
  async *run(options: any) {
    // Always yield once at the start to ensure this is an async generator
    yield { content: [] };

    const { messages, abortSignal, context } = options;
    // Use token from options (already injected by wrapper)
    let stream;
    try {
      stream = await backendApiCall(options, options.token);
    } catch (error) {
      yield {
        content: [],
        error: error instanceof Error ? error.message : String(error),
      };
      return;
    }

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
  const { token } = useAuthData();
  // Wrap the adapter to inject the token if not present in options
  const runtime = useLocalRuntime({
    ...VanillaModelAdapter,
    async *run(options: any) {
      // Always yield once at the start to ensure this is an async generator
      yield { content: [] };
      // Always inject the token from useAuthData if not present
      const mergedOptions = { ...options, token: options.token ?? token };
      // Ensure the correct async generator is returned
      try {
        const result = VanillaModelAdapter.run(mergedOptions);
        if (typeof result[Symbol.asyncIterator] === "function") {
          for await (const item of result) {
            yield item;
          }
        } else {
          // If not an async generator, yield the result as a single value
          yield await result;
        }
      } catch (error) {
        yield {
          content: [],
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
