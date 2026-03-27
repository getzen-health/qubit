'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-4xl mb-4">⚙️</div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Settings error</h2>
        <p className="text-text-secondary mb-4 text-sm">{error.message || 'Failed to load settings'}</p>
        <button onClick={reset} className="px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium">
          Try again
        </button>
      </div>
    </div>
  )
}
