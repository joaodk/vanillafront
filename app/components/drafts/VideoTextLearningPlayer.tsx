import React, { useEffect, useState, useRef } from "react";
import type { FC, ChangeEvent } from "react";

interface SubtitleEntry {
  id: number;
  startTime: string;
  endTime: string;
  text: string;
}

const VideoTextLearningPlayer: FC = () => {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [parsedSubtitles, setParsedSubtitles] = useState<SubtitleEntry[]>([]);
  const [hoveredSubtitle, setHoveredSubtitle] = useState<SubtitleEntry | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setVideoSrc(URL.createObjectURL(file));
    }
  };

  const parseSrt = (srtContent: string): SubtitleEntry[] => {
    const entries: SubtitleEntry[] = [];
    const blocks = srtContent.split(/\r?\n\r?\n/); // Split by double newlines

    blocks.forEach((block) => {
      const lines = block.split(/\r?\n/);
      if (lines.length >= 3) {
        const id = parseInt(lines[0], 10);
        const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
        if (id && timeMatch) {
          const startTime = timeMatch[1];
          const endTime = timeMatch[2];
          const text = lines.slice(2).join(" ").replace(/<[^>]*>/g, '').trim(); // Join text lines and remove HTML tags

          entries.push({ id, startTime, endTime, text });
        }
      }
    });
    return entries;
  };

  const handleSubtitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === "string") {
          const srtContent = e.target.result;
          setParsedSubtitles(parseSrt(srtContent));
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSubtitleClick = (subtitle: SubtitleEntry) => {
    setHoveredSubtitle(subtitle);
    if (videoRef.current) {
      const [hours, minutes, secondsAndMs] = subtitle.startTime.split(':');
      const [seconds, milliseconds] = secondsAndMs.split(',');
      const totalSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds) + parseInt(milliseconds) / 1000;
      videoRef.current.currentTime = totalSeconds;
      videoRef.current.play();
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Video & Subtitle Player</h2>
      
      <div className="mb-4">
        <label htmlFor="video-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Select Video (.mp4):
        </label>
        <input
          id="video-upload"
          type="file"
          accept="video/mp4"
          onChange={handleVideoChange}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {videoSrc && (
        <video ref={videoRef} controls src={videoSrc} className="w-full max-w-3xl mx-auto mb-4 rounded-lg shadow-md">
          Your browser does not support the video tag.
        </video>
      )}

      <div className="mb-4">
        <label htmlFor="subtitle-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Select Subtitle (.srt):
        </label>
        <input
          id="subtitle-upload"
          type="file"
          accept=".srt"
          onChange={handleSubtitleChange}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {parsedSubtitles.length > 0 && (
        <div className="mt-4 relative">
          <h3 className="text-xl font-semibold mb-2">Subtitles:</h3>
          <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 h-96 overflow-y-auto">
            {parsedSubtitles.map((subtitle, index) => (
              <span
                key={subtitle.id}
                className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 rounded-sm px-1 text-lg"
                onClick={() => handleSubtitleClick(subtitle)}
                onMouseEnter={() => setHoveredSubtitle(subtitle)}
                onMouseLeave={() => setHoveredSubtitle(null)}
              >
                {subtitle.text}{" "}
              </span>
            ))}
          </div>
          {hoveredSubtitle && (
            <React.Fragment>
              <div className="subtitle-popup bg-gray-800 text-white text-xs p-2 rounded shadow-lg z-10">
                {`${hoveredSubtitle.startTime} --> ${hoveredSubtitle.endTime}`}
              </div>
            </React.Fragment>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoTextLearningPlayer;
