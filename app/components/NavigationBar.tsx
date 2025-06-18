import { HamburgerButton } from './HamburgerButton'
import { UserActions } from './UserActions'

interface NavigationBarProps {
  onMenuClick: () => void
}

export function NavigationBar({ onMenuClick }: NavigationBarProps) {
  return (
    <nav className="bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <HamburgerButton onClick={onMenuClick} />
          </div>
          <UserActions />
        </div>
      </div>
    </nav>
  )
}
