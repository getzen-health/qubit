'use client'
import { useState, useEffect } from 'react'
import { ShareCardModal } from '@/components/share-card-modal'
import { ShareCardData } from '@/lib/share-card'

const PRESETS: Array<{ label: string; emoji: string; data: Partial<ShareCardData> }> = [
  { label: 'Step Streak', emoji: '🔥', data: { type: 'streak', title: 'Day Streak!', metricLabel: 'days active' } },
  { label: 'Workout Done', emoji: '💪', data: { type: 'workout', title: 'Workout Complete' } },
  { label: 'Weekly Win', emoji: '📊', data: { type: 'weekly_summary', title: 'Weekly Summary' } },
  { label: 'Milestone', emoji: '🏆', data: { type: 'milestone', title: 'New Milestone!' } },
]

export default function SharePage() {
  const [selected, setSelected] = useState<ShareCardData | null>(null)
  const [stats, setStats] = useState<{ streak: number; steps: number } | null>(null)

  useEffect(() => {
    fetch('/api/share/stats').then(r => r.json()).then(setStats).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-8">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Share Your Progress</h1>
        <p className="text-text-secondary mb-6">Generate a shareable card for your health achievements</p>

        <div className="grid grid-cols-2 gap-3">
          {PRESETS.map(preset => (
            <button
              key={preset.label}
              onClick={() => setSelected({
                ...preset.data,
                type: preset.data.type!,
                title: preset.data.title!,
                emoji: preset.emoji,
                metric: stats?.streak?.toString() ?? '—',
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              })}
              className="bg-surface rounded-2xl p-5 text-left border border-border hover:border-primary transition-colors"
            >
              <div className="text-3xl mb-2">{preset.emoji}</div>
              <p className="font-semibold text-text-primary">{preset.label}</p>
            </button>
          ))}
        </div>

        <div className="mt-6 bg-surface rounded-2xl border border-border p-4">
          <p className="text-sm text-text-secondary text-center">Cards are generated locally — your data never leaves your device 🔒</p>
        </div>
      </div>

      {selected && <ShareCardModal data={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
