'use client'

import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'

export default function PredictionsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="p-2 -ml-2 rounded-lg hover:bg-surface-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <h1 className="text-xl font-bold text-text-primary">Week Ahead</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-12 flex flex-col items-center gap-5 text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-1">Something went wrong</h2>
          <p className="text-sm text-text-secondary max-w-xs">{error.message || 'Failed to load predictions. Please try again.'}</p>
        </div>
        <button
          onClick={reset}
          className="bg-accent text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-opacity hover:opacity-80"
        >
          Try again
        </button>
      </main>
    </div>
  )
}
