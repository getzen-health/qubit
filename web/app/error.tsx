'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to your error-reporting service (e.g. Sentry) here
    if (process.env.NODE_ENV === 'development') {
      console.error('[GlobalError]', error)
    }
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-text-primary">Something went wrong</h1>
          <p className="text-text-secondary text-sm">
            An unexpected error occurred. Your data is safe — please try again.
          </p>
          {error.digest && (
            <p className="text-xs text-text-secondary font-mono bg-surface px-3 py-1 rounded-full inline-block">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      </div>
    </div>
  )
}
