'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, AlertCircle } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    Sentry.captureException(error)
    if (process.env.NODE_ENV === 'development') {
      console.error('[GlobalError]', error)
    }
  }, [error])

  const isDevelopment = process.env.NODE_ENV === 'development'
  const errorMessage = error?.message || 'An unexpected error occurred'

  return (
    <html>
      <body className="bg-gradient-to-br from-slate-950 to-slate-900">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            {/* Error Container */}
            <div className="rounded-2xl border border-red-900/50 bg-slate-800 shadow-2xl p-8">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-red-900/30 to-orange-900/30 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-red-400" />
                </div>
              </div>

              {/* Content */}
              <div className="text-center space-y-4 mb-8">
                <h1 className="text-3xl font-bold text-white">
                  Critical Error
                </h1>
                <p className="text-gray-300 text-lg">
                  The application encountered a critical error and cannot continue.
                </p>

                {/* Error Details */}
                <div className="mt-6 p-4 rounded-lg bg-orange-900/20 border border-orange-800/50">
                  <div className="flex gap-3 text-left">
                    <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-orange-200 text-sm">
                        Error Details
                      </p>
                      <p className="text-orange-100 text-xs font-mono mt-1">
                        {errorMessage}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Error ID */}
                {error.digest && (
                  <div className="text-xs text-gray-400 font-mono">
                    Error ID: <span className="bg-gray-700 px-2 py-1 rounded">{error.digest}</span>
                  </div>
                )}

                {/* Debug Info */}
                {isDevelopment && (
                  <details className="mt-4 p-3 bg-blue-900/30 rounded-lg border border-blue-800/50 text-left">
                    <summary className="cursor-pointer font-medium text-blue-200 text-sm">
                      Debug Information
                    </summary>
                    <pre className="mt-2 text-xs overflow-auto max-h-40 bg-slate-950 p-2 rounded text-gray-300 whitespace-pre-wrap break-words">
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
                  Try Again
                </button>

                <button
                  onClick={() => window.location.href = '/'}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                >
                  Go Home
                </button>
              </div>

              {/* Help Text */}
              <p className="text-xs text-gray-400 text-center mt-6">
                If this problem persists, please clear your browser cache or contact support.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
