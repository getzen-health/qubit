/**
 * Shared error component for consistent error UI across the application
 */
'use client'

import React from 'react'
import { AlertCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
  title?: string
  description?: string
  showDashboardLink?: boolean
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode
  isDevelopment?: boolean
}

export function ErrorBoundary({
  error,
  reset,
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  showDashboardLink = true,
  icon: IconComponent = AlertTriangle,
  isDevelopment = process.env.NODE_ENV === 'development',
}: ErrorBoundaryProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-orange-200/50 dark:border-orange-900/30 bg-white dark:bg-slate-900 shadow-xl p-8 space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
              {React.isValidElement(IconComponent) ? (
                IconComponent
              ) : typeof IconComponent === 'function' ? (
                <IconComponent className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              )}
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>

            {/* Error Details (Dev Only) */}
            {isDevelopment && error?.message && (
              <details className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-left">
                <summary className="cursor-pointer font-medium text-blue-900 dark:text-blue-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" />
                  Error Details
                </summary>
                <pre className="mt-2 text-xs overflow-auto max-h-32 text-blue-800 dark:text-blue-300 font-mono">
                  {error.message}
                  {error.digest && `\n\nID: ${error.digest}`}
                </pre>
              </details>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>

            {showDashboardLink && (
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
              >
                Back to dashboard
              </Link>
            )}
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            If this keeps happening, try clearing your cache or contact support.
          </p>
        </div>
      </div>
    </div>
  )
}
