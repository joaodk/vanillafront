import { pipeline, env, read_audio } from '@xenova/transformers';

// Set the cache directory to a public path
env.cacheDir = './public/model';

export interface Progress {
  progress: number;
  // Add other properties if they exist in the progress object
}

class WhisperClient {
    private transcriber: any = null; // Use 'any' for now, or define a more specific type if available from @xenova/transformers
    private isLoaded: boolean = false;
    private isLoading: boolean = false;

    constructor() {
        // Constructor logic
    }

    async load(progressCallback?: (progress: Progress) => void): Promise<void> {
        if (this.isLoaded || this.isLoading) {
            console.log("Whisper model already loaded or loading.");
            return;
        }

        this.isLoading = true;
        console.log("Loading Whisper model...");

        try {
            this.transcriber = await pipeline(
                'automatic-speech-recognition',
                'Xenova/whisper-tiny', // You can choose different models like 'whisper-base', 'whisper-small', etc.
                {
                    progress_callback: progressCallback
                }
            );
            this.isLoaded = true;
            console.log("Whisper model loaded successfully.");
        } catch (error) {
            console.error("Error loading Whisper model:", error);
        } finally {
            this.isLoading = false;
        }
    }

    async transcribeAudio(audioBlob: Blob): Promise<string | null> {
        if (!this.isLoaded) {
            console.error("Whisper model not loaded. Please call load() first.");
            return null;
        }

        console.log("Transcribing audio...");
        let audioData: Float32Array | null = null;
        try {
            // Create a URL for the Blob
            const audioUrl = URL.createObjectURL(audioBlob);
            // Read the audio data
            audioData = await read_audio(audioUrl, 16000); // Specify sampling rate, e.g., 16000 Hz
            // Revoke the object URL to free up memory
            URL.revokeObjectURL(audioUrl);

            const result = await this.transcriber(audioData);
            console.log("Transcription complete:", result.text);
            return result.text;
        } catch (error) {
            console.error("Error transcribing audio:", error);
            return null;
        }
    }
}

export default WhisperClient;
