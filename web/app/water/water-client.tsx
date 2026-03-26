"use client"
import { useState } from 'react'

interface WaterLog { amount_ml: number; logged_at: string }

interface WaterClientProps {
  initialTotal: number
  initialLogs: WaterLog[]
  goal: number
}

export function WaterClient({ initialTotal, initialLogs, goal }: WaterClientProps) {
  const [total, setTotal] = useState(initialTotal)
  const [logs, setLogs] = useState<WaterLog[]>(initialLogs)
  const [loading, setLoading] = useState(false)

  const pct = Math.min(100, Math.round((total / goal) * 100))

  async function addWater(ml: number) {
    setLoading(true)
    try {
      const res = await fetch('/api/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_ml: ml })
      })
      if (res.ok) {
        const { log } = await res.json()
        setTotal(t => t + ml)
        setLogs(prev => [log, ...prev])
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border p-6 text-center space-y-3">
        <p className="text-5xl font-extrabold text-blue-500">{total}<span className="text-xl text-muted-foreground">ml</span></p>
        <p className="text-sm text-muted-foreground">of {goal}ml daily goal</p>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-sm font-medium">{pct}% complete {pct >= 100 ? '🎉' : ''}</p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[150, 250, 350, 500].map(ml => (
          <button key={ml} onClick={() => addWater(ml)} disabled={loading}
            className="py-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-50">
            +{ml}ml
          </button>
        ))}
      </div>
      {logs.length > 0 && (
        <div className="space-y-2">
          <p className="font-semibold text-sm">Today&apos;s Log</p>
          {logs.map((log, i) => (
            <div key={i} className="flex justify-between text-sm text-muted-foreground py-1.5 border-b border-border last:border-0">
              <span>{new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="font-medium text-foreground">+{log.amount_ml}ml</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
