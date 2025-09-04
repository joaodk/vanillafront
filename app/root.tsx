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
import { useState, useEffect, Component } from 'react'

import type { Route } from "./+types/root";
import "./app.css";

import { dark } from '@clerk/themes'
import './app.css'
import { NavigationBar, ThemeProvider, useTheme } from './components'
import { SidebarNavigation } from './components/SidebarNavigation';
import { SpeechSynthesizerProvider } from './features/speech';
import { TranscriptionProvider } from './features/transcription/providers/TranscriptionProvider';

import { VanillaRuntimeProvider } from "./VanillaRuntimeProvider";

export async function loader(args: Route.LoaderArgs) {
  // In SPA mode, we don't need server-side authentication state
  // This prevents Clerk state from being serialized in the HTML
  return {
    clerkState: null
  };
}

export function HydrateFallback() {
  // In SPA mode, HydrateFallback should only return the content, not the full HTML structure
  // The Layout component already provides the html/head/body structure
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading application...</p>
      </div>
    </div>
  );
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

function ClerkProviderWithTheme({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme()
  
  // Check if Clerk publishable key is available
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  
  if (!publishableKey) {
    // Log the issue for debugging but don't crash the app
    console.warn('VITE_CLERK_PUBLISHABLE_KEY is not set. Authentication features will be disabled.')
    
    // Render app without Clerk provider
    return <>{children}</>
  }
  
  try {
    // For SPA mode, always initialize Clerk client-side only
    // This prevents authentication state from being serialized in the HTML
    return (
      <ClerkProvider
        publishableKey={publishableKey}
        appearance={{
          baseTheme: isDark ? dark : undefined,
        }}
        signUpFallbackRedirectUrl="/"
        signInFallbackRedirectUrl="/"
      >
        {children}
      </ClerkProvider>
    )
  } catch (error) {
    console.error('Failed to initialize Clerk:', error)
    // Fallback to rendering without Clerk
    return <>{children}</>
  }
}

// Error boundary to catch React errors during hydration
class HydrationErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('Hydration error caught by boundary:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error during hydration:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-8 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-red-600 mb-4">
              Application Error
            </h2>
            <p className="text-gray-600 mb-4">
              Something went wrong while loading the application.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">
                  Error Details
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 text-xs overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent(props: Route.ComponentProps) {
  const { loaderData } = props
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Add debugging to track hydration
  useEffect(() => {
    console.log('AppContent mounted, hydration complete');
  }, []);

  return (
    <HydrationErrorBoundary>
      <ClerkProviderWithTheme>
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
    </HydrationErrorBoundary>
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
