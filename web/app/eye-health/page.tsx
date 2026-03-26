'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Eye,
  Timer,
  TrendingUp,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  CheckCircle2,
  Sun,
  Monitor,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { BottomNav } from '@/components/bottom-nav'
import { cn } from '@/lib/utils'
import {
  VISION_EXERCISES,
  EYE_SYMPTOMS,
  calculateEyeScore,
  breaksTarget,
  blueLightExposure,
} from '@/lib/eye-health'
import type { EyeHealthLog, EyeHealthScore, VisionExercise } from '@/lib/eye-health'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'today' | 'exercises' | 'trends'
type TimerPhase = 'idle' | 'work' | 'rest' | 'done'

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const fill = circ - (score / 100) * circ
  const color =
    score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <svg viewBox="0 0 120 120" className="w-28 h-28">
      <circle cx={60} cy={60} r={r} fill="none" stroke="currentColor" strokeWidth={10}
        className="text-border" />
      <circle
        cx={60} cy={60} r={r} fill="none" stroke={color} strokeWidth={10}
        strokeDasharray={circ} strokeDashoffset={fill}
        strokeLinecap="round" transform="rotate(-90 60 60)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x={60} y={56} textAnchor="middle" fontSize={22} fontWeight="bold" fill={color}>{score}</text>
      <text x={60} y={74} textAnchor="middle" fontSize={13} fill="currentColor" className="text-text-secondary">
        Grade {grade}
      </text>
    </svg>
  )
}

// ─── 20-20-20 Timer ───────────────────────────────────────────────────────────

const WORK_SEC = 20 * 60 // 20 minutes
const REST_SEC = 20      // 20 seconds

function TwentyTimer({ onBreakComplete }: { onBreakComplete: () => void }) {
  const [phase, setPhase] = useState<TimerPhase>('idle')
  const [remaining, setRemaining] = useState(WORK_SEC)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clear = () => { if (intervalRef.current) clearInterval(intervalRef.current) }

  const start = useCallback(() => {
    setPhase('work')
    setRemaining(WORK_SEC)
    clear()
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current!)
          setPhase('rest')
          setRemaining(REST_SEC)
          setTimeout(() => {
            intervalRef.current = setInterval(() => {
              setRemaining((r2) => {
                if (r2 <= 1) {
                  clearInterval(intervalRef.current!)
                  setPhase('done')
                  onBreakComplete()
                  return 0
                }
                return r2 - 1
              })
            }, 1000)
          }, 100)
          return 0
        }
        return r - 1
      })
    }, 1000)
  }, [onBreakComplete])

  const reset = useCallback(() => {
    clear()
    setPhase('idle')
    setRemaining(WORK_SEC)
  }, [])

  useEffect(() => () => clear(), [])

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const progress = phase === 'work'
    ? ((WORK_SEC - remaining) / WORK_SEC) * 100
    : phase === 'rest'
    ? ((REST_SEC - remaining) / REST_SEC) * 100
    : 0

  const phaseColor =
    phase === 'work' ? 'text-blue-500' :
    phase === 'rest' ? 'text-emerald-500' :
    phase === 'done' ? 'text-accent' : 'text-text-secondary'

  const phaseLabel =
    phase === 'idle' ? 'Ready to start' :
    phase === 'work' ? 'Focus — look away when timer ends' :
    phase === 'rest' ? '👀 Look 20 ft away for 20 sec!' :
    '✅ Break complete!'

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx={50} cy={50} r={44} fill="none" stroke="currentColor" strokeWidth={8} className="text-border" />
          <circle
            cx={50} cy={50} r={44} fill="none" stroke="currentColor" strokeWidth={8}
            strokeDasharray={276.46} strokeDashoffset={276.46 * (1 - progress / 100)}
            strokeLinecap="round"
            className={cn(phase === 'rest' ? 'text-emerald-500' : 'text-blue-500')}
            style={{ transition: 'stroke-dashoffset 0.3s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-2xl font-bold tabular-nums', phaseColor)}>
            {phase === 'idle' ? '20:00' : fmt(remaining)}
          </span>
          <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wide mt-0.5">
            {phase === 'work' ? 'Focus' : phase === 'rest' ? 'REST' : phase === 'done' ? 'Done' : 'Ready'}
          </span>
        </div>
      </div>

      <p className="text-sm text-text-secondary text-center">{phaseLabel}</p>

      <div className="flex gap-2">
        {(phase === 'idle' || phase === 'done') && (
          <button
            onClick={start}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium"
          >
            <Play className="w-4 h-4" /> Start 20-min timer
          </button>
        )}
        {(phase === 'work' || phase === 'rest') && (
          <button
            onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm font-medium text-text-secondary"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Exercise Card ────────────────────────────────────────────────────────────

function ExerciseCard({
  exercise,
  done,
  onDone,
}: {
  exercise: VisionExercise
  done: boolean
  onDone: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [running, setRunning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(Math.round(exercise.duration_min * 60))
  const [step, setStep] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clear = () => { if (timerRef.current) clearInterval(timerRef.current) }

  const startGuided = () => {
    setRunning(true)
    setSecondsLeft(Math.round(exercise.duration_min * 60))
    setStep(0)
    const stepDur = Math.round((exercise.duration_min * 60) / exercise.instructions.length)
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clear()
          setRunning(false)
          onDone()
          return 0
        }
        const elapsed = Math.round(exercise.duration_min * 60) - s + 1
        setStep(Math.min(exercise.instructions.length - 1, Math.floor(elapsed / stepDur)))
        return s - 1
      })
    }, 1000)
  }

  const stopGuided = () => {
    clear()
    setRunning(false)
    setSecondsLeft(Math.round(exercise.duration_min * 60))
    setStep(0)
  }

  useEffect(() => () => clear(), [])

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className={cn(
      'bg-surface border rounded-2xl p-4 transition-colors',
      done ? 'border-emerald-500/40' : 'border-border'
    )}>
      <div
        className="flex items-start justify-between cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {done && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
            <h3 className="text-sm font-semibold text-text-primary">{exercise.name}</h3>
          </div>
          <p className="text-xs text-text-secondary">{exercise.duration_min} min · {exercise.frequency}</p>
          <p className="text-xs text-text-secondary mt-1 line-clamp-2">{exercise.benefit}</p>
        </div>
        <ChevronRight className={cn('w-4 h-4 text-text-secondary shrink-0 mt-0.5 transition-transform', expanded && 'rotate-90')} />
      </div>

      {expanded && (
        <div className="mt-3 space-y-3">
          <ol className="space-y-1.5">
            {exercise.instructions.map((inst, i) => (
              <li
                key={i}
                className={cn(
                  'flex gap-2 text-xs',
                  running && step === i ? 'text-primary font-semibold' : 'text-text-secondary'
                )}
              >
                <span className="shrink-0 w-5 h-5 rounded-full bg-surface-secondary border border-border flex items-center justify-center text-[10px] font-medium">
                  {i + 1}
                </span>
                {inst}
              </li>
            ))}
          </ol>

          {running ? (
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold tabular-nums text-primary">{fmt(secondsLeft)}</span>
              <button
                onClick={stopGuided}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-medium text-text-secondary"
              >
                <Pause className="w-3.5 h-3.5" /> Stop
              </button>
            </div>
          ) : (
            <button
              onClick={done ? undefined : startGuided}
              className={cn(
                'w-full py-2 rounded-xl text-sm font-medium',
                done
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                  : 'bg-primary text-white'
              )}
            >
              {done ? '✅ Done today' : '▶ Start guided'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EyeHealthPage() {
  const [tab, setTab] = useState<Tab>('today')

  // Today state
  const [screenHours, setScreenHours] = useState(6)
  const [outdoorMins, setOutdoorMins] = useState(30)
  const [breaksTaken, setBreaksTaken] = useState(0)
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [blinkReminder, setBlinkReminder] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Remote data
  const [logs, setLogs] = useState<any[]>([])
  const [score, setScore] = useState<EyeHealthScore | null>(null)
  const [trend, setTrend] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Exercises done today (persisted in localStorage)
  const [doneExercises, setDoneExercises] = useState<string[]>([])

  const target = breaksTarget(screenHours)
  const blueLight = blueLightExposure(screenHours, Math.min(screenHours, 2))

  // Load from API
  useEffect(() => {
    fetch('/api/eye-health')
      .then((r) => r.json())
      .then((res) => {
        setLogs(res.logs || [])
        setScore(res.score || null)
        setTrend(res.trend || [])
        // Pre-fill today if exists
        const today = new Date().toISOString().slice(0, 10)
        const todayLog = (res.logs || []).find((l: any) => l.logged_at === today)
        if (todayLog) {
          setScreenHours(todayLog.screen_hours ?? 6)
          setOutdoorMins(todayLog.outdoor_minutes ?? 30)
          setBreaksTaken(todayLog.breaks_taken ?? 0)
          setSymptoms(todayLog.symptoms ?? [])
          setBlinkReminder(todayLog.blink_reminder_used ?? false)
          setNotes(todayLog.notes ?? '')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [saved])

  // Exercises from localStorage
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    const stored = localStorage.getItem(`eye-exercises-${today}`)
    if (stored) setDoneExercises(JSON.parse(stored))
  }, [])

  const markExerciseDone = (id: string) => {
    const today = new Date().toISOString().slice(0, 10)
    setDoneExercises((prev) => {
      const updated = prev.includes(id) ? prev : [...prev, id]
      localStorage.setItem(`eye-exercises-${today}`, JSON.stringify(updated))
      return updated
    })
  }

  const handleBreakComplete = useCallback(() => {
    setBreaksTaken((b) => b + 1)
  }, [])

  const toggleSymptom = (id: string) => {
    setSymptoms((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/eye-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screen_hours: screenHours,
          outdoor_minutes: outdoorMins,
          breaks_taken: breaksTaken,
          symptoms,
          blink_reminder_used: blinkReminder,
          notes,
        }),
      })
      setSaved((v) => !v)
    } finally {
      setSaving(false)
    }
  }

  // Live score from current inputs
  const liveLog = {
    date: new Date().toISOString().slice(0, 10),
    screen_hours: screenHours,
    outdoor_minutes: outdoorMins,
    breaks_taken: breaksTaken,
    breaks_target: target,
    symptoms,
    blink_reminder_used: blinkReminder,
  }
  const liveScore = calculateEyeScore([liveLog, ...logs.slice(1).map((l) => ({
    date: l.logged_at,
    screen_hours: l.screen_hours ?? 0,
    outdoor_minutes: l.outdoor_minutes ?? 0,
    breaks_taken: l.breaks_taken ?? 0,
    breaks_target: l.breaks_target ?? 0,
    symptoms: l.symptoms ?? [],
    blink_reminder_used: l.blink_reminder_used ?? false,
  }))])

  return (
    <div className="min-h-screen bg-background text-text-primary pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Link href="/dashboard" className="p-1.5 rounded-lg hover:bg-surface">
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </Link>
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          <h1 className="text-base font-semibold">Eye Health</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-4 pb-2 border-b border-border">
        {(['today', 'exercises', 'trends'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-1.5 rounded-xl text-sm font-medium transition-colors capitalize',
              tab === t
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4 space-y-4 max-w-2xl mx-auto">
        {/* ── TODAY TAB ── */}
        {tab === 'today' && (
          <>
            {/* Score */}
            <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col items-center gap-2">
              <ScoreRing score={liveScore.score} grade={liveScore.grade} />
              <div className="text-xs text-text-secondary text-center mt-1">
                Trend: <span className={cn(
                  'font-medium',
                  liveScore.trend_7d === 'improving' ? 'text-emerald-500' :
                  liveScore.trend_7d === 'worsening' ? 'text-rose-500' : 'text-text-secondary'
                )}>
                  {liveScore.trend_7d === 'improving' ? '↑ Improving' : liveScore.trend_7d === 'worsening' ? '↓ Worsening' : '→ Stable'}
                </span>
              </div>
              <div className="flex gap-4 mt-1 text-xs text-text-secondary">
                <span>Breaks: <b className="text-text-primary">{liveScore.break_compliance}%</b></span>
                <span>Outdoor: <b className="text-text-primary">{liveScore.outdoor_score}/30</b></span>
                <span className={cn('font-medium', blueLight === 'High' ? 'text-rose-500' : blueLight === 'Moderate' ? 'text-amber-500' : 'text-emerald-500')}>
                  Blue light: {blueLight}
                </span>
              </div>
            </div>

            {/* Screen time */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Screen Time</span>
                <span className="ml-auto text-sm font-bold tabular-nums">{screenHours}h</span>
              </div>
              <input
                type="range" min={0} max={16} step={0.5} value={screenHours}
                onChange={(e) => setScreenHours(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-text-secondary">
                <span>0h</span><span>4h</span><span>8h</span><span>12h</span><span>16h</span>
              </div>
            </div>

            {/* Outdoor time */}
            <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold">Outdoor Time</span>
                <span className="ml-auto text-sm font-bold tabular-nums">{outdoorMins} min</span>
              </div>
              <input
                type="range" min={0} max={240} step={5} value={outdoorMins}
                onChange={(e) => setOutdoorMins(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <p className="text-[10px] text-text-secondary">
                Target: ≥120 min/day (Sherwin et al. 2012 — reduces myopia risk 23%)
              </p>
            </div>

            {/* Break counter */}
            <div className="bg-surface border border-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Timer className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">20-20-20 Breaks</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setBreaksTaken((b) => Math.max(0, b - 1))}
                  className="w-9 h-9 rounded-xl bg-surface-secondary border border-border flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="text-center">
                  <span className="text-2xl font-bold">{breaksTaken}</span>
                  <span className="text-text-secondary text-lg"> / {target}</span>
                  <p className="text-xs text-text-secondary mt-0.5">breaks taken today</p>
                </div>
                <button
                  onClick={() => setBreaksTaken((b) => b + 1)}
                  className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="w-full bg-border rounded-full h-2 mt-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (breaksTaken / Math.max(1, target)) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-text-secondary mt-1">
                {target > 0 ? `Target: 1 break every 20 min = ${target} today` : 'Enter screen time to see target'}
              </p>
            </div>

            {/* 20-20-20 Timer */}
            <TwentyTimer onBreakComplete={handleBreakComplete} />

            {/* Symptoms */}
            <div className="bg-surface border border-border rounded-2xl p-4">
              <p className="text-sm font-semibold mb-3">Symptoms Today</p>
              <div className="flex flex-wrap gap-2">
                {EYE_SYMPTOMS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggleSymptom(s.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors',
                      symptoms.includes(s.id)
                        ? 'bg-rose-500/10 border-rose-500/40 text-rose-600'
                        : 'bg-surface border-border text-text-secondary hover:border-border/60'
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Blink reminder */}
            <div
              className={cn(
                'bg-surface border rounded-2xl p-4 flex items-center gap-3 cursor-pointer',
                blinkReminder ? 'border-primary/40' : 'border-border'
              )}
              onClick={() => setBlinkReminder((v) => !v)}
            >
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center text-lg',
                blinkReminder ? 'bg-primary/10' : 'bg-surface-secondary'
              )}>
                👁️
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Blink Reminder Used</p>
                <p className="text-xs text-text-secondary">Blink rate drops 66% during screen use</p>
              </div>
              <div className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                blinkReminder ? 'border-primary bg-primary' : 'border-border'
              )}>
                {blinkReminder && <span className="text-white text-[10px]">✓</span>}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-surface border border-border rounded-2xl p-4">
              <p className="text-sm font-semibold mb-2">Notes</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How did your eyes feel today?"
                rows={2}
                className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-secondary resize-none outline-none"
              />
            </div>

            {/* Recommendations */}
            {liveScore.recommendations.length > 0 && (
              <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
                <p className="text-sm font-semibold">Recommendations</p>
                {liveScore.recommendations.map((r, i) => (
                  <div key={i} className="flex gap-2 text-xs text-text-secondary">
                    <span className="text-primary mt-0.5">→</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 bg-primary text-white rounded-2xl font-semibold text-sm disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save Today\'s Log'}
            </button>
          </>
        )}

        {/* ── EXERCISES TAB ── */}
        {tab === 'exercises' && (
          <>
            <div className="bg-surface border border-border rounded-2xl p-4">
              <p className="text-sm font-semibold">Vision Exercises</p>
              <p className="text-xs text-text-secondary mt-1">
                {doneExercises.length}/{VISION_EXERCISES.length} done today
              </p>
              <div className="w-full bg-border rounded-full h-1.5 mt-2">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${(doneExercises.length / VISION_EXERCISES.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              {VISION_EXERCISES.map((ex) => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  done={doneExercises.includes(ex.id)}
                  onDone={() => markExerciseDone(ex.id)}
                />
              ))}
            </div>
          </>
        )}

        {/* ── TRENDS TAB ── */}
        {tab === 'trends' && (
          <>
            {loading ? (
              <div className="text-center text-text-secondary py-16 text-sm">Loading…</div>
            ) : trend.length === 0 ? (
              <div className="text-center text-text-secondary py-16 text-sm">
                No data yet — log a few days to see trends.
              </div>
            ) : (
              <>
                {/* Annual exam reminder */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
                  <span className="text-2xl">🏥</span>
                  <div>
                    <p className="text-sm font-semibold text-amber-600">Annual Eye Exam Reminder</p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Regular comprehensive eye exams are recommended every 1–2 years. Schedule yours if it has been over a year.
                    </p>
                  </div>
                </div>

                {/* Screen time chart */}
                <div className="bg-surface border border-border rounded-2xl p-4">
                  <p className="text-sm font-semibold mb-3">Screen Time (hours)</p>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={trend} margin={{ left: -20, right: 4 }}>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ fontSize: 11, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                        formatter={(v: number) => [`${v}h`, 'Screen']}
                      />
                      <Bar dataKey="screen_hours" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Outdoor time chart */}
                <div className="bg-surface border border-border rounded-2xl p-4">
                  <p className="text-sm font-semibold mb-3">Outdoor Time (min)</p>
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={trend} margin={{ left: -20, right: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ fontSize: 11, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                        formatter={(v: number) => [`${v} min`, 'Outdoor']}
                      />
                      <Line dataKey="outdoor_minutes" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Break compliance chart */}
                <div className="bg-surface border border-border rounded-2xl p-4">
                  <p className="text-sm font-semibold mb-3">Break Compliance (%)</p>
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart
                      data={trend.map((d) => ({
                        ...d,
                        compliance: d.breaks_target > 0
                          ? Math.round((d.breaks_taken / d.breaks_target) * 100)
                          : 0,
                      }))}
                      margin={{ left: -20, right: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                      <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ fontSize: 11, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                        formatter={(v: number) => [`${v}%`, 'Compliance']}
                      />
                      <Line dataKey="compliance" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Symptom frequency */}
                {(() => {
                  const symCount: Record<string, number> = {}
                  logs.forEach((l) => {
                    ;(l.symptoms ?? []).forEach((s: string) => {
                      symCount[s] = (symCount[s] || 0) + 1
                    })
                  })
                  const symData = EYE_SYMPTOMS.map((s) => ({
                    name: s.label,
                    count: symCount[s.id] || 0,
                  })).filter((s) => s.count > 0)
                  if (!symData.length) return null
                  return (
                    <div className="bg-surface border border-border rounded-2xl p-4">
                      <p className="text-sm font-semibold mb-3">Symptom Frequency (last 30 days)</p>
                      <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={symData} layout="vertical" margin={{ left: 60, right: 4 }}>
                          <XAxis type="number" tick={{ fontSize: 10 }} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={55} />
                          <Tooltip
                            contentStyle={{ fontSize: 11, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                            formatter={(v: number) => [`${v} days`, 'Count']}
                          />
                          <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )
                })()}

                {/* Summary stats */}
                {score && (
                  <div className="bg-surface border border-border rounded-2xl p-4 grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{score.score}</p>
                      <p className="text-xs text-text-secondary">Eye Score</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-500">{score.break_compliance}%</p>
                      <p className="text-xs text-text-secondary">Break Compliance</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-amber-500">{score.outdoor_score}</p>
                      <p className="text-xs text-text-secondary">Outdoor Score /30</p>
                    </div>
                    <div className="text-center">
                      <p className={cn('text-2xl font-bold', score.trend_7d === 'improving' ? 'text-emerald-500' : score.trend_7d === 'worsening' ? 'text-rose-500' : 'text-text-secondary')}>
                        {score.trend_7d === 'improving' ? '↑' : score.trend_7d === 'worsening' ? '↓' : '→'}
                      </p>
                      <p className="text-xs text-text-secondary">7-day Trend</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
