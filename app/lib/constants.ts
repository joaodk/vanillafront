export let ENVIRONMENT = "PROD";
export const APP_TITLE = "Vanilla App";

if (import.meta.env.MODE === "development") {
  ENVIRONMENT = "DEV";
}

if (import.meta.env.VITE_ENVIRONMENT) {
  ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT;
}

// Development and production API base URLs
const DEV_API_BASE = "http://joaodk-devbox.tail0c7363.ts.net:8008";
const PROD_API_BASE = "https://g2ihdgat3d.execute-api.us-east-1.amazonaws.com";

// Determine the current API base based on environment
const CURRENT_API_BASE = ENVIRONMENT === "DEV" ? DEV_API_BASE : PROD_API_BASE;

// API endpoints
export const CHAT_API = ENVIRONMENT === "DEV"
  ? `${DEV_API_BASE}/chat`
  : `${PROD_API_BASE}/api/chat`;

export const AUDIO_CHAT_API = ENVIRONMENT === "DEV"
  ? `${DEV_API_BASE}/chat_succint`
  : `${PROD_API_BASE}/api/chat_succint`;

export const ANALYZE_API = ENVIRONMENT === "DEV"
  ? `${DEV_API_BASE}/analyze`
  : `${PROD_API_BASE}/api/analyze`;

export const WELCOME_MESSAGE = "Welcome! How can I help you today?";
export const SUGGESTED_QUERIES = [
  {
    prompt: "Hello!",
    label: "Hello!",
  },
  {
    prompt: "why is the sky blue?",
    label: "why is the sky blue?",
  },
];

// Audio recording configuration
export const MIN_RECORDING_LENGTH_MS = 1000; // Minimum recording length in milliseconds
export const MAX_RECORDING_LENGTH_MS = 5000; // Maximum recording length in milliseconds
