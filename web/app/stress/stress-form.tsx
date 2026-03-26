'use client'
import { useState } from 'react'

const STRESS_LABELS = ['😌','😌','🙂','😐','😐','😟','😟','😰','😰','😱']

export function StressForm({ onLogged }: { onLogged?: () => void }) {
  const [score, setScore] = useState(5)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/stress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, notes }),
    })
    if (res.ok) {
      setNotes('')
      setMsg('Stress level logged!')
      setTimeout(() => setMsg(''), 2000)
      onLogged?.()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border p-5 space-y-4 mb-6">
      <h2 className="font-semibold">Log Stress Level</h2>
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-2xl">{STRESS_LABELS[score - 1]}</span>
          <input
            type="range" min="1" max="10" value={score}
            onChange={e => setScore(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm font-semibold w-8 text-center">{score}/10</span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Very calm</span><span>Extremely stressed</span>
        </div>
      </div>
      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="What's causing stress? (optional)" className="w-full border border-border rounded-lg p-3 text-sm bg-background resize-none h-16" />
      <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground rounded-lg py-2 font-medium disabled:opacity-50">
        {loading ? 'Logging...' : 'Log Stress'}
      </button>
      {msg && <p className="text-green-600 text-sm text-center">{msg}</p>}
    </form>
  )
}
