import { type FC, useState, useRef } from "react";
import { SpeakButton } from "../../features/speech";
import AudioRecorder from "../AudioRecorder";
import { TranscribeButton } from "../";

interface AudioSpeechPanelProps {
  // Props can be added here if needed for customization
}

const AudioSpeechPanel: FC<AudioSpeechPanelProps> = () => {
  const [textToSpeak, setTextToSpeak] = useState("hello! i am talking");
  const [recordedAudios, setRecordedAudios] = useState<{ blob: Blob; name: string; url: string }[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  const handleRecordingComplete = (audioBlob: Blob, fileName: string) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    setRecordedAudios((prev) => [...prev, { blob: audioBlob, name: fileName, url: audioUrl }]);
  };

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play();
  };

  return (
    <div>
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
    </div>
  );
};

export default AudioSpeechPanel;
