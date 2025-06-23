import { CHAT_API } from "./constants";
import type { ChatModelRunOptions } from "../../node_modules/@assistant-ui/react/src/runtimes/local/ChatModelAdapter";
import { useUser } from '@clerk/react-router'
import { useAuth } from "@clerk/clerk-react";
import { useState, useEffect } from 'react'
export async function backendApiCall(options: ChatModelRunOptions, token?: string): Promise<ReadableStream> {
  const { messages, abortSignal } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;

  }
  
  //console.log('Token value before API call:', token || 'No token provided (possibly not loaded yet)');
  
  const response = await fetch(CHAT_API, {
    method: "POST",
    headers,
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
