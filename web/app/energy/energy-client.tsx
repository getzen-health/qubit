'use client'

import { useState, useEffect, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { BottomNav } from '@/components/bottom-nav'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EnergyLog {
  id: string
  energy_level: number
  notes: string | null
  logged_at: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVELS: { value: number; emoji: string; label: string }[] = [
  { value: 1, emoji: '😴', label: 'Drained' },
  { value: 2, emoji: '😔', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Neutral' },
  { value: 4, emoji: '😊', label: 'Good' },
  { value: 5, emoji: '⚡', label: 'Energized' },
]

function levelEmoji(level: number): string {
  return LEVELS.find((l) => l.value === level)?.emoji ?? '😐'
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

// ─── Sparkline data helpers ───────────────────────────────────────────────────

function buildSparklineData(logs: EnergyLog[]): { day: string; avg: number }[] {
  const map: Record<string, number[]> = {}
  logs.forEach((l) => {
    const day = l.logged_at.slice(0, 10)
    if (!map[day]) map[day] = []
    map[day].push(l.energy_level)
  })

  // Last 7 days (oldest first for left-to-right chart)
  const days: { day: string; avg: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const vals = map[key]
    const avg = vals ? vals.reduce((s, v) => s + v, 0) / vals.length : 0
    days.push({ day: key.slice(5), avg: parseFloat(avg.toFixed(1)) })
  }
  return days
}

function todayAvg(logs: EnergyLog[]): number | null {
  const today = new Date().toISOString().slice(0, 10)
  const todayLogs = logs.filter((l) => l.logged_at.slice(0, 10) === today)
  if (!todayLogs.length) return null
  const avg = todayLogs.reduce((s, l) => s + l.energy_level, 0) / todayLogs.length
  return parseFloat(avg.toFixed(1))
}

// ─── Main client component ────────────────────────────────────────────────────

export function EnergyClient() {
  const [logs, setLogs] = useState<EnergyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/energy')
      if (res.ok) {
        const json = await res.json() as { data: EnergyLog[] }
        setLogs(json.data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchLogs() }, [fetchLogs])

  async function logEnergy(level: number) {
    setPosting(true)
    try {
      const body: { energy_level: number; notes?: string } = { energy_level: level }
      if (notes.trim()) body.notes = notes.trim()

      const res = await fetch('/api/energy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setNotes('')
        setShowNotes(false)
        await fetchLogs()
      }
    } finally {
      setPosting(false)
    }
  }

  const avg = todayAvg(logs)
  const sparkData = buildSparklineData(logs)
  const recent = logs.slice(0, 7)

  // Correlation insight: avg energy on "high sleep" days
  const highSleepInsight = (() => {
    // Group by date and find average energy per day
    const byDay: Record<string, number[]> = {}
    logs.forEach((l) => {
      const d = l.logged_at.slice(0, 10)
      if (!byDay[d]) byDay[d] = []
      byDay[d].push(l.energy_level)
    })
    const days = Object.values(byDay).map((vals) => vals.reduce((s, v) => s + v, 0) / vals.length)
    if (days.length < 3) return null
    const high = days.filter((d) => d >= 4)
    const low = days.filter((d) => d <= 2)
    if (!high.length || !low.length) return null
    const highAvg = (high.reduce((s, v) => s + v, 0) / high.length).toFixed(1)
    const lowAvg = (low.reduce((s, v) => s + v, 0) / low.length).toFixed(1)
    return `High-energy days avg ${highAvg}/5, low-energy days avg ${lowAvg}/5.`
  })()

  return (
    <div className="min-h-screen bg-background text-text-primary pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Energy Journal</h1>
            <p className="text-sm text-text-secondary mt-0.5">How&apos;s your energy right now?</p>
          </div>
          {avg !== null && (
            <div className="flex flex-col items-center bg-accent/10 border border-accent/20 rounded-2xl px-4 py-2">
              <span className="text-2xl">{levelEmoji(Math.round(avg))}</span>
              <span className="text-xs font-semibold text-accent">{avg}/5 today</span>
            </div>
          )}
        </div>

        {/* Energy selector */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Tap to log
          </p>
          <div className="flex gap-2 justify-between">
            {LEVELS.map(({ value, emoji, label }) => (
              <button
                key={value}
                onClick={() => void logEnergy(value)}
                disabled={posting}
                className="flex flex-col items-center gap-1 flex-1 py-3 rounded-xl border border-border bg-surface hover:bg-accent/10 hover:border-accent/30 transition-all active:scale-95 disabled:opacity-50"
                aria-label={`Log energy level ${value}: ${label}`}
              >
                <span className="text-2xl">{emoji}</span>
                <span className="text-[10px] font-medium text-text-secondary">{label}</span>
              </button>
            ))}
          </div>

          {/* Optional notes toggle */}
          <div className="mt-3">
            <button
              onClick={() => setShowNotes((v) => !v)}
              className="text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              {showNotes ? '✕ Hide notes' : '+ Add a note'}
            </button>
            {showNotes && (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={300}
                placeholder="What's affecting your energy? (optional)"
                rows={2}
                className="mt-2 w-full text-sm bg-background border border-border rounded-xl px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent/60 resize-none"
              />
            )}
          </div>
        </div>

        {/* 7-day sparkline */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
            7-Day Trend
          </p>
          {sparkData.some((d) => d.avg > 0) ? (
            <ResponsiveContainer width="100%" height={60}>
              <LineChart data={sparkData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 5]} hide />
                <Tooltip
                  formatter={(v: number) => [`${v}/5`, 'Avg Energy']}
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                />
                <Line type="monotone" dataKey="avg" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3, fill: 'var(--accent)' }} activeDot={{ r: 4 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-text-secondary text-center py-4">No data yet — log your first entry above!</p>
          )}
        </div>

        {/* Correlation insight */}
        {highSleepInsight && (
          <div className="bg-accent/5 border border-accent/15 rounded-2xl px-4 py-3 flex gap-2 items-start">
            <span className="text-lg">💡</span>
            <p className="text-sm text-text-primary">{highSleepInsight}</p>
          </div>
        )}

        {/* Recent entries */}
        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Recent Entries
          </p>
          {loading ? (
            <p className="text-sm text-text-secondary text-center py-4">Loading…</p>
          ) : recent.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-4">No entries yet</p>
          ) : (
            <ul className="space-y-2">
              {recent.map((log) => (
                <li key={log.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <span className="text-2xl leading-none mt-0.5">{levelEmoji(log.energy_level)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{LEVELS.find((l) => l.value === log.energy_level)?.label ?? log.energy_level}</span>
                      <span className="text-[11px] text-text-secondary">{formatTime(log.logged_at)}</span>
                    </div>
                    <span className="text-[11px] text-text-secondary">{formatDay(log.logged_at)}</span>
                    {log.notes && (
                      <p className="text-xs text-text-secondary mt-0.5 truncate">{log.notes}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
