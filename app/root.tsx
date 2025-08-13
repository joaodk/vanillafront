import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  Link,
} from "react-router";

import { ClerkProvider } from '@clerk/react-router'
import { useState } from 'react'

import type { Route } from "./+types/root";
import "./app.css";

import { rootAuthLoader } from '@clerk/react-router/ssr.server'
import { dark } from '@clerk/themes'
import './app.css'
import { NavigationBar, ThemeProvider, useTheme } from './components'
import { SidebarNavigation } from './components/SidebarNavigation';
import { SpeechSynthesizerProvider } from './features/speech';
import { TranscriptionProvider } from './features/transcription/providers/TranscriptionProvider';

import { VanillaRuntimeProvider } from "./VanillaRuntimeProvider";

export async function loader(args: Route.LoaderArgs) {
  return rootAuthLoader(args)
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  { rel: 'stylesheet', href: '/app/app.css' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <link rel="icon" href="/vanilla-favicon.png" />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function ClerkProviderWithTheme({ children, loaderData }: { children: React.ReactNode, loaderData: any }) {
  const { isDark } = useTheme()
  
  return (
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: isDark ? dark : undefined,
      }}
      loaderData={loaderData}
      signUpFallbackRedirectUrl="/"
      signInFallbackRedirectUrl="/"
    >
      {children}
    </ClerkProvider>
  )
}

function AppContent(props: Route.ComponentProps) {
  const { loaderData } = props
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <ClerkProviderWithTheme loaderData={loaderData}>
      <VanillaRuntimeProvider>
        <SpeechSynthesizerProvider>
          <TranscriptionProvider>
            {/* Sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <SidebarNavigation onLinkClick={() => setIsSidebarOpen(false)} />
        </div>
      </div>

      <NavigationBar onMenuClick={() => setIsSidebarOpen(true)} />
      <main className="min-h-[calc(100vh-4rem)]">
        <Outlet />
      </main>
          </TranscriptionProvider>
        </SpeechSynthesizerProvider>
      </VanillaRuntimeProvider>
    </ClerkProviderWithTheme>
  )
}

export default function App(props: Route.ComponentProps) {
  return (
    <ThemeProvider>
      <AppContent {...props} />
    </ThemeProvider>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
