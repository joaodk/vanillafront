import { type FC, useState, useRef, useEffect } from "react";
import AudioRecorder from "../components/AudioRecorder";

interface Recording {
  id: string;
  name: string;
  duration: number; // in seconds
  audioBlob: Blob;
  audioUrl: string;
}

const AudioClipRecordingPage: FC = () => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [script, setScript] = useState<string>(""); // New state for the script
  const [title, setTitle] = useState<string>(""); // New state for the title

  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

  // Load script and title from localStorage on component mount
  useEffect(() => {
    const savedScript = localStorage.getItem("audioClipScript");
    if (savedScript) {
      setScript(savedScript);
    }
    const savedTitle = localStorage.getItem("audioClipTitle");
    if (savedTitle) {
      setTitle(savedTitle);
    }
  }, []);

  // Save script to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("audioClipScript", script);
  }, [script]);

  // Save title to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("audioClipTitle", title);
  }, [title]);

  const generateRandomAlphanumeric = (length: number) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0987654321';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };

  const handleRecordingComplete = async (audioBlob: Blob, fileName: string) => {
    let duration = 0;
    try {
      const audioContext = new window.AudioContext();
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      duration = audioBuffer.duration;
    } catch (error) {
      console.error("Error decoding audio data:", error);
      // Fallback to approximate duration if decoding fails
      duration = audioBlob.size / 1000; 
    }

    const newRecording: Recording = {
      id: Date.now().toString(),
      name: generateRandomAlphanumeric(10), // Random 10-character alphanumeric name
      duration: Math.round(duration), // Round to nearest second
      audioBlob: audioBlob,
      audioUrl: URL.createObjectURL(audioBlob),
    };
    setRecordings((prev) => [...prev, newRecording]);
  };

  const handlePlayPause = (id: string) => {
    const audio = audioRefs.current[id];
    if (audio) {
      if (playingId === id) {
        audio.pause();
        setPlayingId(null);
      } else {
        if (playingId && audioRefs.current[playingId]) {
          audioRefs.current[playingId]?.pause();
        }
        audio.play();
        setPlayingId(id);
        audio.onended = () => setPlayingId(null);
      }
    }
  };

  const handleSave = (recording: Recording) => {
    const baseFileName = `${title}-${recording.name}`;

    // Save audio recording
    const audioLink = document.createElement("a");
    audioLink.href = recording.audioUrl;
    audioLink.download = `${baseFileName}.wav`; // Save as WAV format
    document.body.appendChild(audioLink);
    audioLink.click();
    document.body.removeChild(audioLink);

    // Save script
    if (script) {
      const scriptBlob = new Blob([script], { type: "text/plain" });
      const scriptUrl = URL.createObjectURL(scriptBlob);
      const scriptLink = document.createElement("a");
      scriptLink.href = scriptUrl;
      scriptLink.download = `${baseFileName}.txt`;
      document.body.appendChild(scriptLink);
      scriptLink.click();
      document.body.removeChild(scriptLink);
      URL.revokeObjectURL(scriptUrl); // Clean up the object URL
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Audio Clip Recording</h1>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Title</h2>
        <input
          type="text"
          className="w-full p-4 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          placeholder="Enter title here..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Script</h2>
        <textarea
          className="w-full p-4 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
          rows={10}
          placeholder="Type your script here..."
          value={script}
          onChange={(e) => setScript(e.target.value)}
        ></textarea>
      </div>

      <div className="mt-8">
        <AudioRecorder onRecordingComplete={handleRecordingComplete} />
      </div>

      {recordings.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Your Recordings</h2>
                  <table className="min-w-full bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <thead className="dark:bg-gray-700 dark:text-gray-200">
              <tr>
                <th className="py-2 px-4 border-b dark:border-gray-600 text-left">Name</th>
                <th className="py-2 px-4 border-b dark:border-gray-600 text-left">Duration (s)</th>
                <th className="py-2 px-4 border-b dark:border-gray-600 text-left">Controls</th>
                <th className="py-2 px-4 border-b dark:border-gray-600 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="dark:text-gray-100">
              {recordings.map((recording) => (
                <tr key={recording.id}>
                  <td className="py-2 px-4 border-b dark:border-gray-600 text-left">{recording.name}</td>
                  <td className="py-2 px-4 border-b dark:border-gray-600 text-left">{recording.duration}</td>
                  <td className="py-2 px-4 border-b dark:border-gray-600 text-left">
                    <audio
                      ref={(el) => {
                        audioRefs.current[recording.id] = el;
                      }}
                      src={recording.audioUrl}
                      preload="auto"
                    />
                    <button
                      onClick={() => handlePlayPause(recording.id)}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded"
                    >
                      {playingId === recording.id ? "Pause" : "Play"}
                    </button>
                  </td>
                  <td className="py-2 px-4 border-b dark:border-gray-600 text-left">
                    <button
                      onClick={() => handleSave(recording)}
                      className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded"
                    >
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AudioClipRecordingPage;
