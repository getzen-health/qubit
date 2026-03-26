'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Flame, Leaf, Star, Plus, Minus, Play, Pause, Square, ChevronRight } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts'
import { cn } from '@/lib/utils'
import {
  MEDITATION_TYPES, MBSR_CURRICULUM, MINDFULNESS_MILESTONES,
  DAILY_MINDFULNESS_MOMENTS, calculateAttentionScore,
  type MeditationSession, type MindfulnessAnalysis, type MeditationType,
} from '@/lib/mindfulness'
import { BottomNav } from '@/components/bottom-nav'

const TT_STYLE = {
  background: 'hsl(var(--surface))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  fontSize: 12,
  color: 'hsl(var(--text-primary))',
}

const DURATION_PRESETS = [5, 10, 15, 20, 30, 45, 60]

type Tab = 'meditate' | 'journey' | 'insights'
type Phase = 'pre' | 'select' | 'timer' | 'post' | 'done'

interface TimerState {
  running: boolean
  elapsed: number
  paused: boolean
}

function StatBadge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-3 py-2 bg-surface rounded-xl border border-border shrink-0">
      <div className="flex items-center gap-1 text-text-secondary text-xs">{icon}<span>{label}</span></div>
      <span className="text-lg font-bold text-text-primary">{value}</span>
    </div>
  )
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => onChange(n)} className="focus:outline-none">
          <Star className={cn('w-7 h-7 transition-colors', n <= value ? 'fill-amber-400 text-amber-400' : 'text-border')} />
        </button>
      ))}
    </div>
  )
}

function SliderInput({ label, value, onChange, min = 1, max = 10 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-text-secondary">{label}</span>
        <span className="font-semibold text-text-primary">{value}/10</span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-[var(--accent)]" />
      <div className="flex justify-between text-[10px] text-text-muted">
        <span>Low</span><span>High</span>
      </div>
    </div>
  )
}

function CounterInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-secondary">{label}</span>
      <div className="flex items-center gap-3">
        <button onClick={() => onChange(Math.max(0, value - 1))}
          className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-surface-secondary">
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-6 text-center font-semibold text-text-primary">{value}</span>
        <button onClick={() => onChange(value + 1)}
          className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-surface-secondary">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

function fmtSecs(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function MindfulnessClient() {
  const [tab, setTab] = useState<Tab>('meditate')
  const [sessions, setSessions] = useState<MeditationSession[]>([])
  const [analysis, setAnalysis] = useState<MindfulnessAnalysis | null>(null)
  const [loading, setLoading] = useState(true)

  const [phase, setPhase] = useState<Phase>('pre')
  const [moodBefore, setMoodBefore] = useState(5)
  const [stressBefore, setStressBefore] = useState(5)
  const [selectedType, setSelectedType] = useState<MeditationType>('breath')
  const [durationMin, setDurationMin] = useState(15)
  const [customDuration, setCustomDuration] = useState(false)
  const [timerState, setTimerState] = useState<TimerState>({ running: false, elapsed: 0, paused: false })
  const [moodAfter, setMoodAfter] = useState(5)
  const [stressAfter, setStressAfter] = useState(5)
  const [qualityRating, setQualityRating] = useState(3)
  const [distractions, setDistractions] = useState(0)
  const [insight, setInsight] = useState('')
  const [mbsrWeek, setMbsrWeek] = useState<number | undefined>()
  const [saving, setSaving] = useState(false)
  const [savedSession, setSavedSession] = useState<MeditationSession | null>(null)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const targetSecs = durationMin * 60

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/mindfulness')
      if (!res.ok) return
      const json = await res.json()
      setSessions(json.sessions ?? [])
      setAnalysis(json.analysis ?? null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (timerState.running && !timerState.paused) {
      timerRef.current = setInterval(() => {
        setTimerState(prev => {
          const next = prev.elapsed + 1
          if (next >= targetSecs) {
            clearInterval(timerRef.current!)
            return { running: false, elapsed: next, paused: false }
          }
          return { ...prev, elapsed: next }
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerState.running, timerState.paused, targetSecs])

  useEffect(() => {
    if (phase === 'timer' && !timerState.running && timerState.elapsed >= targetSecs && timerState.elapsed > 0) {
      setPhase('post')
    }
  }, [timerState, phase, targetSecs])

  const startTimer = () => setTimerState({ running: true, elapsed: 0, paused: false })
  const togglePause = () => setTimerState(prev => ({ ...prev, paused: !prev.paused }))
  const endTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimerState(prev => ({ ...prev, running: false }))
    setPhase('post')
  }

  const saveSession = async () => {
    setSaving(true)
    const actualDuration = Math.max(1, Math.round(timerState.elapsed / 60))
    try {
      const res = await fetch('/api/mindfulness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString().slice(0, 10),
          type: selectedType,
          duration_min: actualDuration,
          quality_rating: qualityRating,
          distractions,
          mood_before: moodBefore,
          mood_after: moodAfter,
          stress_before: stressBefore,
          stress_after: stressAfter,
          insight: insight.trim() || undefined,
          mbsr_week: mbsrWeek,
        }),
      })
      if (res.ok) {
        const json = await res.json()
        setSavedSession({ ...json.session, duration_min: actualDuration })
        setPhase('done')
        await fetchData()
      }
    } finally {
      setSaving(false)
    }
  }

  const resetFlow = () => {
    setPhase('pre')
    setMoodBefore(5); setStressBefore(5); setMoodAfter(5); setStressAfter(5)
    setQualityRating(3); setDistractions(0); setInsight(''); setMbsrWeek(undefined)
    setTimerState({ running: false, elapsed: 0, paused: false })
    setSavedSession(null)
  }

  const todayMoment = DAILY_MINDFULNESS_MOMENTS[new Date().getDay() % DAILY_MINDFULNESS_MOMENTS.length]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-surface-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Leaf className="w-5 h-5 text-green-500" />
              Mindfulness
            </h1>
          </div>
          {analysis && (
            <div className="flex items-center gap-1 text-sm font-medium text-amber-500">
              <Flame className="w-4 h-4" /><span>{analysis.currentStreak}d</span>
            </div>
          )}
        </div>
        <div className="max-w-2xl mx-auto px-4 flex border-t border-border">
          {(['meditate', 'journey', 'insights'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('flex-1 py-2.5 text-sm font-medium capitalize transition-colors border-b-2',
                tab === t ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-text-secondary hover:text-text-primary')}>
              {t}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-6">

        {/* ══════════════════════ TAB: MEDITATE ══════════════════════ */}
        {tab === 'meditate' && (
          <>
            {analysis && (
              <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                <StatBadge icon={<Flame className="w-3 h-3 text-amber-500" />} label="streak" value={`${analysis.currentStreak}d`} />
                <StatBadge icon={<span className="text-xs">⏱</span>} label="this week" value={`${analysis.weeklyMinutes}m`} />
                <StatBadge icon={<span className="text-xs">🧘</span>} label="all-time" value={`${analysis.totalMinutesAllTime}m`} />
                <StatBadge icon={<span className="text-xs">🎯</span>} label="attention" value={`${analysis.attentionScore}/100`} />
              </div>
            )}

            <div className="bg-gradient-to-r from-green-500/10 to-teal-500/10 border border-green-500/20 rounded-2xl p-4">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">
                Today&apos;s Mindful Moment · {todayMoment.duration_min} min
              </p>
              <p className="font-semibold text-text-primary">{todayMoment.title}</p>
              <p className="text-sm text-text-secondary mt-1">{todayMoment.instruction}</p>
            </div>

            {phase === 'pre' && (
              <div className="bg-surface border border-border rounded-2xl p-5 space-y-5">
                <p className="font-semibold text-text-primary">Before you begin</p>
                <SliderInput label="Mood" value={moodBefore} onChange={setMoodBefore} />
                <SliderInput label="Stress level" value={stressBefore} onChange={setStressBefore} />
                <button onClick={() => setPhase('select')}
                  className="w-full py-3 rounded-xl bg-[var(--accent)] text-white font-semibold hover:opacity-90 transition-opacity">
                  Continue →
                </button>
              </div>
            )}

            {phase === 'select' && (
              <div className="space-y-4">
                <div className="bg-surface border border-border rounded-2xl p-4">
                  <p className="font-semibold text-text-primary mb-3">Choose a practice</p>
                  <div className="grid grid-cols-2 gap-2">
                    {MEDITATION_TYPES.filter(t => t.id !== 'other').map(t => (
                      <button key={t.id} onClick={() => setSelectedType(t.id)}
                        className={cn('p-3 rounded-xl border text-left transition-all',
                          selectedType === t.id ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-border bg-surface hover:bg-surface-secondary')}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{t.icon}</span>
                          {t.beginner && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-600">BEGINNER</span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-text-primary leading-tight">{t.label}</p>
                        <p className="text-[10px] text-text-secondary mt-0.5">{t.tradition}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
                  <p className="font-semibold text-text-primary">Duration</p>
                  <div className="flex flex-wrap gap-2">
                    {DURATION_PRESETS.map(d => (
                      <button key={d} onClick={() => { setDurationMin(d); setCustomDuration(false) }}
                        className={cn('px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                          durationMin === d && !customDuration
                            ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                            : 'border-border text-text-secondary hover:border-[var(--accent)]/50')}>
                        {d}m
                      </button>
                    ))}
                    <button onClick={() => setCustomDuration(true)}
                      className={cn('px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                        customDuration ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]' : 'border-border text-text-secondary')}>
                      Custom
                    </button>
                  </div>
                  {customDuration && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Duration</span>
                        <span className="font-semibold text-text-primary">{durationMin} min</span>
                      </div>
                      <input type="range" min={1} max={120} value={durationMin}
                        onChange={e => setDurationMin(Number(e.target.value))}
                        className="w-full accent-[var(--accent)]" />
                    </div>
                  )}
                </div>

                <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
                  <p className="font-semibold text-text-primary">MBSR Programme <span className="text-text-muted font-normal text-sm">(optional)</span></p>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setMbsrWeek(undefined)}
                      className={cn('px-3 py-1.5 rounded-full text-sm font-medium border',
                        !mbsrWeek ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]' : 'border-border text-text-secondary')}>
                      None
                    </button>
                    {MBSR_CURRICULUM.map(w => (
                      <button key={w.week} onClick={() => setMbsrWeek(w.week)}
                        className={cn('px-3 py-1.5 rounded-full text-sm font-medium border',
                          mbsrWeek === w.week ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]' : 'border-border text-text-secondary')}>
                        Wk {w.week}
                      </button>
                    ))}
                  </div>
                  {mbsrWeek && (
                    <p className="text-xs text-text-secondary bg-surface-secondary rounded-lg p-2">
                      <span className="font-medium text-text-primary">{MBSR_CURRICULUM[mbsrWeek - 1].theme}</span>
                      {' — '}{MBSR_CURRICULUM[mbsrWeek - 1].practice}
                    </p>
                  )}
                </div>

                <button onClick={() => { setPhase('timer'); startTimer() }}
                  className="w-full py-3 rounded-xl bg-[var(--accent)] text-white font-semibold hover:opacity-90 flex items-center justify-center gap-2">
                  <Play className="w-4 h-4" /> Begin {durationMin}-min session
                </button>
                <button onClick={() => setPhase('pre')} className="w-full text-center text-sm text-text-secondary hover:text-text-primary">
                  ← Back
                </button>
              </div>
            )}

            {phase === 'timer' && (
              <div className="flex flex-col items-center justify-center py-10 gap-8">
                <div className="text-center">
                  <p className="text-text-secondary text-sm mb-4">
                    {MEDITATION_TYPES.find(t => t.id === selectedType)?.icon}{' '}
                    {MEDITATION_TYPES.find(t => t.id === selectedType)?.label}
                  </p>
                  <div className={cn('relative inline-flex items-center justify-center w-48 h-48 rounded-full border-4 border-[var(--accent)]/30',
                    timerState.running && !timerState.paused && 'animate-pulse')}>
                    <div className="absolute inset-3 rounded-full bg-[var(--accent)]/5" />
                    <div className="text-center relative">
                      <p className="text-4xl font-mono font-bold text-text-primary">
                        {fmtSecs(Math.max(0, targetSecs - timerState.elapsed))}
                      </p>
                      <p className="text-xs text-text-secondary mt-1">remaining</p>
                    </div>
                  </div>
                  <p className="text-xs text-text-muted mt-3">elapsed: {fmtSecs(timerState.elapsed)}</p>
                </div>
                <div className="w-full max-w-xs bg-surface-secondary rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-[var(--accent)] transition-all"
                    style={{ width: `${Math.min(100, (timerState.elapsed / targetSecs) * 100)}%` }} />
                </div>
                <div className="flex gap-4">
                  <button onClick={togglePause}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-surface hover:bg-surface-secondary font-medium text-text-primary">
                    {timerState.paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    {timerState.paused ? 'Resume' : 'Pause'}
                  </button>
                  <button onClick={endTimer}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-surface hover:bg-surface-secondary font-medium text-text-primary">
                    <Square className="w-4 h-4" /> End
                  </button>
                </div>
              </div>
            )}

            {phase === 'post' && (
              <div className="bg-surface border border-border rounded-2xl p-5 space-y-5">
                <p className="font-semibold text-text-primary">
                  How was your session? ({fmtSecs(timerState.elapsed)} completed)
                </p>
                <SliderInput label="Mood now" value={moodAfter} onChange={setMoodAfter} />
                {moodAfter !== moodBefore && (
                  <p className={cn('text-xs font-medium', moodAfter > moodBefore ? 'text-green-500' : 'text-red-400')}>
                    Mood shift: {moodAfter > moodBefore ? '+' : ''}{moodAfter - moodBefore} point{Math.abs(moodAfter - moodBefore) !== 1 ? 's' : ''}
                  </p>
                )}
                <SliderInput label="Stress now" value={stressAfter} onChange={setStressAfter} />
                {stressAfter !== stressBefore && (
                  <p className={cn('text-xs font-medium', stressAfter < stressBefore ? 'text-green-500' : 'text-amber-500')}>
                    Stress {stressAfter < stressBefore ? 'reduced' : 'increased'} by {Math.abs(stressAfter - stressBefore)} point{Math.abs(stressAfter - stressBefore) !== 1 ? 's' : ''}
                  </p>
                )}
                <div className="space-y-1.5">
                  <p className="text-sm text-text-secondary">Session quality</p>
                  <StarRating value={qualityRating} onChange={setQualityRating} />
                </div>
                <CounterInput label="Mind wandered (times)" value={distractions} onChange={setDistractions} />
                <div className="space-y-1.5">
                  <label className="text-sm text-text-secondary">
                    Insight or note <span className="text-text-muted">(optional)</span>
                  </label>
                  <textarea value={insight} onChange={e => setInsight(e.target.value)}
                    placeholder="Any realisation, feeling, or thought worth capturing…"
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border text-text-primary text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
                </div>
                {(() => {
                  const score = calculateAttentionScore({
                    date: '', type: selectedType,
                    duration_min: Math.max(1, Math.round(timerState.elapsed / 60)),
                    quality_rating: qualityRating, distractions,
                    mood_before: moodBefore, mood_after: moodAfter,
                    stress_before: stressBefore, stress_after: stressAfter,
                  })
                  return (
                    <div className="flex items-center gap-3 p-3 bg-surface-secondary rounded-xl">
                      <span className="text-2xl font-bold text-[var(--accent)]">{score}</span>
                      <div>
                        <p className="text-xs font-semibold text-text-primary">Attention Quality Score</p>
                        <p className="text-[10px] text-text-secondary">Duration · distractions · quality</p>
                      </div>
                    </div>
                  )
                })()}
                <button onClick={saveSession} disabled={saving}
                  className="w-full py-3 rounded-xl bg-[var(--accent)] text-white font-semibold hover:opacity-90 disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save Session'}
                </button>
              </div>
            )}

            {phase === 'done' && savedSession && (
              <div className="bg-surface border border-border rounded-2xl p-6 text-center space-y-4">
                <div className="text-5xl">🧘</div>
                <p className="text-xl font-bold text-text-primary">Well done!</p>
                <p className="text-text-secondary text-sm">
                  {savedSession.duration_min} min of {MEDITATION_TYPES.find(t => t.id === savedSession.type)?.label}
                  {analysis && ` · ${analysis.currentStreak}d streak`}
                </p>
                {savedSession.mood_after != null && savedSession.mood_before != null && (
                  <div className="flex justify-center gap-6 py-2">
                    <div>
                      <p className="text-xs text-text-secondary">Mood shift</p>
                      <p className={cn('font-bold', savedSession.mood_after >= savedSession.mood_before ? 'text-green-500' : 'text-red-400')}>
                        {savedSession.mood_after >= savedSession.mood_before ? '+' : ''}{savedSession.mood_after - savedSession.mood_before}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary">Stress shift</p>
                      <p className={cn('font-bold', (savedSession.stress_after ?? 0) <= (savedSession.stress_before ?? 0) ? 'text-green-500' : 'text-amber-500')}>
                        {(savedSession.stress_after ?? 0) <= (savedSession.stress_before ?? 0) ? '-' : '+'}{Math.abs((savedSession.stress_after ?? 0) - (savedSession.stress_before ?? 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary">Attention</p>
                      <p className="font-bold text-[var(--accent)]">{calculateAttentionScore(savedSession)}</p>
                    </div>
                  </div>
                )}
                <button onClick={resetFlow}
                  className="w-full py-3 rounded-xl bg-[var(--accent)] text-white font-semibold hover:opacity-90">
                  Meditate Again
                </button>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════ TAB: JOURNEY ══════════════════════ */}
        {tab === 'journey' && (
          <>
            {loading ? (
              <div className="text-center py-20 text-text-secondary">Loading…</div>
            ) : !analysis ? (
              <div className="text-center py-20">
                <p className="text-4xl mb-3">🌱</p>
                <p className="text-text-secondary">Start meditating to build your journey.</p>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-r from-[var(--accent)]/10 to-teal-500/10 border border-[var(--accent)]/20 rounded-2xl p-5 text-center">
                  <p className="text-5xl font-black text-text-primary">{analysis.totalMinutesAllTime}</p>
                  <p className="text-text-secondary text-sm mt-1">lifetime minutes meditated</p>
                  <p className="text-xs text-text-muted mt-0.5">≈ {(analysis.totalMinutesAllTime / 60).toFixed(1)} hours</p>
                </div>

                {/* Milestone timeline */}
                <div className="bg-surface border border-border rounded-2xl p-4">
                  <p className="font-semibold text-text-primary mb-4">Lifetime Milestones</p>
                  <div className="relative">
                    <div className="absolute top-4 left-4 right-4 h-0.5 bg-border" />
                    <div className="flex justify-between relative">
                      {analysis.milestones.map((m, i) => (
                        <div key={i} className="flex flex-col items-center gap-1.5 w-1/5">
                          <div className={cn('w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm z-10 bg-background',
                            m.achieved ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-border')}>
                            {m.achieved ? '✓' : '○'}
                          </div>
                          <p className="text-[9px] font-semibold text-center text-text-secondary leading-tight">{m.label}</p>
                          <p className="text-[9px] text-text-muted text-center">{m.minutes}m</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {analysis.milestones.filter(m => !m.achieved)[0] && (
                    <p className="text-xs text-text-secondary mt-4 text-center">
                      Next: <span className="font-medium text-text-primary">{analysis.milestones.filter(m => !m.achieved)[0].label}</span>
                      {' '}— {analysis.milestones.filter(m => !m.achieved)[0].minutes - analysis.totalMinutesAllTime} min to go
                    </p>
                  )}
                </div>

                {/* MBSR 8-week tracker */}
                <div className="bg-surface border border-border rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-text-primary">MBSR 8-Week Programme</p>
                    {analysis.mbsrProgress && (
                      <span className="text-xs font-medium bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded-full">
                        Week {analysis.mbsrProgress.currentWeek}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {MBSR_CURRICULUM.map(w => {
                      const completed = analysis.mbsrProgress ? w.week <= analysis.mbsrProgress.currentWeek : false
                      const isCurrent = analysis.mbsrProgress?.currentWeek === w.week
                      return (
                        <div key={w.week} className={cn('flex gap-3 p-2.5 rounded-xl border transition-colors',
                          isCurrent ? 'border-[var(--accent)]/30 bg-[var(--accent)]/5'
                            : completed ? 'border-green-500/20 bg-green-500/5' : 'border-border')}>
                          <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5',
                            completed ? 'bg-green-500 text-white' : 'bg-surface-secondary text-text-muted')}>
                            {completed ? '✓' : w.week}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-primary">{w.theme}</p>
                            <p className="text-xs text-text-secondary">{w.practice}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {!analysis.mbsrProgress && (
                    <p className="text-xs text-text-secondary mt-3 text-center">
                      Select an MBSR week when logging sessions to track your programme.
                    </p>
                  )}
                </div>

                {/* Practice type donut */}
                {sessions.length > 0 && (() => {
                  const typeCounts: Record<string, number> = {}
                  for (const s of sessions) typeCounts[s.type] = (typeCounts[s.type] || 0) + 1
                  const pieData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }))
                  const COLORS = ['#8b5cf6','#06b6d4','#f59e0b','#10b981','#ef4444','#ec4899','#6366f1','#84cc16']
                  return (
                    <div className="bg-surface border border-border rounded-2xl p-4">
                      <p className="font-semibold text-text-primary mb-3">Practice Breakdown</p>
                      <div className="flex items-center gap-4">
                        <PieChart width={120} height={120}>
                          <Pie data={pieData} cx={55} cy={55} innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={2}>
                            {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                        </PieChart>
                        <div className="flex-1 space-y-1.5">
                          {pieData.map((d, i) => (
                            <div key={d.name} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                                <span className="text-text-secondary capitalize">{d.name.replace(/_/g, ' ')}</span>
                              </div>
                              <span className="font-medium text-text-primary">{d.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Attention quality bar chart */}
                {sessions.length > 1 && (() => {
                  const chartData = sessions.slice(0, 14).reverse().map((s, i) => ({
                    i: i + 1, score: calculateAttentionScore(s),
                  }))
                  return (
                    <div className="bg-surface border border-border rounded-2xl p-4">
                      <p className="font-semibold text-text-primary mb-3">Attention Quality (last 14)</p>
                      <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="i" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={TT_STYLE} formatter={(v: number) => [`${v}`, 'Score']} />
                          <Bar dataKey="score" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )
                })()}

                {/* Research card */}
                <div className="bg-surface border border-border rounded-2xl p-4 space-y-3">
                  <p className="font-semibold text-text-primary">🧠 What the research says</p>
                  {[
                    { hours: 10, label: 'Neurological benefits begin', cite: 'Zeidan et al. 2010', detail: '4 days × 20 min improves working memory & executive function' },
                    { hours: 20, label: 'Gray matter changes possible', cite: 'Hölzel et al. 2011', detail: '8 weeks MBSR increases gray matter in hippocampus and PFC' },
                    { hours: 50, label: 'Sustained attention transformation', cite: 'Tang et al. 2015', detail: 'Increased ACC and striatum activity, reduced mind-wandering' },
                  ].map(b => {
                    const achieved = analysis.totalMinutesAllTime >= b.hours * 60
                    return (
                      <div key={b.hours} className={cn('flex gap-3 p-2.5 rounded-xl border',
                        achieved ? 'border-green-500/20 bg-green-500/5' : 'border-border')}>
                        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                          achieved ? 'bg-green-500 text-white' : 'bg-surface-secondary text-text-muted')}>
                          {b.hours}h
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">{b.label}</p>
                          <p className="text-xs text-text-secondary">{b.detail}</p>
                          <p className="text-[10px] text-text-muted mt-0.5 italic">{b.cite}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Recommendations */}
                {analysis.recommendations.length > 0 && (
                  <div className="bg-surface border border-border rounded-2xl p-4 space-y-2">
                    <p className="font-semibold text-text-primary">Recommendations</p>
                    {analysis.recommendations.map((r, i) => (
                      <div key={i} className="flex gap-2 text-sm text-text-secondary">
                        <ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-[var(--accent)]" />
                        <p>{r}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ══════════════════════ TAB: INSIGHTS ══════════════════════ */}
        {tab === 'insights' && (
          <>
            {loading ? (
              <div className="text-center py-20 text-text-secondary">Loading…</div>
            ) : sessions.length < 2 ? (
              <div className="text-center py-20">
                <p className="text-4xl mb-3">📊</p>
                <p className="text-text-secondary">Log at least 2 sessions to see insights.</p>
              </div>
            ) : (
              <>
                {/* Mood shift line chart */}
                {(() => {
                  const data = sessions.slice(0, 30).reverse()
                    .filter(s => s.mood_before != null && s.mood_after != null)
                    .map(s => ({ date: s.date.slice(5), before: s.mood_before, after: s.mood_after }))
                  if (!data.length) return null
                  return (
                    <div className="bg-surface border border-border rounded-2xl p-4">
                      <p className="font-semibold text-text-primary mb-1">Mood Shift per Session</p>
                      <p className="text-xs text-text-secondary mb-3">Before (blue) vs After (green)</p>
                      <ResponsiveContainer width="100%" height={150}>
                        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                          <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={TT_STYLE} />
                          <Line type="monotone" dataKey="before" stroke="#60a5fa" dot={false} name="Before" />
                          <Line type="monotone" dataKey="after" stroke="#34d399" dot={false} name="After" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )
                })()}

                {/* Stress reduction bar chart */}
                {(() => {
                  const data = sessions.slice(0, 30).reverse()
                    .filter(s => s.stress_before != null && s.stress_after != null)
                    .map(s => ({ date: s.date.slice(5), reduction: (s.stress_before ?? 0) - (s.stress_after ?? 0) }))
                  if (!data.length) return null
                  return (
                    <div className="bg-surface border border-border rounded-2xl p-4">
                      <p className="font-semibold text-text-primary mb-1">Stress Reduction per Session</p>
                      <p className="text-xs text-text-secondary mb-3">Positive = stress went down</p>
                      <ResponsiveContainer width="100%" height={130}>
                        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={TT_STYLE} formatter={(v: number) => [`${v > 0 ? '+' : ''}${v}`, 'Δ Stress']} />
                          <Bar dataKey="reduction" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )
                })()}

                {/* 12-week heatmap */}
                {(() => {
                  const dateSet = new Set(sessions.map(s => s.date))
                  const today = new Date()
                  const cells: { date: string; active: boolean }[] = []
                  for (let i = 83; i >= 0; i--) {
                    const d = new Date(today); d.setDate(d.getDate() - i)
                    cells.push({ date: d.toISOString().slice(0, 10), active: dateSet.has(d.toISOString().slice(0, 10)) })
                  }
                  const weeks: typeof cells[] = []
                  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
                  return (
                    <div className="bg-surface border border-border rounded-2xl p-4">
                      <p className="font-semibold text-text-primary mb-3">Session Frequency (12 weeks)</p>
                      <div className="flex gap-1">
                        {weeks.map((week, wi) => (
                          <div key={wi} className="flex flex-col gap-1">
                            {week.map((d, di) => (
                              <div key={di} title={d.date}
                                className={cn('w-3 h-3 rounded-sm', d.active ? 'bg-[var(--accent)]' : 'bg-surface-secondary')} />
                            ))}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-3 h-3 rounded-sm bg-surface-secondary" /><span className="text-[10px] text-text-muted mr-2">None</span>
                        <div className="w-3 h-3 rounded-sm bg-[var(--accent)]" /><span className="text-[10px] text-text-muted">Meditated</span>
                      </div>
                    </div>
                  )
                })()}

                {/* Best day + longest streak */}
                {analysis && (() => {
                  const dayCount: Record<number, { total: number; quality: number }> = {}
                  for (const s of sessions) {
                    const day = new Date(s.date).getDay()
                    if (!dayCount[day]) dayCount[day] = { total: 0, quality: 0 }
                    dayCount[day].total++
                    dayCount[day].quality += s.quality_rating
                  }
                  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                  const bestDay = Object.entries(dayCount)
                    .sort((a, b) => (b[1].quality / b[1].total) - (a[1].quality / a[1].total))[0]
                  return (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-surface border border-border rounded-2xl p-3 text-center">
                        <p className="text-2xl font-black text-[var(--accent)]">{bestDay ? dayNames[+bestDay[0]] : '—'}</p>
                        <p className="text-xs text-text-secondary mt-0.5">Best day (quality)</p>
                      </div>
                      <div className="bg-surface border border-border rounded-2xl p-3 text-center">
                        <p className="text-2xl font-black text-text-primary">{analysis.longestStreak}d</p>
                        <p className="text-xs text-text-secondary mt-0.5">Longest streak</p>
                      </div>
                    </div>
                  )
                })()}

                {/* Duration trend */}
                {(() => {
                  const last20 = sessions.slice(0, 20).reverse()
                  if (last20.length < 3) return null
                  const data = last20.map((s, i) => ({ i: i + 1, dur: s.duration_min }))
                  return (
                    <div className="bg-surface border border-border rounded-2xl p-4">
                      <p className="font-semibold text-text-primary mb-3">Duration Trend (last 20)</p>
                      <ResponsiveContainer width="100%" height={120}>
                        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="i" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={TT_STYLE} formatter={(v: number) => [`${v} min`, 'Duration']} />
                          <Line type="monotone" dataKey="dur" stroke="var(--accent)" dot={false} strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )
                })()}

                {/* Summary */}
                {analysis && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface border border-border rounded-2xl p-3 text-center">
                      <p className="text-xl font-black text-green-500">
                        {analysis.avgMoodShift >= 0 ? '+' : ''}{analysis.avgMoodShift.toFixed(1)}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">Avg mood shift</p>
                    </div>
                    <div className="bg-surface border border-border rounded-2xl p-3 text-center">
                      <p className="text-xl font-black text-blue-500">
                        -{Math.abs(analysis.avgStressReduction).toFixed(1)}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">Avg stress reduction</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
