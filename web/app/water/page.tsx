'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Trash2, Droplets } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'

interface WaterLog {
  id: string
  amount_ml: number
  logged_at: string
}

const QUICK_AMOUNTS = [
  { label: 'Cup', ml: 150 },
  { label: 'Glass', ml: 250 },
  { label: 'Bottle', ml: 500 },
  { label: '1L', ml: 1000 },
]

function ProgressRing({ totalMl, targetMl }: { totalMl: number; targetMl: number }) {
  const size = 160
  const strokeWidth = 14
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = targetMl > 0 ? Math.min(totalMl / targetMl, 1) : 0
  const offset = circumference * (1 - progress)
  const center = size / 2
  const pct = Math.round(progress * 100)

  const colorClass = totalMl >= targetMl ? '#22c55e' : totalMl >= targetMl * 0.5 ? '#3b82f6' : '#60a5fa'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(59,130,246,0.15)" strokeWidth={strokeWidth} />
          <circle
            cx={center} cy={center} r={radius}
            fill="none" stroke={colorClass} strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <Droplets className="w-6 h-6 text-blue-400" />
          <span className="text-2xl font-bold text-text-primary leading-none">
            {totalMl >= 1000 ? `${(totalMl / 1000).toFixed(1)}L` : `${totalMl}ml`}
          </span>
          <span className="text-xs text-text-secondary leading-none">{pct}% of goal</span>
        </div>
      </div>
      <p className="text-sm text-text-secondary">
        Goal: {targetMl >= 1000 ? `${(targetMl / 1000).toFixed(1)}L` : `${targetMl}ml`} /day
      </p>
    </div>
  )
}

export default function WaterPage() {
  const [totalMl, setTotalMl] = useState(0)
  const [targetMl, setTargetMl] = useState(2500)
  const [logs, setLogs] = useState<WaterLog[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [customMl, setCustomMl] = useState('')

  const today = new Date().toISOString().slice(0, 10)

  const loadToday = useCallback(async () => {
    const res = await fetch(`/api/water?date=${today}`)
    if (res.ok) {
      const data = await res.json()
      setTotalMl(data.total_ml ?? 0)
      setTargetMl(data.target_ml ?? 2500)
      setLogs(data.logs ?? [])
    }
    setLoading(false)
  }, [today])

  useEffect(() => { loadToday() }, [loadToday])

  const addWater = async (ml: number) => {
    if (adding) return
    setAdding(true)
    try {
      const res = await fetch('/api/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_ml: ml, source: 'manual' }),
      })
      if (res.ok) {
        await loadToday()
      }
    } finally {
      setAdding(false)
    }
  }

  const deleteLog = async (id: string) => {
    const res = await fetch(`/api/water?id=${id}`, { method: 'DELETE' })
    if (res.ok) await loadToday()
  }

  const handleCustomAdd = async () => {
    const ml = parseInt(customMl, 10)
    if (!ml || ml <= 0 || ml > 5000) return
    await addWater(ml)
    setCustomMl('')
  }

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="p-2 -ml-2 rounded-lg hover:bg-surface-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Hydration</h1>
            <p className="text-sm text-text-secondary">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Progress ring */}
        {!loading && (
          <div className="flex justify-center py-4">
            <ProgressRing totalMl={totalMl} targetMl={targetMl} />
          </div>
        )}

        {/* Quick add buttons */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Quick Add</p>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_AMOUNTS.map(({ label, ml }) => (
              <button
                key={ml}
                type="button"
                onClick={() => addWater(ml)}
                disabled={adding}
                className="flex flex-col items-center gap-1 p-3 bg-surface rounded-xl border border-border hover:bg-surface-secondary transition-colors disabled:opacity-50"
              >
                <Droplets className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-semibold text-text-primary">{label}</span>
                <span className="text-xs text-text-secondary">{ml}ml</span>
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Custom ml (e.g. 350)"
              value={customMl}
              onChange={(e) => setCustomMl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomAdd()}
              min={1}
              max={5000}
              className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              type="button"
              onClick={handleCustomAdd}
              disabled={adding || !customMl}
              className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-accent/90 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Today's log */}
        {logs.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Today&apos;s Log</p>
            <div className="bg-surface rounded-xl border border-border divide-y divide-border">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Droplets className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <span className="font-medium text-text-primary text-sm">{log.amount_ml}ml</span>
                      <span className="text-xs text-text-secondary ml-2">{fmtTime(log.logged_at)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteLog(log.id)}
                    className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-text-secondary text-center">{logs.length} entries today</p>
          </div>
        )}

        {logs.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Droplets className="w-10 h-10 text-blue-400/40 mb-3" />
            <p className="text-text-secondary text-sm">No water logged today.</p>
            <p className="text-text-secondary text-xs mt-1">Tap a quick add button to get started.</p>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
