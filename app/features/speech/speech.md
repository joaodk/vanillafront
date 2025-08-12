# Speech Synthesis Feature

This document explains the speech synthesis feature, its components, and how to use and extend it within the application.

## Overview

The speech synthesis feature allows the application to convert text into spoken audio using a local ONNX Runtime model. It provides a React context provider for managing the speech synthesizer instance and related settings, and a `SpeakButton` component for easy integration into the UI.

## Components

### `SpeechSynthesizerProvider.tsx`

- **Location**: `app/features/speech/providers/SpeechSynthesizerProvider.tsx`
- **Purpose**: This is a React Context Provider that initializes and manages the `SpeechSynthesizer` class instance. It provides the speech synthesizer object, loading state, error state, selected voice, speech speed, and available voices to any component within its scope.
- **Usage**: Wrap your application or a part of your component tree with `SpeechSynthesizerProvider` to make the speech synthesis capabilities available to child components.

```typescript
import { SpeechSynthesizerProvider } from '../features/speech';

function App() {
  return (
    <SpeechSynthesizerProvider>
      {/* Your application components */}
    </SpeechSynthesizerProvider>
  );
}
```

### `useSpeechSynthesizer` Hook

- **Location**: Exported from `app/features/speech/providers/SpeechSynthesizerProvider.tsx`
- **Purpose**: A custom React hook to easily access the speech synthesizer context.
- **Usage**:
```typescript
import { useSpeechSynthesizer } from '../features/speech';

function MyComponent() {
  const { speechSynthesizer, isLoading, error, selectedVoice, setSelectedVoice, speechSpeed, setSpeechSpeed, voices } = useSpeechSynthesizer();

  // Use these values to interact with the speech synthesis feature
  // e.g., speechSynthesizer.synthesizeSpeech("Hello", selectedVoice, speechSpeed);
}
```

### `SpeakButton.tsx`

- **Location**: `app/features/speech/components/SpeakButton.tsx`
- **Purpose**: A React component that provides a UI button to trigger speech synthesis for a given text. It handles loading, playing, and stopping states.
- **Usage**:
```typescript
import { SpeakButton } from '../features/speech';

function MyPage() {
  const textToSpeak = "This is an example sentence.";
  return (
    <SpeakButton text={textToSpeak} className="my-custom-button-style" />
  );
}
```

### `SpeechSettings.tsx`

- **Location**: `app/features/speech/components/SpeechSettings.tsx`
- **Purpose**: A React component that provides UI controls for configuring speech synthesis settings, such as selecting a voice and adjusting speech speed. It consumes the `useSpeechSynthesizer` hook.
- **Usage**:
```typescript
import { SpeechSettings } from '../features/speech';

function UserProfileSettings() {
  return (
    <div>
      <h3>Speech Preferences</h3>
      <SpeechSettings />
    </div>
  );
}
```

## `SpeechSynthesizer` Class

- **Location**: Defined within `app/features/speech/providers/SpeechSynthesizerProvider.tsx`
- **Purpose**: This class encapsulates the core logic for loading the ONNX model, phonemizing text, synthesizing speech, and playing audio. It uses `onnxruntime-web` for model inference and `phonemizer` for text-to-phoneme conversion.
- **Key Methods**:
    - `loadModel()`: Asynchronously loads the ONNX model and voice data.
    - `synthesizeSpeech(text: string, selectedVoice: string, speechSpeed: number)`: Synthesizes audio from text using the loaded model and returns a URL to the generated audio.
    - `playAudio(url: string, onAudioEnd?: () => void)`: Plays the audio from a given URL.
    - `stopAudio()`: Stops any currently playing audio.
    - `fallbackToBrowserSpeech(text: string)`: Uses the browser's native speech synthesis as a fallback if the model-based synthesis fails or is not supported.

## How it Works

1. **Model Loading**: The `SpeechSynthesizerProvider` initializes the `SpeechSynthesizer` class and calls `loadModel()` to fetch the `kitten_tts_nano_v0_1.onnx` model and `voices.json` from the `/public/model` directory.
2. **Text Processing**: When `synthesizeSpeech` is called, the input text is first converted into phonemes using the `phonemize` library. A custom `TextCleaner` class then converts these phonemes into numerical token IDs.
3. **Inference**: The token IDs, selected voice style (from `voices.json`), and desired speech speed are fed as tensors to the ONNX Runtime session.
4. **Audio Generation**: The ONNX model outputs raw audio data (Float32Array). This data is then normalized and converted into a WAV audio buffer.
5. **Audio Playback**: The WAV audio buffer is converted into a Blob and a URL, which is then used to play the audio via an HTMLAudioElement.

## Reusability and Extension

- **Reusing Components**: The `SpeakButton` and `SpeechSettings` components can be easily dropped into any part of the UI where speech synthesis interaction or configuration is needed.
- **Customizing Voices/Models**: To add new voices or update the TTS model, replace or modify `public/model/voices.json` and `public/model/kitten_tts_nano_v0_1.onnx`. Ensure the `voices.json` structure matches the expected `Voice` interface.
- **Extending `SpeechSynthesizer`**: For advanced use cases, you can directly interact with the `SpeechSynthesizer` class instance obtained from `useSpeechSynthesizer` to implement custom speech logic beyond what the provided components offer.
- **Error Handling**: The `useSpeechSynthesizer` hook exposes `isLoading` and `error` states, allowing components to display appropriate UI feedback during model loading or synthesis failures.
- **Fallback Mechanism**: The `fallbackToBrowserSpeech` method provides a graceful degradation to native browser speech synthesis, ensuring basic functionality even if the custom model fails to load or synthesize.

This refactoring centralizes the speech synthesis logic and UI, making it more maintainable and easier to understand.
