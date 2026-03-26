'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, Play, Square, Trash2, ChevronRight, Zap } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { cn } from '@/lib/utils'
import {
  FASTING_PROTOCOLS,
  FASTING_MILESTONES,
  MILESTONE_CATEGORY_COLOR,
  calculateActiveFast,
  formatDuration,
  formatLiveTimer,
  type FastingProtocol,
} from '@/lib/fasting'
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

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function ProgressRing({
  percent,
  size = 220,
  strokeWidth = 16,
  done = false,
}: {
  percent: number
  size?: number
  strokeWidth?: number
  done?: boolean
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(percent / 100, 1))
  const center = size / 2
  const color = done ? '#22c55e' : '#f59e0b'
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="rgba(245,158,11,0.12)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
      />
    </svg>
  )
}

function MilestoneTimeline({ elapsedHours }: { elapsedHours: number }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to keep upcoming milestone visible
  useEffect(() => {
    const next = FASTING_MILESTONES.findIndex((m) => m.hours > elapsedHours)
    if (next > 0 && scrollRef.current) {
      const item = scrollRef.current.children[next] as HTMLElement
      item?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [elapsedHours])

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
        Autophagy Timeline
      </p>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollbarWidth: 'none' }}
      >
        {FASTING_MILESTONES.map((m) => {
          const achieved = elapsedHours >= m.hours
          const isCurrent =
            m.hours <= elapsedHours &&
            (FASTING_MILESTONES.find((x) => x.hours > elapsedHours)?.hours ?? Infinity) >
              elapsedHours &&
            m === [...FASTING_MILESTONES].reverse().find((x) => x.hours <= elapsedHours)
          const isNext = FASTING_MILESTONES.find((x) => x.hours > elapsedHours) === m

          return (
            <div
              key={m.hours}
              className={cn(
                'flex-shrink-0 w-36 rounded-2xl border p-3 transition-all',
                achieved && !isCurrent
                  ? 'bg-surface border-border opacity-60'
                  : isCurrent
                  ? 'bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20'
                  : isNext
                  ? 'bg-surface border-primary/30'
                  : 'bg-surface border-border'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{m.icon}</span>
                {achieved ? (
                  <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-full">
                    ✓
                  </span>
                ) : isNext ? (
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                    Next
                  </span>
                ) : null}
              </div>
              <p className="text-xs font-bold text-text-primary leading-tight mb-0.5">{m.title}</p>
              <p className="text-[10px] text-amber-400 font-semibold">{m.hours}h</p>
              <p className="text-[10px] text-text-secondary mt-1 leading-tight line-clamp-2">
                {m.description}
              </p>
              <span
                className={cn(
                  'inline-block mt-2 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border',
                  MILESTONE_CATEGORY_COLOR[m.category]
                )}
              >
                {m.category}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ActiveFastTimer({
  session,
  onEnd,
}: {
  session: ActiveSession
  onEnd: () => void
}) {
  const [elapsedHours, setElapsedHours] = useState(session.elapsed_hours)
  const [ending, setEnding] = useState(false)

  useEffect(() => {
    const startMs = new Date(session.started_at).getTime()
    const tick = () => setElapsedHours((Date.now() - startMs) / 3600000)
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [session.started_at])

  const protocol =
    FASTING_PROTOCOLS.find((p) => p.id === session.protocol) ??
    FASTING_PROTOCOLS.find((p) => p.fastHours === session.target_hours) ??
    FASTING_PROTOCOLS[1]

  const fast = calculateActiveFast(new Date(session.started_at), protocol)
  const done = elapsedHours >= session.target_hours
  const remaining = Math.max(0, session.target_hours - elapsedHours)

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
    <div className="space-y-6">
      {/* Progress ring + timer */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <ProgressRing percent={fast.percentComplete} done={done} />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <Clock className="w-6 h-6 text-amber-400" />
            <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
              {session.protocol}
            </span>
            <span className="text-xl font-bold text-text-primary font-mono leading-none tabular-nums">
              {formatLiveTimer(elapsedHours)}
            </span>
            <span className="text-xs text-text-secondary">
              {done ? '🎉 Goal reached!' : `${formatDuration(remaining)} left`}
            </span>
            <span className="text-xs font-semibold text-amber-400">
              {Math.round(fast.percentComplete)}%
            </span>
          </div>
        </div>

        <p className="text-xs text-text-secondary text-center">
          Started {fmtDate(session.started_at)} · Target {session.target_hours}h
        </p>
      </div>

      {/* Current phase + benefits */}
      <div className="bg-amber-500/8 border border-amber-500/20 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-bold text-amber-400">{fast.currentPhase}</span>
        </div>
        <ul className="space-y-1">
          {fast.currentBenefits.map((b) => (
            <li key={b} className="flex items-center gap-2 text-xs text-text-secondary">
              <span className="w-1 h-1 rounded-full bg-amber-400/60 flex-shrink-0" />
              {b}
            </li>
          ))}
        </ul>
        {fast.nextMilestone && (
          <div className="mt-3 pt-3 border-t border-amber-500/15 flex items-center gap-2">
            <ChevronRight className="w-3 h-3 text-text-secondary" />
            <span className="text-[11px] text-text-secondary">
              Next:{' '}
              <span className="font-semibold text-text-primary">
                {fast.nextMilestone.icon} {fast.nextMilestone.title}
              </span>{' '}
              in {formatDuration(fast.nextMilestone.hours - elapsedHours)}
            </span>
          </div>
        )}
      </div>

      {/* Milestone timeline */}
      <MilestoneTimeline elapsedHours={elapsedHours} />

      {/* End fast button */}
      <button
        type="button"
        onClick={handleEnd}
        disabled={ending}
        className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
      >
        <Square className="w-4 h-4" />
        {ending ? 'Ending…' : 'End Fast'}
      </button>
    </div>
  )
}

function WeeklyStats({ sessions }: { sessions: PastSession[] }) {
  if (sessions.length === 0) return null

  const completed = sessions.filter((s) => s.completed)
  const completionRate = Math.round((completed.length / sessions.length) * 100)
  const avgDuration =
    sessions.reduce((sum, s) => sum + (s.actual_hours ?? 0), 0) / sessions.length
  const longest = Math.max(...sessions.map((s) => s.actual_hours ?? 0))
  const streak = (() => {
    let count = 0
    for (const s of sessions) {
      if (s.completed) count++
      else break
    }
    return count
  })()

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Stats</p>
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Total', value: sessions.length, unit: 'fasts' },
          { label: 'Avg', value: formatDuration(avgDuration), unit: 'duration' },
          { label: 'Longest', value: formatDuration(longest), unit: 'fast' },
          { label: 'Streak', value: streak, unit: 'days' },
        ].map(({ label, value, unit }) => (
          <div key={label} className="bg-surface border border-border rounded-2xl p-3 text-center">
            <p className="text-base font-bold text-text-primary leading-none">{value}</p>
            <p className="text-[10px] text-text-secondary mt-0.5">{label}</p>
            <p className="text-[9px] text-text-secondary/60">{unit}</p>
          </div>
        ))}
      </div>
      <div className="bg-surface border border-border rounded-2xl p-3 flex items-center justify-between">
        <span className="text-xs text-text-secondary">Completion rate</span>
        <div className="flex items-center gap-2">
          <div className="w-24 h-1.5 rounded-full bg-surface-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-400 transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <span className="text-xs font-bold text-text-primary">{completionRate}%</span>
        </div>
      </div>
    </div>
  )
}

export default function FastingPage() {
  const [data, setData] = useState<FastingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [selectedProtocol, setSelectedProtocol] = useState<FastingProtocol>(FASTING_PROTOCOLS[1])
  const [showTimeline, setShowTimeline] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch('/api/fasting?limit=30')
    if (res.ok) {
      const json = await res.json()
      setData(json)
      if (json.default_protocol) {
        const found = FASTING_PROTOCOLS.find((p) => p.id === json.default_protocol)
        if (found) setSelectedProtocol(found)
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const startFast = async () => {
    setStarting(true)
    try {
      const res = await fetch('/api/fasting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol: selectedProtocol.id,
          target_hours: selectedProtocol.fastHours,
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

  const difficultyColor = {
    Beginner: 'text-green-400 bg-green-400/10',
    Intermediate: 'text-amber-400 bg-amber-400/10',
    Advanced: 'text-red-400 bg-red-400/10',
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 -ml-2 rounded-lg hover:bg-surface transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Fasting</h1>
            <p className="text-sm text-text-secondary">Intermittent fasting + autophagy tracker</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Clock className="w-8 h-8 text-text-secondary animate-pulse" />
          </div>
        ) : data?.active_session ? (
          <div className="bg-surface rounded-2xl border border-amber-500/20 p-5">
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-5 text-center">
              ⏱ Active Fast
            </p>
            <ActiveFastTimer session={data.active_session} onEnd={load} />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Protocol selector */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                Choose Protocol
              </p>
              <div className="grid grid-cols-2 gap-2">
                {FASTING_PROTOCOLS.map((p) => {
                  const selected = p.id === selectedProtocol.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProtocol(p)}
                      className={cn(
                        'flex flex-col items-start p-3 rounded-2xl border transition-all text-left',
                        selected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-border bg-surface hover:border-border/80'
                      )}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span
                          className={cn(
                            'text-base font-bold',
                            selected ? 'text-primary' : 'text-text-primary'
                          )}
                        >
                          {p.name}
                        </span>
                        <span
                          className={cn(
                            'text-[9px] font-semibold px-1.5 py-0.5 rounded-full',
                            difficultyColor[p.difficulty]
                          )}
                        >
                          {p.difficulty}
                        </span>
                      </div>
                      <span className="text-[11px] text-text-secondary">{p.description}</span>
                      <span className="text-[10px] text-text-secondary/60 mt-0.5">
                        Fast {p.fastHours}h · Eat {p.eatHours}h
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Selected protocol benefits */}
            {selectedProtocol && (
              <div className="bg-surface border border-border rounded-2xl p-4">
                <p className="text-xs font-semibold text-text-secondary mb-2">
                  {selectedProtocol.name} Benefits
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {selectedProtocol.benefits.map((b) => (
                    <span
                      key={b}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-surface-secondary text-text-secondary border border-border"
                    >
                      {b}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-text-secondary/60 italic">{selectedProtocol.research}</p>
              </div>
            )}

            {/* Autophagy preview timeline */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowTimeline((v) => !v)}
                className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wide hover:text-text-primary transition-colors"
              >
                <ChevronRight
                  className={cn('w-3 h-3 transition-transform', showTimeline && 'rotate-90')}
                />
                Autophagy Timeline Preview
              </button>
              {showTimeline && <MilestoneTimeline elapsedHours={selectedProtocol.fastHours} />}
            </div>

            <button
              type="button"
              onClick={startFast}
              disabled={starting}
              className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-2xl font-semibold text-base hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Play className="w-5 h-5" />
              {starting ? 'Starting…' : `Start ${selectedProtocol.name} Fast`}
            </button>

            <p className="text-xs text-text-secondary text-center">
              Fast for {selectedProtocol.fastHours}h · Eating window {selectedProtocol.eatHours}h
            </p>
          </div>
        )}

        {/* Weekly stats */}
        <WeeklyStats sessions={data?.recent_sessions ?? []} />

        {/* History chart */}
        {(data?.recent_sessions ?? []).length >= 2 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Recent Fasts
            </p>
            <div className="bg-surface rounded-2xl border border-border p-4">
              <ResponsiveContainer width="100%" height={130}>
                <BarChart
                  data={[...(data?.recent_sessions ?? [])]
                    .reverse()
                    .slice(-10)
                    .map((s) => ({
                      label: new Date(s.started_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      }),
                      hours: +(s.actual_hours ?? 0).toFixed(1),
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
                    formatter={(value: number) => [`${value}h`, 'Fasted']}
                  />
                  <ReferenceLine
                    y={data?.default_hours ?? 16}
                    stroke="rgba(245,158,11,0.4)"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Goal',
                      position: 'right',
                      fontSize: 10,
                      fill: 'rgba(245,158,11,0.6)',
                    }}
                  />
                  <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                    {[...(data?.recent_sessions ?? [])]
                      .reverse()
                      .slice(-10)
                      .map((s, i) => (
                        <Cell key={i} fill={s.completed ? '#f59e0b' : 'rgba(245,158,11,0.3)'} />
                      ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-text-secondary text-center mt-1">
                Amber = completed goal
              </p>
            </div>
          </div>
        )}

        {/* History list */}
        {(data?.recent_sessions ?? []).length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">History</p>
            <div className="space-y-2">
              {data!.recent_sessions.slice(0, 10).map((s) => (
                <div key={s.id} className="bg-surface rounded-2xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-text-primary">{s.protocol}</span>
                        <span
                          className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                            s.completed
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-surface-secondary text-text-secondary'
                          )}
                        >
                          {s.completed ? 'Complete' : 'Partial'}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary">
                        {formatDuration(s.actual_hours ?? 0)} of {s.target_hours}h target
                      </p>
                      <p className="text-xs text-text-secondary/60 mt-0.5">{fmtDate(s.started_at)}</p>
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
            <Clock className="w-10 h-10 text-text-secondary/40 mb-3" />
            <p className="text-text-secondary text-sm">No fasting sessions yet.</p>
            <p className="text-text-secondary text-xs mt-1">
              Choose a protocol above and start your first fast.
            </p>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
