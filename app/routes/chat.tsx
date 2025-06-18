import type { Route } from "../+types/root";

export default function ChatPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Chat</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <p className="text-gray-700 dark:text-gray-300">
          This is the chat page. Chat functionality will be implemented here.
        </p>
      </div>
    </div>
  )
}
