import { Protect } from "@clerk/clerk-react";

export function RouteProtection({ children }: { children: React.ReactNode }) {
  return (
    <Protect
      condition={(has) => has({ feature: "premium" })}
      fallback={
        <div className="flex items-center justify-center h-[calc(100dvh-4rem)]">
          <div className="text-center p-8 max-w-md mx-auto">
            <div className="mb-6">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Ops! this requires you to be signed-in
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                You need to be logged in to use this feature.
              </p>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </Protect>
  );
}
