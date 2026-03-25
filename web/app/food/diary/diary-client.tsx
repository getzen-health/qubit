'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface DiaryClientProps {
  dateStr: string
  displayDate: string
}

function shiftDate(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function DiaryClient({ dateStr, displayDate }: DiaryClientProps) {
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)
  const isToday = dateStr >= today

  function navigate(offset: number) {
    const next = shiftDate(dateStr, offset)
    router.push(`/food/diary?date=${next}`)
  }

  return (
    <div className="flex items-center justify-between bg-surface rounded-2xl px-4 py-3">
      <button
        onClick={() => navigate(-1)}
        className="p-2 rounded-xl hover:bg-surface-secondary transition-colors text-text-secondary hover:text-text-primary"
        aria-label="Previous day"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <p className="font-semibold text-text-primary">{displayDate}</p>

      <button
        onClick={() => navigate(1)}
        disabled={isToday}
        className="p-2 rounded-xl hover:bg-surface-secondary transition-colors text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Next day"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}
