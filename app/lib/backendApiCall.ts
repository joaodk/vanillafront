import { CHAT_API } from "./constants";
import type { ChatModelRunOptions } from "../../node_modules/@assistant-ui/react/src/runtimes/local/ChatModelAdapter";

export async function backendApiCall(
  options: ChatModelRunOptions,
  getToken?: () => Promise<string | null>,
  endpoint?: string
): Promise<ReadableStream> {
  const { messages, abortSignal } = options;
  
  // Obtain token before making the API call
  let token: string | null = null;
  if (getToken) {
    try {
      // console.log('=== TOKEN FETCH ATTEMPT ===');
      // console.log('getToken function exists:', !!getToken);
      // console.log('getToken type:', typeof getToken);
      
      // Try without template first
      token = await getToken();
      // console.log('Token from getToken():', token);
      
      // If null, log why it might be null
      if (!token) {
        // console.log('Token was null - possible reasons:');
        // console.log('1. User not authenticated');
        // console.log('2. Token not yet loaded');
        // console.log('3. No JWT template configured');
        // console.log('4. Authentication session expired');
      }
      
      // Test and log token details
      // console.log('=== TOKEN DEBUG INFO ===');
      // console.log('Token exists:', !!token);
      // console.log('Token type:', typeof token);
      // console.log('Token length:', token ? token.length : 0);
      // console.log('Token first 20 chars:', token ? token.substring(0, 20) + '...' : 'null');
      // console.log('Token is empty string:', token === '');
      // console.log('Token is null:', token === null);
      // console.log('Token is undefined:', token === undefined);
      // console.log('========================');
      
    } catch (error) {
      // console.error('Error fetching token:', error);
    }
  } else {
    // console.log('=== TOKEN DEBUG INFO ===');
    // console.log('getToken function not provided');
    // console.log('========================');
  }
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
    // console.log('Authorization header added with token');
  } else {
    // console.log('No token available - Authorization header NOT added');
  }
    const curlHeaders = Object.entries(headers)
    .map(([key, value]) => `-H "${key}: ${value}"`)
    .join(" ");

  const apiEndpoint = endpoint || CHAT_API;

  const curlCommand = `curl -X POST ${apiEndpoint} ${curlHeaders} -d '${JSON.stringify({messages,})}'`;
//  console.log("curl command:", curlCommand);

  //console.log('Token value before API call:', token || 'No token provided (possibly not loaded yet)');
  // console.log('Making API call to:', apiEndpoint);
  // console.log('Request headers:', headers);

  const response = await fetch(apiEndpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      messages,
    }),
    signal: abortSignal,
  });

  // console.log('Response status:', response.status);
  // console.log('Response status text:', response.statusText);
  // console.log('Response ok:', response.ok);

  if (!response.ok) {
    // console.error('API call failed with status:', response.status);
    const errorText = await response.text();
    // console.error('Error response body:', errorText);
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error("ReadableStream not supported in this environment");
  }

  return response.body;
}
