'use client'

import { useEffect } from 'react'
import { Activity, AlertTriangle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[DashboardError]', error)
    }
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-sm w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <Activity className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-text-primary">Dashboard unavailable</h2>
          <p className="text-sm text-text-secondary">
            Could not load your health data. This is usually a temporary connectivity issue.
          </p>
          <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl p-3 text-left">
            <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
            <p className="text-xs text-orange-700">
              Your synced data is not affected — it remains safely stored in your account.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors w-full"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Go to home
          </Link>
        </div>
      </div>
    </div>
  )
}
