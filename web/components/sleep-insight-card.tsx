'use client'
import { useEffect, useState } from 'react'
import { Moon, Sparkles } from 'lucide-react'

interface SleepInsight {
  insight: string
  avgDuration?: number
  consistencyScore?: number
}

export function SleepInsightCard() {
  const [insight, setInsight] = useState<SleepInsight | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/sleep/insights')
      .then(r => r.json())
      .then(data => { setInsight(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="bg-surface rounded-2xl border border-border p-4 animate-pulse h-24" />
  if (!insight) return null

  return (
    <div className="bg-surface rounded-2xl border border-border p-4">
      <div className="flex items-center gap-2 mb-2">
        <Moon className="w-4 h-4 text-indigo-400" />
        <span className="font-semibold text-text-primary text-sm">Sleep Insights</span>
        <Sparkles className="w-3 h-3 text-purple-400 ml-auto" />
      </div>
      {insight.avgDuration && (
        <p className="text-xs text-text-secondary mb-2">Avg: {insight.avgDuration}h/night</p>
      )}
      <p className="text-sm text-text-primary leading-relaxed">{insight.insight}</p>
    </div>
  )
}
