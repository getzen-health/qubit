'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function RootError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to error reporting service
    if (process.env.NODE_ENV === 'development') {
      console.error('[RootError]', error)
    }
  }, [error])

  const isDevelopment = process.env.NODE_ENV === 'development'
  const errorMessage = error?.message || 'An unexpected error occurred'

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Error Container */}
        <div className="rounded-2xl border border-red-200/50 dark:border-red-900/30 bg-white dark:bg-slate-900 shadow-2xl p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/20 dark:to-orange-900/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Something went wrong
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              We encountered an unexpected error. Your data is safe and we're working on fixing this.
            </p>

            {/* Error Details */}
            <div className="mt-6 p-4 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30">
              <div className="flex gap-3 text-left">
                <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-orange-900 dark:text-orange-200 text-sm">
                    Error Details
                  </p>
                  <p className="text-orange-800 dark:text-orange-300 text-xs font-mono mt-1">
                    {errorMessage}
                  </p>
                </div>
              </div>
            </div>

            {/* Error ID */}
            {error.digest && (
              <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                Error ID: <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{error.digest}</span>
              </div>
            )}

            {/* Debug Info */}
            {isDevelopment && (
              <details className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800/30 text-left">
                <summary className="cursor-pointer font-medium text-blue-900 dark:text-blue-200 text-sm">
                  Debug Information
                </summary>
                <pre className="mt-2 text-xs overflow-auto max-h-40 bg-blue-900/5 dark:bg-blue-950/30 p-2 rounded text-gray-700 dark:text-gray-300">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>

            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              Go to Dashboard
            </Link>
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-6">
            If the problem persists, please try refreshing the page or contact support.
          </p>
        </div>
      </div>
    </div>
  )
}
