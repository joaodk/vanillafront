import React, { useEffect, useState } from "react";
import type { FC } from "react";
import ReactMarkdown from "react-markdown";
import VideoTextLearningPlayer from "~/components/drafts/VideoTextLearningPlayer";
import { RouteProtection } from "~/components";

const VideoTextLearningPage: FC = () => {
  const [markdown, setMarkdown] = useState("");

  useEffect(() => {
    fetch("/video-text-learning.md")
      .then((response) => response.text())
      .then((text) => setMarkdown(text));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <ReactMarkdown>{markdown}</ReactMarkdown>
      <VideoTextLearningPlayer />
    </div>
  );
};

export default VideoTextLearningPage;
