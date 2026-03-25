import { AlertTriangle } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-text-primary">You're Offline</h1>
          <p className="text-text-secondary">
            Please check your internet connection to continue using KQuarks.
          </p>
        </div>
        <div className="bg-surface rounded-lg border border-border p-4">
          <p className="text-sm text-text-secondary">
            Some features and data may be limited while offline. Your changes will sync once you're back online.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-2.5 bg-accent text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
