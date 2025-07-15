export let ENVIRONMENT = "PROD";
export const APP_TITLE = "Vanilla App";

if (import.meta.env.MODE === "development") {
  ENVIRONMENT = "DEV";
}

if (import.meta.env.VITE_ENVIRONMENT) {
  ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT;
}

//export const CHAT_API = "http://localhost:8000/api/chat";
//export const T_API = "http://localhost:8008/chat";
//export const CHAT_API = "http://joaodk-devbox.tail0c7363.ts.net:8008/chat";
//export const CHAT_API = "https://g2ihdgat3d.execute-api.us-east-1.amazonaws.com/api/chat"
export const CHAT_API= "https://vplzcnegxgd52leldnygfzhoxa0knoop.lambda-url.us-east-1.on.aws/chat"

export const WELCOME_MESSAGE = "Welcome! How can I help you today?";
export const SUGGESTED_QUERIES = [
  {
    prompt: "What is the weather in tokyo like today?",
    label: "What is the weather in tokyo like today?",
  },
  {
    prompt: "What is assistant-ui?",
    label: "What is assistant-ui?",
  },
];
