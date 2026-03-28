"use client"
import { Home, Search } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl text-center">
        {/* 404 Display */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text mb-2">
            404
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Page not found
          </p>
        </div>

        {/* Content */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 shadow-xl p-8 space-y-6">
          <div>
            <Search className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              We couldn't find that page
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              The page you're looking for doesn't exist or has been moved to a new location.
            </p>
          </div>

          {/* Suggestions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800/30 text-left">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-3">
              Here are some helpful links:
            </p>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <li>• Double-check the URL for typos</li>
              <li>• Navigate using the main menu</li>
              <li>• Use search to find what you need</li>
              <li>• Check your bookmarks</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              Go to Dashboard
            </Link>

            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-8">
          Need help? <Link href="/help" className="text-blue-600 dark:text-blue-400 hover:underline">Contact support</Link>
        </p>
      </div>
    </div>
  )
}
