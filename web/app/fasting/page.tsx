'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Timer, Play, Square, Trash2 } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { cn } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts'

interface ActiveSession {
  id: string
  protocol: string
  target_hours: number
  started_at: string
  elapsed_hours: number
  remaining_hours: number
  progress_percent: number
}

interface PastSession {
  id: string
  protocol: string
  target_hours: number
  started_at: string
  ended_at: string
  actual_hours: number
  completed: boolean
}

interface FastingData {
  active_session: ActiveSession | null
  recent_sessions: PastSession[]
  default_protocol: string
  default_hours: number
}

const PROTOCOLS = [
  { label: '16:8', hours: 16, desc: '16h fast, 8h eating' },
  { label: '18:6', hours: 18, desc: '18h fast, 6h eating' },
  { label: '20:4', hours: 20, desc: '20h fast, 4h eating' },
  { label: 'OMAD', hours: 23, desc: '23h fast, 1h eating' },
]

function fmtHours(h: number): string {
  const hours = Math.floor(h)
  const mins = Math.floor((h - hours) * 60)
  const secs = Math.floor(((h - hours) * 60 - mins) * 60)
  if (hours > 0) return `${hours}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`
  return `${mins}m ${secs.toString().padStart(2, '0')}s`
}

function fmtShortHours(h: number): string {
  const hours = Math.floor(h)
  const mins = Math.round((h - hours) * 60)
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

function getMetabolicPhase(hours: number): { name: string; emoji: string; color: string } {
  if (hours < 4) return { name: 'Fed State', emoji: '🍽️', color: 'text-gray-400' }
  if (hours < 8) return { name: 'Early Fasting', emoji: '⏳', color: 'text-yellow-400' }
  if (hours < 16) return { name: 'Fat Burning', emoji: '🔥', color: 'text-orange-400' }
  if (hours < 24) return { name: 'Ketosis', emoji: '⚡', color: 'text-purple-400' }
  return { name: 'Deep Ketosis', emoji: '💫', color: 'text-indigo-400' }
}

function getPhaseBackground(hours: number): string {
  if (hours < 4) return 'bg-gray-900/30'
  if (hours < 8) return 'bg-yellow-900/30'
  if (hours < 16) return 'bg-orange-900/30'
  if (hours < 24) return 'bg-purple-900/30'
  return 'bg-indigo-900/30'
}

function getHoursUntilNextPhase(hours: number): number | null {
  if (hours < 4) return 4 - hours
  if (hours < 8) return 8 - hours
  if (hours < 16) return 16 - hours
  if (hours < 24) return 24 - hours
  return null
}

function ActiveFastTimer({ session, onEnd }: { session: ActiveSession; onEnd: () => void }) {
  const [elapsed, setElapsed] = useState(session.elapsed_hours)
  const [ending, setEnding] = useState(false)

  useEffect(() => {
    const startMs = new Date(session.started_at).getTime()
    const tick = () => {
      const nowMs = Date.now()
      setElapsed((nowMs - startMs) / 3600000)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [session.started_at])

  const progress = Math.min(elapsed / session.target_hours, 1)
  const remaining = Math.max(0, session.target_hours - elapsed)
  const done = elapsed >= session.target_hours
  const phase = getMetabolicPhase(elapsed)
  const nextPhaseHours = getHoursUntilNextPhase(elapsed)

  const size = 220
  const strokeWidth = 16
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - progress)
  const center = size / 2
  const color = done ? '#22c55e' : '#f59e0b'

  const handleEnd = async () => {
    setEnding(true)
    try {
      const res = await fetch('/api/fasting', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (res.ok) onEnd()
    } finally {
      setEnding(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Metabolic Phase Badge */}
      <div className={`flex flex-col items-center gap-2 p-4 rounded-xl w-full max-w-xs ${getPhaseBackground(elapsed)}`}>
        <span className="text-4xl">{phase.emoji}</span>
        <span className={`text-lg font-bold ${phase.color}`}>{phase.name}</span>
        {nextPhaseHours && nextPhaseHours > 0 && (
          <span className="text-xs text-zinc-400">Next phase in {nextPhaseHours.toFixed(1)}h</span>
        )}
      </div>

      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(245,158,11,0.15)" strokeWidth={strokeWidth} />
          <circle
            cx={center} cy={center} r={radius}
            fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <Timer className="w-7 h-7 text-amber-400" />
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{session.protocol}</span>
          <span className="text-2xl font-bold text-text-primary font-mono leading-none">
            {fmtHours(elapsed)}
          </span>
          <span className="text-xs text-text-secondary">
            {done ? '🎉 Goal reached!' : `${fmtShortHours(remaining)} remaining`}
          </span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-text-secondary">
          Started {fmtDate(session.started_at)}
        </p>
        <p className="text-sm text-text-secondary">
          Target: {session.target_hours}h fast · {Math.round(progress * 100)}% complete
        </p>
      </div>

      <button
        type="button"
        onClick={handleEnd}
        disabled={ending}
        className="flex items-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
      >
        <Square className="w-4 h-4" />
        {ending ? 'Ending…' : 'End Fast'}
      </button>
    </div>
  )
}

export default function FastingPage() {
  const [data, setData] = useState<FastingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [selectedProtocol, setSelectedProtocol] = useState(PROTOCOLS[0])

  const load = useCallback(async () => {
    const res = await fetch('/api/fasting?limit=20')
    if (res.ok) {
      const json = await res.json()
      setData(json)
      if (json.default_protocol) {
        const found = PROTOCOLS.find((p) => p.label === json.default_protocol)
        if (found) setSelectedProtocol(found)
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const startFast = async () => {
    setStarting(true)
    try {
      const res = await fetch('/api/fasting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol: selectedProtocol.label,
          target_hours: selectedProtocol.hours,
        }),
      })
      if (res.ok) await load()
    } finally {
      setStarting(false)
    }
  }

  const deleteSession = async (id: string) => {
    await fetch(`/api/fasting?id=${id}`, { method: 'DELETE' })
    await load()
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="p-2 -ml-2 rounded-lg hover:bg-surface-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Fasting</h1>
            <p className="text-sm text-text-secondary">Intermittent fasting tracker</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Timer className="w-8 h-8 text-text-secondary animate-pulse" />
          </div>
        ) : data?.active_session ? (
          /* Active fast */
          <div className="bg-surface rounded-xl border border-amber-500/20 p-6">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-4 text-center">Active Fast</p>
            <ActiveFastTimer session={data.active_session} onEnd={load} />
          </div>
        ) : (
          /* Start new fast */
          <div className="space-y-4">
            <div className="bg-surface rounded-xl border border-border p-4">
              <p className="text-sm font-medium text-text-secondary mb-3">Choose Protocol</p>
              <div className="grid grid-cols-2 gap-2">
                {PROTOCOLS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setSelectedProtocol(p)}
                    className={cn(
                      'flex flex-col items-start p-3 rounded-lg border transition-colors text-left',
                      p.label === selectedProtocol.label
                        ? 'border-accent bg-accent/5'
                        : 'border-border bg-surface hover:bg-surface-secondary'
                    )}
                  >
                    <span className={cn('text-lg font-bold', p.label === selectedProtocol.label ? 'text-accent' : 'text-text-primary')}>
                      {p.label}
                    </span>
                    <span className="text-xs text-text-secondary mt-0.5">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={startFast}
              disabled={starting}
              className="w-full flex items-center justify-center gap-2 py-4 bg-accent text-white rounded-xl font-semibold text-base hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              <Play className="w-5 h-5" />
              {starting ? 'Starting…' : `Start ${selectedProtocol.label} Fast`}
            </button>

            <p className="text-xs text-text-secondary text-center">
              Fast for {selectedProtocol.hours} hours · Eating window opens in {selectedProtocol.hours}h
            </p>
          </div>
        )}

        {/* Fasting history chart */}
        {(data?.recent_sessions ?? []).length >= 2 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Recent Fasts</p>
            <div className="bg-surface rounded-xl border border-border p-4">
              <ResponsiveContainer width="100%" height={130}>
                <BarChart
                  data={[...(data?.recent_sessions ?? [])].reverse().slice(-10).map((s) => ({
                    label: new Date(s.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    hours: +s.actual_hours.toFixed(1),
                    target: s.target_hours,
                    completed: s.completed,
                  }))}
                  margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-surface, #1a1a1a)',
                      border: '1px solid var(--color-border, #333)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value: number, name: string) => [
                      `${value}h`,
                      name === 'hours' ? 'Fasted' : 'Target',
                    ]}
                  />
                  <ReferenceLine
                    y={(data?.default_hours ?? 16)}
                    stroke="rgba(245,158,11,0.4)"
                    strokeDasharray="4 4"
                    label={{ value: 'Goal', position: 'right', fontSize: 10, fill: 'rgba(245,158,11,0.6)' }}
                  />
                  <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                    {[...(data?.recent_sessions ?? [])].reverse().slice(-10).map((s, i) => (
                      <Cell key={i} fill={s.completed ? '#f59e0b' : 'rgba(245,158,11,0.35)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-text-secondary text-center mt-1">Amber = completed goal</p>
            </div>
          </div>
        )}

        {/* Past sessions */}
        {(data?.recent_sessions ?? []).length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">History</p>
            <div className="space-y-2">
              {data!.recent_sessions.map((s) => (
                <div key={s.id} className="bg-surface rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-text-primary">{s.protocol}</span>
                        {s.completed && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 font-medium">
                            Complete
                          </span>
                        )}
                        {!s.completed && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-surface-secondary text-text-secondary">
                            Partial
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary">
                        {fmtShortHours(s.actual_hours)} of {s.target_hours}h target
                      </p>
                      <p className="text-xs text-text-secondary opacity-70 mt-0.5">
                        {fmtDate(s.started_at)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteSession(s.id)}
                      className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!data?.active_session && (data?.recent_sessions ?? []).length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Timer className="w-10 h-10 text-text-secondary/40 mb-3" />
            <p className="text-text-secondary text-sm">No fasting sessions yet.</p>
            <p className="text-text-secondary text-xs mt-1">Choose a protocol above and start your first fast.</p>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
