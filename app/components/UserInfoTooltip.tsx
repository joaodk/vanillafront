import { useUser } from '@clerk/react-router'
import { useState } from 'react'

export function UserInfoTooltip() {
  const { user } = useUser()
  const [showTooltip, setShowTooltip] = useState(false)

  if (!user) return null

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="p-1 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      
      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50">
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
                Member since: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Last sign in: {(user.lastSignInAt || user.createdAt) ? new Date(user.lastSignInAt || user.createdAt!).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
