import { type FC } from "react";

interface SpeakButtonProps {
  text: string;
}

const SpeakButton: FC<SpeakButtonProps> = ({ text }) => {
  const handleSpeak = () => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Web Speech API is not supported in this browser.");
    }
  };

  return (
    <button
      onClick={handleSpeak}
      className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
    >
      Speak
    </button>
  );
};

export default SpeakButton;
