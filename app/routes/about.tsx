import { type FC, useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import SpeakButton from "../components/SpeakButton";
import AudioRecorder from "../components/AudioRecorder";
import TranscribeButton from "../components/TranscribeButton";


const AboutPage: FC = () => {
  const [markdown, setMarkdown] = useState("");
  const [textToSpeak, setTextToSpeak] = useState("hello! i am talking");
  const [recordedAudios, setRecordedAudios] = useState<{ blob: Blob; name: string; url: string }[]>([]);
  const [audioBufferToTranscribe, setAudioBufferToTranscribe] = useState<AudioBuffer | undefined>(undefined);
  const [transcriptionResult, setTranscriptionResult] = useState<string | null>(null);
  const [showTranscriptionPopup, setShowTranscriptionPopup] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    fetch("/about.md")
      .then((response) => response.text())
      .then((text) => setMarkdown(text));

    // Initialize AudioContext
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

    const loadInitialAudio = async () => {
      try {
        const response = await fetch("https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/ted_60_16k.wav");
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudios([{ blob: audioBlob, name: "ted_60_16k.wav", url: audioUrl }]);
      } catch (error) {
        console.error("Error loading initial audio:", error);
      }
    };

    loadInitialAudio();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const handleRecordingComplete = (audioBlob: Blob, fileName: string) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    setRecordedAudios((prev) => [...prev, { blob: audioBlob, name: fileName, url: audioUrl }]);
  };

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play();
  };


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-4">
        <input
          type="text"
          value={textToSpeak}
          onChange={(e) => setTextToSpeak(e.target.value)}
          className="flex-grow p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />
        <SpeakButton text={textToSpeak} />
      </div>

      <div className="mb-4">
        <AudioRecorder onRecordingComplete={handleRecordingComplete} />
      </div>

      {recordedAudios.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Recorded Audios:</h3>
          <ul className="list-disc pl-5">
            {recordedAudios.map((audio, index) => (
              <li key={index} className="flex items-center justify-between py-1">
                <span>{audio.name}</span>
                <div className="flex items-center">
                  <button
                    className="ml-4 px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
                    onClick={() => playAudio(audio.url)}
                  >
                    Play
                  </button>
                  <TranscribeButton audioUrl={audio.url} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}



      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
};

export default AboutPage;
