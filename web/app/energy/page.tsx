'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Zap,
  Moon,
  Footprints,
  Coffee,
  Clock,
  Plus,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Star,
  TrendingDown,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Bell,
} from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { cn } from '@/lib/utils'
import {
  analyzeEnergy,
  calculateEnergyDebt,
  getCaffeineModel,
  getPeakPerformanceWindow,
  ENERGY_TYPE_LABELS,
  ENERGY_TYPE_COLORS,
  CHRONOTYPE_LABELS,
  minutesToTime,
  timeToMinutes,
} from '@/lib/energy-management'
import type { EnergyLog, UltradianCycle, EnergyRating, Chronotype, EnergyType, EnergyAnalysis } from '@/lib/energy-management'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'

// ─── Constants ────────────────────────────────────────────────────────────────

type Tab = 'today' | 'focus' | 'insights'
type TimerPhase = 'idle' | 'focus' | 'rest' | 'done'

const FOCUS_SEC = 90 * 60
const REST_SEC = 20 * 60

const DEFAULT_LOG: Omit<EnergyLog, 'date'> = {
  wake_time: '07:00',
  chronotype: 'intermediate',
  sleep_hours: 7,
  sleep_quality: 3,
  steps: 0,
  meal_quality_avg: 3,
  caffeine_mg: 0,
  caffeine_time: '08:00',
  ultradian_cycles: [],
  energy_ratings: [],
}

// ─── Helper components ────────────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
  size = 'md',
}: {
  value: number
  onChange: (v: number) => void
  size?: 'sm' | 'md'
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={cn(
            'transition-colors',
            size === 'sm' ? 'w-5 h-5' : 'w-6 h-6',
          )}
          aria-label={`${s} stars`}
        >
          <Star
            className={cn(
              'w-full h-full',
              s <= value ? 'text-yellow-400 fill-yellow-400' : 'text-border',
            )}
          />
        </button>
      ))}
    </div>
  )
}

function EnergyDebtMeter({ debt }: { debt: number }) {
  const color = debt < 30 ? '#10b981' : debt < 55 ? '#f59e0b' : '#ef4444'
  const label = debt < 30 ? 'Low' : debt < 55 ? 'Moderate' : 'High'
  const r = 48
  const circ = 2 * Math.PI * r
  const fill = circ - (debt / 100) * circ
  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 110 110" className="w-28 h-28">
        <circle cx={55} cy={55} r={r} fill="none" stroke="currentColor" strokeWidth={9} className="text-border" />
        <circle
          cx={55} cy={55} r={r} fill="none" stroke={color} strokeWidth={9}
          strokeDasharray={circ} strokeDashoffset={fill}
          strokeLinecap="round" transform="rotate(-90 55 55)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text x={55} y={51} textAnchor="middle" fontSize={20} fontWeight="bold" fill={color}>{debt}</text>
        <text x={55} y={67} textAnchor="middle" fontSize={11} fill="currentColor" className="text-text-secondary">debt</text>
      </svg>
      <span className="text-sm font-semibold" style={{ color }}>{label} Energy Debt</span>
    </div>
  )
}

function CaffeineTimeline({
  dose,
  takenAt,
  wakeTime,
  avoidAfter,
}: {
  dose: number
  takenAt: string
  wakeTime: string
  avoidAfter: string
}) {
  const START_H = 6
  const END_H = 24
  const range = (END_H - START_H) * 60
  const toPos = (hhmm: string) =>
    Math.max(0, Math.min(100, ((timeToMinutes(hhmm) - START_H * 60) / range) * 100))

  const takenPct = toPos(takenAt)
  const avoidPct = toPos(avoidAfter)
  const wakePct = toPos(wakeTime)
  const cortisol_end = minutesToTime(timeToMinutes(wakeTime) + 90)
  const cortisol_end_pct = toPos(cortisol_end)

  return (
    <div className="space-y-2">
      <div className="relative h-8 rounded-lg bg-surface overflow-hidden border border-border">
        {/* Cortisol peak zone */}
        <div
          className="absolute top-0 bottom-0 bg-amber-500/20 border-r border-amber-500/40"
          style={{ left: `${wakePct}%`, width: `${cortisol_end_pct - wakePct}%` }}
        />
        {/* Caffeine avoid zone */}
        <div
          className="absolute top-0 bottom-0 bg-red-500/15"
          style={{ left: `${avoidPct}%`, right: '0%' }}
        />
        {/* Dose marker */}
        <div
          className="absolute top-1 bottom-1 w-2 rounded-full bg-amber-500"
          style={{ left: `${takenPct}%` }}
          title={`Caffeine taken: ${takenAt}`}
        />
        {/* Avoid marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500"
          style={{ left: `${avoidPct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-text-secondary px-1">
        {[6, 9, 12, 15, 18, 21, 24].map((h) => (
          <span key={h}>{h}h</span>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-[11px]">
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 rounded bg-amber-500/30 border border-amber-500/50" />
          <span className="text-text-secondary">Cortisol peak (delay caffeine)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 rounded bg-red-500/30 border border-red-500/50" />
          <span className="text-text-secondary">Avoid caffeine after {avoidAfter}</span>
        </div>
      </div>
    </div>
  )
}

function UltradianTimeline({
  cycles,
  wakeTime,
}: {
  cycles: UltradianCycle[]
  wakeTime: string
}) {
  const START_H = parseInt(wakeTime.split(':')[0], 10) - 1
  const END_H = START_H + 16
  const range = (END_H - START_H) * 60
  const toPos = (hhmm: string) =>
    Math.max(0, Math.min(100, ((timeToMinutes(hhmm) - START_H * 60) / range) * 100))
  const toWidth = (durationMin: number) =>
    Math.min(100, (durationMin / range) * 100)

  const perf_to_opacity = (r: number) => 0.3 + (r / 5) * 0.7

  return (
    <div className="space-y-2">
      <div className="relative h-10 rounded-xl bg-surface border border-border overflow-hidden">
        {/* Hour marks */}
        {Array.from({ length: END_H - START_H + 1 }, (_, i) => START_H + i).map((h) => (
          <div
            key={h}
            className="absolute top-0 bottom-0 w-px bg-border/40"
            style={{ left: `${((h - START_H) / (END_H - START_H)) * 100}%` }}
          />
        ))}
        {/* Cycles */}
        {cycles.map((cycle, i) => (
          <div
            key={i}
            className="absolute top-1 bottom-1 rounded-lg flex items-center justify-center text-[9px] font-bold text-white overflow-hidden"
            style={{
              left: `${toPos(cycle.start_time)}%`,
              width: `${toWidth(cycle.duration_min)}%`,
              backgroundColor: ENERGY_TYPE_COLORS[cycle.energy_type],
              opacity: perf_to_opacity(cycle.performance_rating),
            }}
            title={`${cycle.start_time} · ${cycle.energy_type} · ★${cycle.performance_rating}`}
          >
            {cycle.duration_min >= 60 ? `★${cycle.performance_rating}` : ''}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-text-secondary px-1">
        {Array.from({ length: Math.ceil((END_H - START_H) / 2) + 1 }, (_, i) => START_H + i * 2).map((h) => (
          <span key={h}>{h % 24}h</span>
        ))}
      </div>
    </div>
  )
}

// ─── Focus Timer ──────────────────────────────────────────────────────────────

function FocusTimer() {
  const [phase, setPhase] = useState<TimerPhase>('idle')
  const [remaining, setRemaining] = useState(FOCUS_SEC)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clear = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  const start = useCallback(() => {
    setPhase('focus')
    setRemaining(FOCUS_SEC)
    clear()
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current!)
          setPhase('rest')
          setRemaining(REST_SEC)
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Focus cycle complete! 🎉', { body: 'Take a 20-minute rest now.' })
          }
          setTimeout(() => {
            intervalRef.current = setInterval(() => {
              setRemaining((r2) => {
                if (r2 <= 1) {
                  clearInterval(intervalRef.current!)
                  setPhase('done')
                  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    new Notification('Rest complete!', { body: 'Ready for your next 90-min cycle.' })
                  }
                  return 0
                }
                return r2 - 1
              })
            }, 1000)
          }, 0)
          return 0
        }
        return r - 1
      })
    }, 1000)
  }, [])

  const [paused, setPaused] = useState(false)
  const pauseResume = () => {
    if (paused) {
      setPaused(false)
      intervalRef.current = setInterval(() => {
        setRemaining((r) => {
          if (r <= 1) { clearInterval(intervalRef.current!); setPhase('done'); return 0 }
          return r - 1
        })
      }, 1000)
    } else {
      setPaused(true)
      clear()
    }
  }

  const reset = () => { clear(); setPhase('idle'); setRemaining(FOCUS_SEC); setPaused(false) }

  useEffect(() => () => clear(), [])

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const total = phase === 'focus' ? FOCUS_SEC : REST_SEC
  const pct = phase === 'idle' ? 0 : ((total - remaining) / total) * 100
  const color = phase === 'focus' ? '#3b82f6' : phase === 'rest' ? '#10b981' : '#8b5cf6'

  const requestNotif = () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  return (
    <div className="bg-surface rounded-2xl border border-border p-5 flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full">
        <div>
          <h3 className="font-semibold text-text-primary">Ultradian Focus Cycle</h3>
          <p className="text-xs text-text-secondary">90 min focus · 20 min rest (BRAC)</p>
        </div>
        <button onClick={requestNotif} className="p-2 rounded-lg border border-border text-text-secondary hover:text-text-primary">
          <Bell className="w-4 h-4" />
        </button>
      </div>

      {/* Progress ring */}
      <svg viewBox="0 0 140 140" className="w-36 h-36">
        <circle cx={70} cy={70} r={58} fill="none" stroke="currentColor" strokeWidth={10} className="text-border" />
        <circle
          cx={70} cy={70} r={58} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={2 * Math.PI * 58}
          strokeDashoffset={2 * Math.PI * 58 * (1 - pct / 100)}
          strokeLinecap="round" transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
        <text x={70} y={63} textAnchor="middle" fontSize={26} fontWeight="bold" fill={color}>
          {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
        </text>
        <text x={70} y={82} textAnchor="middle" fontSize={12} fill="currentColor" className="text-text-secondary">
          {phase === 'idle' ? 'Ready' : phase === 'focus' ? 'Focus' : phase === 'rest' ? 'Rest' : 'Done ✓'}
        </text>
      </svg>

      <div className="flex gap-3">
        {phase === 'idle' || phase === 'done' ? (
          <button
            onClick={start}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm"
          >
            <Play className="w-4 h-4" />
            {phase === 'done' ? 'New Cycle' : 'Start Focus Cycle'}
          </button>
        ) : (
          <>
            <button
              onClick={pauseResume}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-text-secondary hover:text-text-primary text-sm"
            >
              {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {paused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-text-secondary hover:text-text-primary text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </>
        )}
      </div>

      {phase !== 'idle' && (
        <div className="w-full bg-surface-secondary rounded-xl p-3 text-xs text-text-secondary text-center">
          {phase === 'focus'
            ? '🧠 Deep work mode — eliminate distractions'
            : phase === 'rest'
              ? '🚶 Step away from screen · walk · hydrate'
              : '✅ Cycle complete! Log performance in Today tab'}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EnergyPage() {
  const [tab, setTab] = useState<Tab>('today')
  const [log, setLog] = useState<Omit<EnergyLog, 'date'>>(DEFAULT_LOG)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [analysis, setAnalysis] = useState<EnergyAnalysis | null>(null)
  const [historyLogs, setHistoryLogs] = useState<EnergyLog[]>([])
  const [trend, setTrend] = useState<{ date: string; energyDebt: number; sleepHours: number; steps: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [newCycle, setNewCycle] = useState<UltradianCycle>({
    start_time: minutesToTime(new Date().getHours() * 60 + new Date().getMinutes()),
    duration_min: 90,
    performance_rating: 3,
    energy_type: 'mental',
  })
  const [showCycleForm, setShowCycleForm] = useState(false)
  const [quickEnergyLevel, setQuickEnergyLevel] = useState(3)
  const [showQuickLog, setShowQuickLog] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  // Fetch data
  useEffect(() => {
    setLoading(true)
    fetch('/api/energy')
      .then((r) => r.json())
      .then((d) => {
        if (d.today) {
          const { id, user_id, created_at, date, ...rest } = d.today
          setLog({
            ...rest,
            ultradian_cycles: (rest.ultradian_cycles as UltradianCycle[]) ?? [],
            energy_ratings: (rest.energy_ratings as EnergyRating[]) ?? [],
          })
          if (d.analysis) setAnalysis(d.analysis)
        }
        setHistoryLogs((d.logs as EnergyLog[]) ?? [])
        setTrend(d.trend ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Recompute analysis client-side when log changes
  useEffect(() => {
    const computed = analyzeEnergy({ date: today, ...log })
    setAnalysis(computed)
  }, [log, today])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/energy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today, ...log }),
      })
      if (res.ok) {
        setSavedMsg('Saved ✓')
        setTimeout(() => setSavedMsg(''), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  const logQuickEnergy = async () => {
    const time = minutesToTime(new Date().getHours() * 60 + new Date().getMinutes())
    const updated = [
      ...log.energy_ratings,
      { time, level: quickEnergyLevel } as EnergyRating,
    ]
    setLog((prev) => ({ ...prev, energy_ratings: updated }))
    setShowQuickLog(false)
    await fetch('/api/energy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: today, ...log, energy_ratings: updated }),
    })
  }

  const addCycle = () => {
    setLog((prev) => ({
      ...prev,
      ultradian_cycles: [...prev.ultradian_cycles, { ...newCycle }],
    }))
    setShowCycleForm(false)
    setNewCycle({
      start_time: minutesToTime(new Date().getHours() * 60 + new Date().getMinutes()),
      duration_min: 90,
      performance_rating: 3,
      energy_type: 'mental',
    })
  }

  const removeCycle = (i: number) => {
    setLog((prev) => ({
      ...prev,
      ultradian_cycles: prev.ultradian_cycles.filter((_, idx) => idx !== i),
    }))
  }

  // Insight: best hours from history
  const hourPerformance = (() => {
    const acc: Record<number, { sum: number; count: number }> = {}
    historyLogs.forEach((l) => {
      ;(l.ultradian_cycles as UltradianCycle[])?.forEach((c) => {
        const h = parseInt(c.start_time.split(':')[0], 10)
        if (!acc[h]) acc[h] = { sum: 0, count: 0 }
        acc[h].sum += c.performance_rating
        acc[h].count++
      })
    })
    return Object.entries(acc)
      .map(([hour, { sum, count }]) => ({
        hour: parseInt(hour, 10),
        avg: Math.round((sum / count) * 10) / 10,
      }))
      .sort((a, b) => a.hour - b.hour)
  })()

  // 30-day debt trend from history
  const debtTrend = historyLogs
    .slice()
    .reverse()
    .map((l) => ({
      date: (l.date as string).slice(5),
      debt: analyzeEnergy({
        ...(l as EnergyLog),
        ultradian_cycles: (l.ultradian_cycles as UltradianCycle[]) ?? [],
        energy_ratings: (l.energy_ratings as EnergyRating[]) ?? [],
      }).energyDebt,
    }))

  const caffeineModel =
    log.caffeine_mg > 0
      ? getCaffeineModel(log.caffeine_mg, log.caffeine_time, '22:30')
      : null

  const debtColor = !analysis
    ? '#6b7280'
    : analysis.energyDebt < 30
      ? '#10b981'
      : analysis.energyDebt < 55
        ? '#f59e0b'
        : '#ef4444'

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border px-4 pt-4 pb-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="p-2 rounded-xl bg-yellow-500/10">
            <Zap className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-text-primary leading-none">Energy Management</h1>
            <p className="text-xs text-text-secondary mt-0.5">Ultradian cycles · Energy debt · Caffeine timing</p>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving…' : savedMsg || 'Save'}
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto mt-3 flex gap-1 bg-surface rounded-xl p-1">
          {(['today', 'focus', 'insights'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize',
                tab === t
                  ? 'bg-background text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {t === 'today' ? 'Today' : t === 'focus' ? 'Focus' : 'Insights'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {loading && (
          <div className="text-center text-text-secondary py-12 text-sm">Loading…</div>
        )}

        {/* ── TODAY TAB ─────────────────────────────────────── */}
        {!loading && tab === 'today' && (
          <>
            {/* Energy Debt + Peak Window */}
            <div className="bg-surface rounded-2xl border border-border p-4 flex items-center gap-4">
              {analysis && <EnergyDebtMeter debt={analysis.energyDebt} />}
              <div className="flex-1 space-y-3">
                {analysis && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2">
                    <p className="text-[11px] text-text-secondary font-medium uppercase tracking-wide">Peak Window</p>
                    <p className="text-sm font-bold text-emerald-500">
                      {analysis.peakWindow.start} – {analysis.peakWindow.end}
                    </p>
                    <p className="text-[10px] text-text-secondary">Optimal for deep work</p>
                  </div>
                )}
                {analysis && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-3 py-2">
                    <p className="text-[11px] text-text-secondary font-medium uppercase tracking-wide">Next Cycle</p>
                    <p className="text-sm font-bold text-blue-400">{analysis.nextCycleStart}</p>
                    <p className="text-[10px] text-text-secondary">Next 90-min focus window</p>
                  </div>
                )}
              </div>
            </div>

            {/* Wake + Chronotype */}
            <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
              <h2 className="font-semibold text-text-primary text-sm">Circadian Settings</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">Wake Time</label>
                  <input
                    type="time"
                    value={log.wake_time}
                    onChange={(e) => setLog((p) => ({ ...p, wake_time: e.target.value }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">Chronotype</label>
                  <select
                    value={log.chronotype}
                    onChange={(e) => setLog((p) => ({ ...p, chronotype: e.target.value as Chronotype }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary"
                  >
                    {(Object.entries(CHRONOTYPE_LABELS) as [Chronotype, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Sleep */}
            <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
              <h2 className="font-semibold text-text-primary text-sm flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-400" /> Sleep
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">Hours Slept</label>
                  <input
                    type="number"
                    min={0}
                    max={14}
                    step={0.5}
                    value={log.sleep_hours}
                    onChange={(e) => setLog((p) => ({ ...p, sleep_hours: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">Sleep Quality</label>
                  <div className="pt-1">
                    <StarRating
                      value={log.sleep_quality}
                      onChange={(v) => setLog((p) => ({ ...p, sleep_quality: v }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Activity + Nutrition */}
            <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
              <h2 className="font-semibold text-text-primary text-sm flex items-center gap-2">
                <Footprints className="w-4 h-4 text-green-400" /> Activity & Nutrition
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">Steps Today</label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={log.steps}
                    onChange={(e) => setLog((p) => ({ ...p, steps: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary"
                  />
                  <p className="text-[10px] text-text-secondary">Goal: 8,000 steps</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">Meal Quality (avg)</label>
                  <div className="pt-1">
                    <StarRating
                      value={Math.round(log.meal_quality_avg)}
                      onChange={(v) => setLog((p) => ({ ...p, meal_quality_avg: v }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Caffeine */}
            <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
              <h2 className="font-semibold text-text-primary text-sm flex items-center gap-2">
                <Coffee className="w-4 h-4 text-amber-500" /> Caffeine Timing
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">Total Caffeine (mg)</label>
                  <input
                    type="number"
                    min={0}
                    step={25}
                    value={log.caffeine_mg}
                    onChange={(e) => setLog((p) => ({ ...p, caffeine_mg: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary"
                  />
                  <p className="text-[10px] text-text-secondary">Coffee ≈ 80–100mg</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">First Dose Time</label>
                  <input
                    type="time"
                    value={log.caffeine_time}
                    onChange={(e) => setLog((p) => ({ ...p, caffeine_time: e.target.value }))}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary"
                  />
                </div>
              </div>

              {log.caffeine_mg > 0 && caffeineModel && (
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-secondary">At bedtime (22:30):</span>
                    <span
                      className={cn(
                        'font-semibold',
                        caffeineModel.remaining > 25 ? 'text-red-400' : 'text-emerald-400',
                      )}
                    >
                      {caffeineModel.remaining}mg remaining
                      {caffeineModel.remaining > 25 ? ' ⚠️' : ' ✓'}
                    </span>
                  </div>
                  <CaffeineTimeline
                    dose={log.caffeine_mg}
                    takenAt={log.caffeine_time}
                    wakeTime={log.wake_time}
                    avoidAfter={caffeineModel.avoidAfter}
                  />
                </div>
              )}
            </div>

            {/* Ultradian Cycles */}
            <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-text-primary text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" /> Ultradian Cycles
                </h2>
                <button
                  onClick={() => setShowCycleForm((s) => !s)}
                  className="flex items-center gap-1 text-xs text-primary font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add cycle
                </button>
              </div>
              <p className="text-[11px] text-text-secondary">
                Log 90-min focus blocks. Rest 20 min between cycles for optimal BRAC compliance.
              </p>

              {showCycleForm && (
                <div className="bg-background rounded-xl border border-border p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs text-text-secondary">Start Time</label>
                      <input
                        type="time"
                        value={newCycle.start_time}
                        onChange={(e) => setNewCycle((p) => ({ ...p, start_time: e.target.value }))}
                        className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-text-secondary">Duration (min)</label>
                      <input
                        type="number"
                        min={30}
                        max={120}
                        value={newCycle.duration_min}
                        onChange={(e) => setNewCycle((p) => ({ ...p, duration_min: parseInt(e.target.value) || 90 }))}
                        className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-secondary">Energy Type</label>
                    <select
                      value={newCycle.energy_type}
                      onChange={(e) => setNewCycle((p) => ({ ...p, energy_type: e.target.value as EnergyType }))}
                      className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary"
                    >
                      {(Object.entries(ENERGY_TYPE_LABELS) as [EnergyType, string][]).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-secondary">Performance Rating</label>
                    <StarRating
                      value={newCycle.performance_rating}
                      onChange={(v) => setNewCycle((p) => ({ ...p, performance_rating: v }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={addCycle}
                      className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-semibold"
                    >
                      Add Cycle
                    </button>
                    <button
                      onClick={() => setShowCycleForm(false)}
                      className="px-4 py-2 rounded-xl border border-border text-text-secondary text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {log.ultradian_cycles.length > 0 ? (
                <div className="space-y-2">
                  {log.ultradian_cycles.map((cycle, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-background rounded-xl border border-border px-3 py-2"
                    >
                      <div
                        className="w-2 h-8 rounded-full flex-shrink-0"
                        style={{ backgroundColor: ENERGY_TYPE_COLORS[cycle.energy_type] }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary">{cycle.start_time}</span>
                          <span className="text-xs text-text-secondary">· {cycle.duration_min} min</span>
                          <span className="text-xs text-text-secondary">· {ENERGY_TYPE_LABELS[cycle.energy_type]}</span>
                        </div>
                        <div className="flex gap-0.5 mt-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={cn(
                                'w-3 h-3',
                                s <= cycle.performance_rating
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-border',
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => removeCycle(i)}
                        className="p-1.5 rounded-lg text-text-secondary hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-secondary text-center py-2">No cycles logged yet today</p>
              )}

              {analysis && log.ultradian_cycles.length > 0 && (
                <div className="flex items-center justify-between bg-background rounded-xl border border-border px-3 py-2">
                  <span className="text-xs text-text-secondary">BRAC Compliance</span>
                  <span
                    className={cn(
                      'text-sm font-bold',
                      analysis.ultradianCompliance >= 80 ? 'text-emerald-400' : 'text-amber-400',
                    )}
                  >
                    {analysis.ultradianCompliance}%
                  </span>
                </div>
              )}
            </div>

            {/* Quick Energy Log */}
            <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-text-primary text-sm">Quick Energy Log</h2>
                <button
                  onClick={() => setShowQuickLog((s) => !s)}
                  className="flex items-center gap-1 text-xs text-primary font-medium"
                >
                  {showQuickLog ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {showQuickLog ? 'Hide' : 'Log now'}
                </button>
              </div>
              {showQuickLog && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-text-secondary">Current energy level:</span>
                    <StarRating value={quickEnergyLevel} onChange={setQuickEnergyLevel} />
                  </div>
                  <button
                    onClick={logQuickEnergy}
                    className="w-full py-2 rounded-xl bg-primary text-white text-sm font-semibold"
                  >
                    Log at {minutesToTime(new Date().getHours() * 60 + new Date().getMinutes())}
                  </button>
                </div>
              )}
              {log.energy_ratings.length > 0 && (
                <div className="space-y-1">
                  {log.energy_ratings.slice(-5).map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                      <span className="font-mono">{r.time}</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={cn('w-3 h-3', s <= r.level ? 'text-yellow-400 fill-yellow-400' : 'text-border')} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommendations */}
            {analysis && analysis.recommendations.length > 0 && (
              <div className="bg-surface rounded-2xl border border-border p-4 space-y-2">
                <h2 className="font-semibold text-text-primary text-sm">💡 Recommendations</h2>
                <div className="space-y-2">
                  {analysis.recommendations.map((r, i) => (
                    <div key={i} className="flex gap-2 text-xs text-text-secondary">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── FOCUS TAB ─────────────────────────────────────── */}
        {!loading && tab === 'focus' && (
          <>
            <FocusTimer />

            {/* Ultradian cycle timeline */}
            <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
              <h2 className="font-semibold text-text-primary text-sm">Today's Cycle Timeline</h2>
              {log.ultradian_cycles.length > 0 ? (
                <>
                  <UltradianTimeline cycles={log.ultradian_cycles} wakeTime={log.wake_time} />
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(ENERGY_TYPE_COLORS) as [EnergyType, string][]).map(([k, c]) => (
                      <div key={k} className="flex items-center gap-1.5 text-xs text-text-secondary">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                        {ENERGY_TYPE_LABELS[k]}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-text-secondary text-center py-4">
                  Log cycles in the Today tab to see your timeline
                </p>
              )}
            </div>

            {/* Daily energy pattern */}
            {analysis && (
              <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
                <h2 className="font-semibold text-text-primary text-sm">Predicted Energy Pattern</h2>
                <p className="text-xs text-text-secondary">Based on chronotype, BRAC cycles, and energy debt</p>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analysis.dailyEnergyPattern}>
                      <defs>
                        <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.3} />
                      <XAxis
                        dataKey="hour"
                        tickFormatter={(h) => `${h}h`}
                        tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                        interval={2}
                      />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} width={28} />
                      <Tooltip
                        contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
                        formatter={(v: number) => [`${v}%`, 'Energy']}
                        labelFormatter={(h) => `${h}:00`}
                      />
                      {/* Peak window */}
                      <ReferenceLine
                        x={parseInt(analysis.peakWindow.start.split(':')[0], 10)}
                        stroke="#10b981"
                        strokeDasharray="4 2"
                        label={{ value: 'Peak start', position: 'top', fontSize: 9, fill: '#10b981' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="predicted"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#energyGrad)"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Performance heatmap by hour (last 14 days) */}
            {hourPerformance.length > 0 && (
              <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
                <h2 className="font-semibold text-text-primary text-sm">Avg Performance by Hour (Last 30 Days)</h2>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.3} />
                      <XAxis dataKey="hour" tickFormatter={(h) => `${h}h`} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} width={28} />
                      <Tooltip
                        contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
                        formatter={(v: number) => [v.toFixed(1), 'Avg Rating']}
                        labelFormatter={(h) => `${h}:00`}
                      />
                      <Bar dataKey="avg" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── INSIGHTS TAB ──────────────────────────────────── */}
        {!loading && tab === 'insights' && (
          <>
            {/* Energy debt 30-day trend */}
            <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
              <h2 className="font-semibold text-text-primary text-sm flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-400" /> Energy Debt Trend (30 Days)
              </h2>
              {debtTrend.length > 1 ? (
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={debtTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.3} />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text-secondary)' }} interval="preserveStartEnd" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} width={28} />
                      <Tooltip
                        contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
                        formatter={(v: number) => [`${v}`, 'Energy Debt']}
                      />
                      <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Moderate', position: 'right', fontSize: 9, fill: '#f59e0b' }} />
                      <ReferenceLine y={60} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'High', position: 'right', fontSize: 9, fill: '#ef4444' }} />
                      <Line type="monotone" dataKey="debt" stroke="#ef4444" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-text-secondary text-center py-6">Log a few days to see your trend</p>
              )}
            </div>

            {/* 7-day trend summary */}
            {trend.length > 0 && (
              <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
                <h2 className="font-semibold text-text-primary text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" /> 7-Day Summary
                </h2>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.3} />
                      <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 9, fill: 'var(--text-secondary)' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} width={28} />
                      <Tooltip
                        contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
                      />
                      <Bar dataKey="energyDebt" name="Energy Debt" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="sleepHours" name="Sleep h" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Best cycle hours */}
            {hourPerformance.length > 0 && (
              <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
                <h2 className="font-semibold text-text-primary text-sm">Best Focus Hours</h2>
                <div className="space-y-2">
                  {[...hourPerformance]
                    .sort((a, b) => b.avg - a.avg)
                    .slice(0, 5)
                    .map(({ hour, avg }) => (
                      <div key={hour} className="flex items-center gap-3">
                        <span className="text-sm font-mono text-text-secondary w-12">{hour}:00</span>
                        <div className="flex-1 bg-background rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-yellow-400"
                            style={{ width: `${(avg / 5) * 100}%`, transition: 'width 0.6s ease' }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-text-primary w-8 text-right">{avg}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Caffeine analysis */}
            {historyLogs.filter((l) => (l.caffeine_mg as number) > 0).length > 2 && (
              <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
                <h2 className="font-semibold text-text-primary text-sm flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-amber-500" /> Caffeine Timing Analysis
                </h2>
                <div className="space-y-2 text-xs text-text-secondary">
                  <div className="flex justify-between bg-background rounded-xl border border-border px-3 py-2">
                    <span>Avg caffeine intake</span>
                    <span className="font-semibold text-text-primary">
                      {Math.round(
                        historyLogs.reduce((s, l) => s + (l.caffeine_mg as number), 0) /
                          Math.max(1, historyLogs.length),
                      )}
                      mg/day
                    </span>
                  </div>
                  <div className="flex justify-between bg-background rounded-xl border border-border px-3 py-2">
                    <span>Days with late caffeine (&gt;25mg at bedtime)</span>
                    <span className="font-semibold text-red-400">
                      {historyLogs.filter((l) => {
                        if (!l.caffeine_mg) return false
                        const m = getCaffeineModel(
                          l.caffeine_mg as number,
                          (l.caffeine_time as string) || '08:00',
                          '22:30',
                        )
                        return m.remaining > 25
                      }).length}
                    </span>
                  </div>
                  <div className="flex justify-between bg-background rounded-xl border border-border px-3 py-2">
                    <span>Days caffeine taken in cortisol window</span>
                    <span className="font-semibold text-amber-400">
                      {historyLogs.filter((l) => {
                        if (!l.caffeine_mg || !l.caffeine_time) return false
                        const cortisol_end = timeToMinutes((l.wake_time as string) || '07:00') + 90
                        return timeToMinutes(l.caffeine_time as string) < cortisol_end
                      }).length}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-text-secondary">
                  Tip: Delay first caffeine 90 min after waking to avoid blunting natural cortisol (Huberman 2021)
                </p>
              </div>
            )}

            {/* Personalized recommendations */}
            {analysis && (
              <div className="bg-surface rounded-2xl border border-border p-4 space-y-3">
                <h2 className="font-semibold text-text-primary text-sm">Personalized Recommendations</h2>
                <div className="space-y-2">
                  {analysis.recommendations.map((r, i) => (
                    <div key={i} className="flex gap-2 bg-background rounded-xl border border-border px-3 py-2.5 text-xs text-text-secondary">
                      <span className="text-primary mt-0.5 flex-shrink-0">→</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-text-secondary mt-1">
                  Based on Loehr &amp; Schwartz (2003), Kleitman (1963), Dijk &amp; Czeisler (1994)
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
