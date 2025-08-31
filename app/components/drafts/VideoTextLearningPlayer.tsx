import React, { useEffect, useState, useRef, type DragEvent } from "react";
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
  const [currentSubtitle, setCurrentSubtitle] = useState<SubtitleEntry | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showFileSelection, setShowFileSelection] = useState(true); // New state for visibility
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    let videoFileLoaded = false;
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("video/")) {
        setVideoSrc(URL.createObjectURL(file));
        videoFileLoaded = true;
      } else if (file.name.endsWith(".srt")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target && typeof e.target.result === "string") {
            setParsedSubtitles(parseSrt(e.target.result));
          }
        };
        reader.readAsText(file);
      }
    });

    if (videoFileLoaded) {
      setShowFileSelection(false); // Hide file selection after video is loaded
    }
  };

  const handleVideoChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
  };

  const handleSubtitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
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

  const handleClearMedia = () => {
    setVideoSrc(null);
    setParsedSubtitles([]);
    setCurrentSubtitle(null);
    setShowFileSelection(true); // Show file selection again
  };

  // Helper function to convert time string to seconds
  const convertTimeToSeconds = (timeString: string): number => {
    const [hours, minutes, secondsAndMs] = timeString.split(':');
    const [seconds, milliseconds] = secondsAndMs.split(',');
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds) + parseInt(milliseconds) / 1000;
  };

  // Track video time and update current subtitle
  useEffect(() => {
    const video = videoRef.current;
    if (!video || parsedSubtitles.length === 0) return;

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      const matchingSubtitle = parsedSubtitles.find(sub => {
        const start = convertTimeToSeconds(sub.startTime);
        const end = convertTimeToSeconds(sub.endTime);
        return currentTime >= start && currentTime <= end;
      });
      setCurrentSubtitle(matchingSubtitle || null);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [parsedSubtitles]);

  return (
    <div className="mt-8">
      {showFileSelection && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
            isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900" : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <h2 className="text-2xl font-bold mb-4">Video & Subtitle Player</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">Drag & Drop Video (.mp4) and Subtitle (.srt) files here, or use the buttons below.</p>

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
        </div>
      )}

      {videoSrc && (
        <div className="relative w-full max-w-full mx-auto mt-8 mb-4">
          <video ref={videoRef} controls src={videoSrc} className="w-full rounded-lg shadow-md">
            Your browser does not support the video tag.
          </video>
          <button
            onClick={handleClearMedia}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 text-xs font-bold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
            aria-label="Clear Video"
          >
            X
          </button>
        </div>
      )}

      {parsedSubtitles.length > 0 && (
        <div className="mt-4 relative">

          <div className="p-4 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 h-[700px] overflow-y-auto">
            {parsedSubtitles.map((subtitle, index) => (
              <span
                key={subtitle.id}
                className={`cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 rounded-sm px-1 text-xl my-1 ${
                  currentSubtitle?.id === subtitle.id 
                    ? 'bg-yellow-200 dark:bg-yellow-600 border-2 border-yellow-400 dark:border-yellow-500' 
                    : ''
                }`}
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
