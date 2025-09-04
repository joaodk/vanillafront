import { useVoiceToggle } from '../providers/VoiceToggleProvider';

export function VoiceToggle() {
  const { isVoiceEnabled, toggleVoice } = useVoiceToggle();

  return (
    <button
      onClick={toggleVoice}
      className={`p-2 rounded-md transition-colors ${
        isVoiceEnabled 
          ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 dark:hover:bg-blue-900/50' 
          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
      aria-label={isVoiceEnabled ? 'Disable voice responses' : 'Enable voice responses'}
      title={isVoiceEnabled ? 'Voice responses enabled' : 'Voice responses disabled'}
    >
      {isVoiceEnabled ? (
        // Volume/Speaker icon for enabled state
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M6 15a2 2 0 01-2-2V11a2 2 0 012-2h2l3.5-3v10l-3.5-3H6z" />
        </svg>
      ) : (
        // Volume muted/off icon for disabled state
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
        </svg>
      )}
    </button>
  );
}
