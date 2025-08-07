import { type FC, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import SpeakButton from "../components/SpeakButton";

const AboutPage: FC = () => {
  const [markdown, setMarkdown] = useState("");
  const [textToSpeak, setTextToSpeak] = useState("hello! i am talking");

  useEffect(() => {
    fetch("/about.md")
      .then((response) => response.text())
      .then((text) => setMarkdown(text));
  }, []);

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
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
};

export default AboutPage;
