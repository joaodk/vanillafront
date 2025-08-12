# Transcription Feature Documentation

This document explains how to use the transcription feature, which leverages the `Xenova/whisper-tiny` model for automatic speech recognition.

## Components

The transcription feature is composed of three main parts:

1.  **`TranscriptionProvider`**: Manages the loading and state of the Whisper model and provides the `transcribeAudio` function to its children.
2.  **`TranscriptionSettings`**: A UI component that displays the current status and loading progress of the transcription model.
3.  **`TranscribeButton`**: A UI component that triggers the transcription process for a given audio URL and displays the result.

## Files to Copy for Reuse

To use the transcription feature in a new project, you will need to copy the following files and directories:

*   `app/providers/TranscriptionProvider.tsx`
*   `app/components/TranscriptionSettings.tsx`
*   `app/components/TranscribeButton.tsx`
*   `public/model/` (This directory contains the cached Whisper model files. Ensure `env.cacheDir` in `TranscriptionProvider.tsx` points to the correct path in your new project, e.g., `./public/model`.)

## Required Dependencies

The core transcription functionality relies on the `@xenova/transformers` library. You will need to install this package in your new project:

```bash
npm install @xenova/transformers
# or
yarn add @xenova/transformers
```

Additionally, the `TranscribeButton` and `TranscriptionSettings` components use UI elements that might require other dependencies. Based on the provided code, these include:

*   `react`
*   `@types/react` (for TypeScript projects)
*   `@radix-ui/react-tooltip` (for Tooltip component)
*   `lucide-react` (for icons, if used in `Button` or `Tooltip` components)
*   `tailwindcss` (for styling, if you want to maintain the current look)

You will also need the `Button` and `Tooltip` components from `app/components/ui/` if you want to use the `TranscribeButton` as is.

*   `app/components/ui/button.tsx`
*   `app/components/ui/tooltip.tsx`

## Usage in a New Project

Follow these steps to integrate the transcription feature into your new React project:

### 1. Copy Files

Copy the files listed in the "Files to Copy for Reuse" section to appropriate locations in your new project. A suggested new folder structure is provided below to simplify this.

### 2. Install Dependencies

Install `@xenova/transformers` and any other necessary UI dependencies (e.g., `@radix-ui/react-tooltip`) using your package manager.

### 3. Set up `TranscriptionProvider`

Wrap your application or the relevant part of your component tree with the `TranscriptionProvider`. This provider initializes the Whisper model and makes the `transcribeAudio` function available via the `useTranscription` hook.

```tsx
// In your main application file (e.g., App.tsx or main.tsx)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Your main application component
import { TranscriptionProvider } from './path/to/TranscriptionProvider'; // Adjust path

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TranscriptionProvider>
      <App />
    </TranscriptionProvider>
  </React.StrictMode>,
);
```

### 4. Use `TranscriptionSettings`

You can include the `TranscriptionSettings` component anywhere you want to display the model's status and loading progress.

```tsx
// In a component where you want to show settings
import React from 'react';
import TranscriptionSettings from './path/to/TranscriptionSettings'; // Adjust path

const MyPage: React.FC = () => {
  return (
    <div>
      <h1>My Application</h1>
      <TranscriptionSettings />
      {/* Other content */}
    </div>
  );
};

export default MyPage;
```

### 5. Use `TranscribeButton`

The `TranscribeButton` component requires an `audioUrl` prop. This URL should point to an audio file that you want to transcribe.

```tsx
// In a component where you want to add a transcribe button
import React from 'react';
import TranscribeButton from './path/to/TranscribeButton'; // Adjust path

const AudioPlayer: React.FC = () => {
  const audioFileUrl = "https://example.com/path/to/your/audio.mp3"; // Replace with your audio URL

  return (
    <div>
      <h2>Audio Playback</h2>
      <audio controls src={audioFileUrl}></audio>
      <TranscribeButton audioUrl={audioFileUrl} />
    </div>
  );
};

export default AudioPlayer;
```

## Example Usage Flow

1.  **Model Loading**: When `TranscriptionProvider` is mounted, it starts loading the Whisper model. `TranscriptionSettings` will show "Loading..." with progress.
2.  **Model Ready**: Once the model is loaded, `TranscriptionSettings` will show "Ready", and `TranscribeButton` will become active, displaying "Transcribe Audio".
3.  **Transcription**: When the user clicks "Transcribe Audio", the `TranscribeButton` will fetch the audio from the provided `audioUrl`, decode it, and pass it to the `transcribeAudio` function from the provider.
4.  **Result**: The transcription result will be displayed (e.g., via an alert or console log, as implemented in `TranscribeButton`).

## Suggested New Folder Structure for Reuse

To make the transcription components and provider more modular and easier to reuse, I suggest consolidating them into a dedicated `transcription` directory within your `app/` or `src/` folder.

```
your-new-project/
├── public/
│   └── model/
│       └── (whisper model files)
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   └── features/
│       └── transcription/
│           ├── components/
│           │   ├── TranscribeButton.tsx
│           │   └── TranscriptionSettings.tsx
│           ├── providers/
│           │   └── TranscriptionProvider.tsx
│           └── index.ts // Optional: for easier exports
│   └── components/
│       └── ui/
│           ├── button.tsx
│           └── tooltip.tsx
│   └── ... (other project files)
├── package.json
└── ...
```

This structure groups all related transcription logic and UI components, making it a self-contained module that can be easily copied and integrated into other projects.
