import { Sparkles } from 'lucide-react'

export default function PredictionsLoading() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-surface-secondary animate-pulse" />
          <Sparkles className="w-5 h-5 text-purple-400/50" />
          <div className="w-28 h-5 rounded bg-surface-secondary animate-pulse" />
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <div className="bg-surface rounded-xl border border-border p-4 h-56 animate-pulse" />
        <div className="bg-surface rounded-xl border border-border p-4 h-24 animate-pulse" />
        <div className="bg-surface rounded-xl border border-border p-4 h-24 animate-pulse" />
        <div className="bg-surface rounded-xl border border-border p-4 h-24 animate-pulse" />
      </main>
    </div>
  )
}
