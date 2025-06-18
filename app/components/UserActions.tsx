import { SignedIn, SignedOut, UserButton, SignInButton } from '@clerk/react-router'
import { UserInfoTooltip } from './UserInfoTooltip'
import { DarkModeToggle } from './DarkModeToggle'

export function UserActions() {
  return (
    <div className="flex items-center space-x-4">
      <DarkModeToggle />
      <SignedOut>
        <SignInButton>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
            Sign In
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <div className="flex items-center space-x-2">
          <UserInfoTooltip />
          <UserButton />
        </div>
      </SignedIn>
    </div>
  )
}
