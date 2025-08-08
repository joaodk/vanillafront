import { useUser } from '@clerk/react-router'
import { useState, useCallback } from 'react'
import { useAuthData } from '../lib/auth'
import SpeechSettings from './SpeechSettings'

const safeDateString = (date: Date | null | undefined) => {
  if (!date) return 'Unknown'
  return new Date(date).toLocaleDateString()
}

export function UserInfoTooltip() {
  const { user } = useUser()
  const { hasLoaded, freeUser, fullAccess, premium, token } = useAuthData()

  const [showTooltip, setShowTooltip] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyTokenToClipboard = useCallback(() => {
    if (token) {
      // Use a fallback implementation for copying to clipboard
      const textArea = document.createElement("textarea");
      textArea.value = token;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          console.error('Failed to copy token using fallback.');
        }
      } catch (err) {
        console.error('Failed to copy token: ', err);
      }
      document.body.removeChild(textArea);
    }
  }, [token]);

  if (!user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        className="p-1 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {showTooltip && (
        <div
          className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50"
        >
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              {user.imageUrl && (
                <img
                  src={user.imageUrl}
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {user.fullName || user.firstName || 'User'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Member since: {safeDateString(user.createdAt)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Last sign in: {safeDateString(user.lastSignInAt || user.createdAt)}
              </p>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
              {hasLoaded ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  free_user: {freeUser}
                  <br />
                  full_access: {fullAccess}
                  <br />
                  premium: {premium}
                </p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Loading...
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {premium && `, ${premium}`}
              </p>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Token: {token && token.length > 20 ? `${token.substring(0, 20)}...` : token}
                </p>
                <button
                  onClick={copyTokenToClipboard}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 transition-colors"
                  title="Copy token to clipboard"
                >
                  {copied ? (
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy
                    </span>
                  )}
                </button>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Speech Settings</h4>
              <SpeechSettings />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
