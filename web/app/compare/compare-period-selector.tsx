'use client'

import { useRouter } from 'next/navigation'

interface PeriodConfig {
  days: number
  label: string
  currentLabel: string
  priorLabel: string
}

interface ComparePeriodSelectorProps {
  currentPeriod: string
  periods: Record<string, PeriodConfig>
}

export function ComparePeriodSelector({ currentPeriod, periods }: ComparePeriodSelectorProps) {
  const router = useRouter()

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {Object.entries(periods).map(([key, p]) => (
        <button
          key={key}
          onClick={() => router.push(`/compare?period=${key}`)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            currentPeriod === key
              ? 'bg-accent text-white border-accent'
              : 'bg-surface text-text-secondary border-border hover:border-accent/50 hover:text-text-primary'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
