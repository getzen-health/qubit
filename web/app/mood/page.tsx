'use client'
import { useState, useEffect } from 'react'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'

const MOOD_EMOJIS = ['😔','😞','😕','😐','🙂','😊','😄','😁','🤩','🥳']

export default function MoodPage() {
  const [score, setScore] = useState(5)
  const [notes, setNotes] = useState('')
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/mood').then(r => r.json()).then(d => setLogs(d.data || []))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/mood', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, notes }),
    })
    const data = await res.json()
    if (res.ok) {
      setLogs(prev => [data.data, ...prev])
      setNotes('')
      setMessage('Mood logged!')
      setTimeout(() => setMessage(''), 2000)
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/' }, { label: 'Mood' }]} />
      <h1 className="text-2xl font-bold mb-6">Mood Tracking</h1>
      
      <form onSubmit={handleSubmit} className="rounded-xl border border-border p-6 mb-8 space-y-4">
        <h2 className="font-semibold">How are you feeling?</h2>
        <div className="flex gap-2 flex-wrap">
          {MOOD_EMOJIS.map((emoji, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setScore(i + 1)}
              className={`text-2xl p-2 rounded-lg border-2 transition-colors ${score === i + 1 ? 'border-primary bg-primary/10' : 'border-transparent hover:border-muted'}`}
              title={`Score ${i + 1}`}
            >
              {emoji}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">Selected: {MOOD_EMOJIS[score-1]} ({score}/10)</p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Optional notes..."
          className="w-full border border-border rounded-lg p-3 text-sm bg-background resize-none h-20"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground rounded-lg py-2 font-medium disabled:opacity-50"
        >
          {loading ? 'Logging...' : 'Log Mood'}
        </button>
        {message && <p className="text-green-600 text-sm text-center">{message}</p>}
      </form>

      <div className="space-y-3">
        <h2 className="font-semibold">Recent Logs</h2>
        {logs.length === 0 && <p className="text-muted-foreground text-sm">No mood logs yet.</p>}
        {logs.map((log: any) => (
          <div key={log.id} className="flex items-center gap-3 border border-border rounded-lg p-3">
            <span className="text-2xl">{MOOD_EMOJIS[log.score - 1]}</span>
            <div>
              <p className="font-medium">{log.score}/10</p>
              {log.notes && <p className="text-xs text-muted-foreground">{log.notes}</p>}
              <p className="text-xs text-muted-foreground">{new Date(log.logged_at).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
