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

    if (!stream) return;

    const reader = stream.getReader();
    const textDecoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode and split into one or more JSON chunk objects
        const text = textDecoder.decode(value);
        const chunks: any[] = [];

        try {
          const obj = JSON.parse(text);
          if (obj.statusCode && typeof obj.body === "string") {
            // aggregated response: extract successive JSON objects from the body
            const body = obj.body;
            let pos = 0;
            while (pos < body.length) {
              pos = body.indexOf("{", pos);
              if (pos < 0) break;
              let depth = 0;
              for (let i = pos; i < body.length; i++) {
                if (body[i] === "{") depth++;
                else if (body[i] === "}") depth--;
                if (depth === 0) {
                  const piece = body.slice(pos, i + 1);
                  chunks.push(JSON.parse(piece));
                  pos = i + 1;
                  break;
                }
              }
            }
          } else {
            // normal streaming JSON
            chunks.push(obj);
          }
        } catch {
          // fallback for newline-delimited JSON
          text.split("\n").forEach((line) => {
            if (line.trim()) {
              chunks.push(JSON.parse(line));
            }
          });
        }

        // process each extracted chunk
        for (const chunk of chunks) {
          const delta = chunk.choices?.[0]?.delta;

          // collect text content
          if (delta?.content) {
            content += delta.content;
          }

          // collect tool calls
          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              if (!toolCalls[tc.index]) {
                toolCalls[tc.index] = {
                  id: tc.id,
                  type: "function",
                  function: { name: "", arguments: "" },
                };
              }
              if (tc.function?.name) {
                toolCalls[tc.index].function.name = tc.function.name;
              }
              if (tc.function?.arguments) {
                toolCalls[tc.index].function.arguments +=
                  tc.function.arguments;
              }
            }
          }

          // yield incremental updates
          yield {
            content: [
              ...(content ? [{ type: "text" as const, text: content }] : []),
              ...toolCalls.map((item) => ({
                type: "tool-call" as const,
                toolCallId: item.id,
                toolName: item.function.name,
                args: JSON.parse(item.function.arguments || "{}"),
                argsText: item.function.arguments || "{}",
              })),
            ],
          };
        }
      }
    } catch (error) {
      console.error("Error reading stream:", error);
    } finally {
      reader.releaseLock();
    }
  },
};

export function VanillaRuntimeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { token } = useAuthData();
  const runtime = useLocalRuntime({
    ...VanillaModelAdapter,
    async *run(options: any) {
      // initial yield
      yield { content: [] };
      const merged = { ...options, token: options.token ?? token };
      try {
        const result = VanillaModelAdapter.run(merged);
        if (typeof result[Symbol.asyncIterator] === "function") {
          for await (const item of result) {
            yield item;
          }
        } else {
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
