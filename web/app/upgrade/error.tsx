'use client'
export default function UpgradeError({ reset }: { reset: () => void }) {
  return (
    <div className="container mx-auto py-16 text-center space-y-4">
      <p className="text-2xl">⚠️</p>
      <p className="font-semibold">Failed to load pricing</p>
      <p className="text-muted-foreground text-sm">Something went wrong loading pricing information.</p>
      <button onClick={reset} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">Try Again</button>
    </div>
  )
}
