'use client'

import { useEffect, useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'

const ALL_CARDS = [
  { key: 'health-score', label: 'Health Score' },
  { key: 'steps', label: 'Steps' },
  { key: 'sleep', label: 'Sleep' },
  { key: 'water', label: 'Water Intake' },
  { key: 'workout', label: 'Workout' },
  { key: 'mood', label: 'Mood' },
  { key: 'streaks', label: 'Streaks' },
  { key: 'nutrition', label: 'Nutrition' },
]

export default function DashboardSettingsPage() {
  const [order, setOrder] = useState(ALL_CARDS.map(c => c.key))
  const [hidden, setHidden] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/preferences')
      .then(r => r.json())
      .then(data => {
        setOrder(data.dashboard_card_order || ALL_CARDS.map(c => c.key))
        setHidden(data.dashboard_hidden_cards || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function move(idx: number, dir: -1 | 1) {
    setOrder(o => {
      const arr = [...o]
      const newIdx = idx + dir
      if (newIdx < 0 || newIdx >= arr.length) return arr
      ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
      return arr
    })
  }

  function toggle(card: string) {
    setHidden(h => h.includes(card) ? h.filter(c => c !== card) : [...h, card])
  }

  async function save() {
    setSaving(true)
    setError(null)
    setSuccess(false)
    const res = await fetch('/api/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dashboard_card_order: order,
        dashboard_hidden_cards: hidden,
      }),
    })
    if (res.ok) {
      setSuccess(true)
    } else {
      setError('Failed to save')
    }
    setSaving(false)
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Customize Dashboard</h1>
      <div className="space-y-2 mb-6">
        {order.map((key, idx) => {
          const card = ALL_CARDS.find(c => c.key === key)
          if (!card) return null
          return (
            <div key={card.key} className="flex items-center gap-4 p-3 bg-surface rounded border border-border">
              <Switch checked={!hidden.includes(card.key)} onCheckedChange={() => toggle(card.key)} />
              <span className="flex-1">{card.label}</span>
              <Button size="icon" variant="ghost" onClick={() => move(idx, -1)} disabled={idx === 0} aria-label="Move up">
                ↑
              </Button>
              <Button size="icon" variant="ghost" onClick={() => move(idx, 1)} disabled={idx === order.length - 1} aria-label="Move down">
                ↓
              </Button>
            </div>
          )
        })}
      </div>
      <Button onClick={save} disabled={saving} className="w-full">
        {saving ? 'Saving...' : 'Save'}
      </Button>
      {error && <div className="text-destructive mt-2">{error}</div>}
      {success && <div className="text-success mt-2">Saved!</div>}
    </div>
  )
}
