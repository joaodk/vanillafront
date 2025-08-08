import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

export const GenerateIcon: React.FC<IconProps> = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    aria-label="Generate Audio"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <polygon
      points="9,8 9,16 15,12"
      fill="currentColor"
    />
    <circle
      cx="16"
      cy="8"
      r="1.5"
      fill="currentColor"
    />
    <circle
      cx="19"
      cy="10"
      r="1"
      fill="currentColor"
    />
    <circle
      cx="18"
      cy="6"
      r="0.8"
      fill="currentColor"
    />
  </svg>
);

export const BusyLoadingIcon: React.FC<IconProps> = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`${className} animate-spin`}
    aria-label="Generating Audio"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeDasharray="31.416"
      strokeDashoffset="10"
      fill="none"
    />
    <circle cx="12" cy="6" r="2" fill="currentColor" />
    <circle cx="18" cy="12" r="1.5" fill="currentColor" />
    <circle cx="12" cy="18" r="1" fill="currentColor" />
    <circle cx="6" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

export const PlayIcon: React.FC<IconProps> = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    aria-label="Play Audio"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <polygon
      points="10,8 16,12 10,16"
      fill="currentColor"
    />
  </svg>
);

export const StopIcon: React.FC<IconProps> = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    aria-label="Stop Audio"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <rect
      x="9"
      y="9"
      width="6"
      height="6"
      rx="1"
      fill="currentColor"
    />
  </svg>
);

export const ErrorIcon: React.FC<IconProps> = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    aria-label="Error"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M15 9l-6 6m0-6l6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const AudioIcons = () => {
  return (
    <div className="p-8 bg-white dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">
        Audio Generation Icons
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* Generate Icon */}
        <div className="flex flex-col items-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <GenerateIcon size={64} className="mb-4 text-gray-600 dark:text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Generate
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Play button with sparkles for generating audio
          </p>
        </div>

        {/* Busy/Loading Icon */}
        <div className="flex flex-col items-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <BusyLoadingIcon size={64} className="mb-4 text-gray-600 dark:text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Generating
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Animated spinner for loading state
          </p>
        </div>

        {/* Play Icon */}
        <div className="flex flex-col items-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <PlayIcon size={64} className="mb-4 text-gray-600 dark:text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Play
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Classic play button with circle border
          </p>
        </div>

        {/* Stop Icon */}
        <div className="flex flex-col items-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <StopIcon size={64} className="mb-4 text-gray-600 dark:text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Stop
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Square stop icon with circle border
          </p>
        </div>

        {/* Error Icon */}
        <div className="flex flex-col items-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <ErrorIcon size={64} className="mb-4 text-gray-600 dark:text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Error
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            X mark in circle for error states
          </p>
        </div>

        {/* Usage Example */}
        <div className="flex flex-col items-center p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Usage Example
          </h3>
          <div className="flex space-x-4">
            <button className="p-3 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors">
              <GenerateIcon size={24} className="text-white" />
            </button>
            <button className="p-3 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors">
              <PlayIcon size={24} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Code Examples */}
      <div className="mt-12 bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          React Component Examples
        </h2>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-sm">
{`// Generate Icon Component
const GenerateIcon = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
    />
    <polygon
      points="9,8 9,16 15,12"
      fill="currentColor"
    />
    <circle cx="16" cy="8" r="1.5" fill="currentColor" />
    <circle cx="19" cy="10" r="1" fill="currentColor" />
    <circle cx="18" cy="6" r="0.8" fill="currentColor" />
  </svg>
);

// Play Icon Component
const PlayIcon = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
    <polygon points="10,8 16,12 10,16" fill="currentColor" />
  </svg>
);`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default AudioIcons;
