import Link from 'next/link'
import { Stethoscope } from 'lucide-react'

export function QuickLinks() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
      {/* Existing quick links can be added here */}
      <Link
        href="/symptoms"
        className="flex flex-col items-center justify-center gap-2 bg-surface border border-border rounded-2xl p-4 hover:bg-surface/80 transition-colors"
        aria-label="Symptoms Tracker"
      >
        <Stethoscope className="w-7 h-7 text-primary" />
        <span className="text-xs font-semibold text-text-primary">Symptoms</span>
      </Link>
    </div>
  )
}
