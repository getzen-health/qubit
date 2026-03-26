'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  ReferenceArea, BarChart, Bar, Cell, Legend,
} from 'recharts'
import { Wind, Play, Pause, Square, ChevronLeft, BookOpen, TrendingUp, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  BREATHING_EXERCISES,
  SYMPTOMS_LIST,
  MRC_DESCRIPTIONS,
  analyzeBreathing,
  predictPeakFlow,
  getBreathingRateZone,
  type BreathingLog,
  type BreathingSession,
  type BreathingAnalysis,
  type BreathingExercise,
} from '@/lib/breathing-health'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ApiData {
  logs: BreathingLog[]
  analysis: BreathingAnalysis | null
  trend: TrendPoint[]
}

interface TrendPoint {
  date: string
  rate: number
  mrc: number
  pattern: string
  sessionsCount: number
  peak_flow: number | null
  avgStressBefore: number | null
  avgStressAfter: number | null
}

type TabId = 'assess' | 'practice' | 'trends'
type GuideState = 'idle' | 'stress-before' | 'active' | 'paused' | 'complete'

// ─── Difficulty Badge ─────────────────────────────────────────────────────────
function DiffBadge({ level }: { level: BreathingExercise['difficulty'] }) {
  const styles = {
    beginner: 'bg-emerald-100 text-emerald-700',
    intermediate: 'bg-amber-100 text-amber-700',
    advanced: 'bg-rose-100 text-rose-700',
  }
  return (
    <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', styles[level])}>
      {level}
    </span>
  )
}

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, color }: { score: number; color: string }) {
  const size = 100
  const r = 40
  const circ = 2 * Math.PI * r
  const fill = (Math.min(score, 100) / 100) * circ
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={8} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-text-primary">{score}</span>
        <span className="text-[10px] text-text-secondary">/100</span>
      </span>
    </div>
  )
}

// ─── Animated Breathing Guide ─────────────────────────────────────────────────
function BreathingGuide({
  exercise,
  onClose,
  onSave,
}: {
  exercise: BreathingExercise
  onClose: () => void
  onSave: (session: BreathingSession) => void
}) {
  const [guideState, setGuideState] = useState<GuideState>('stress-before')
  const [stressBefore, setStressBefore] = useState(5)
  const [stressAfter, setStressAfter] = useState(5)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [round, setRound] = useState(1)
  const [phaseProgress, setPhaseProgress] = useState(0) // 0-1
  const [elapsedMin, setElapsedMin] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tickRef = useRef(0)
  const startTimeRef = useRef(0)

  const phase = exercise.phases[phaseIdx]
  const isInhale = phase.label.toLowerCase().includes('inhale') || phase.label.toLowerCase().includes('in')
  const isHold = phase.label.toLowerCase().includes('hold')
  const circleScale = isHold ? (phaseIdx < exercise.phases.length / 2 ? 1 : 0.5) : isInhale ? 0.5 + 0.5 * phaseProgress : 1 - 0.5 * phaseProgress

  const tick = useCallback(() => {
    tickRef.current += 0.1
    const phaseDur = exercise.phases[phaseIdx]?.duration ?? 4
    const progress = Math.min(tickRef.current / phaseDur, 1)
    setPhaseProgress(progress)
    setElapsedMin(prev => prev + 0.1 / 60)

    if (tickRef.current >= phaseDur) {
      tickRef.current = 0
      setPhaseProgress(0)
      const nextPhase = (phaseIdx + 1) % exercise.phases.length
      if (nextPhase === 0) {
        // completed a round
        setRound(prev => {
          if (prev >= exercise.rounds) {
            setGuideState('complete')
            if (intervalRef.current) clearInterval(intervalRef.current)
            return prev
          }
          return prev + 1
        })
      }
      setPhaseIdx(nextPhase)
    }
  }, [exercise, phaseIdx])

  useEffect(() => {
    if (guideState !== 'active') {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(tick, 100)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [guideState, tick])

  const startSession = (sb: number) => {
    setStressBefore(sb)
    setPhaseIdx(0)
    setRound(1)
    setPhaseProgress(0)
    tickRef.current = 0
    startTimeRef.current = Date.now()
    setGuideState('active')
  }

  const handleSave = (sa: number) => {
    const durationMin = Math.round(elapsedMin * 10) / 10
    onSave({
      exercise_id: exercise.id,
      duration_min: durationMin,
      rounds_completed: round,
      stress_before: stressBefore,
      stress_after: sa,
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe pt-6 pb-4 border-b border-border">
        <button onClick={onClose} className="flex items-center gap-1 text-text-secondary">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">Exit</span>
        </button>
        <span className="font-semibold text-text-primary text-sm">{exercise.emoji} {exercise.name}</span>
        <span className="text-sm text-text-secondary">{exercise.pattern}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Stress before */}
        {guideState === 'stress-before' && (
          <div className="w-full max-w-sm text-center">
            <div className="text-4xl mb-4">{exercise.emoji}</div>
            <h2 className="text-xl font-bold text-text-primary mb-2">{exercise.name}</h2>
            <p className="text-sm text-text-secondary mb-6">{exercise.description}</p>
            {exercise.caution && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-xs text-amber-800">
                ⚠️ {exercise.caution}
              </div>
            )}
            <p className="text-sm font-medium text-text-primary mb-3">Stress level before? (1=calm, 10=stressed)</p>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <button
                  key={n}
                  onClick={() => startSession(n)}
                  className={cn(
                    'w-11 h-11 rounded-xl border text-sm font-semibold transition-all',
                    'hover:bg-primary hover:text-white hover:border-primary border-border'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            <button onClick={() => startSession(5)} className="text-sm text-text-secondary underline">
              Skip rating
            </button>
          </div>
        )}

        {/* Active / Paused */}
        {(guideState === 'active' || guideState === 'paused') && (
          <div className="flex flex-col items-center gap-6 w-full max-w-sm">
            {/* Animated circle */}
            <div
              className="rounded-full flex items-center justify-center transition-transform duration-300"
              style={{
                width: 220,
                height: 220,
                background: `radial-gradient(circle, ${phase.color}33 0%, ${phase.color}11 70%)`,
                border: `3px solid ${phase.color}66`,
                transform: `scale(${circleScale})`,
                transition: 'transform 0.1s linear, background 0.5s ease',
              }}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-text-primary mb-1">{phase.label}</div>
                <div className="text-4xl font-mono text-text-primary">
                  {Math.ceil(phase.duration - tickRef.current)}s
                </div>
              </div>
            </div>

            {/* Phase progress bar */}
            <div className="w-full bg-border/50 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-100"
                style={{ width: `${phaseProgress * 100}%`, background: phase.color }}
              />
            </div>

            {/* Phase dots */}
            <div className="flex gap-2">
              {exercise.phases.map((p, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full transition-all"
                  style={{ background: i === phaseIdx ? p.color : 'var(--border)', transform: i === phaseIdx ? 'scale(1.4)' : 'scale(1)' }}
                />
              ))}
            </div>

            <p className="text-sm text-text-secondary">
              Round <span className="font-semibold text-text-primary">{round}</span> of {exercise.rounds}
            </p>

            {/* Overall progress */}
            <div className="w-full bg-border/50 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-primary transition-all"
                style={{ width: `${((round - 1) / exercise.rounds) * 100}%` }}
              />
            </div>

            {/* Controls */}
            <div className="flex gap-4">
              <button
                onClick={() => setGuideState(g => g === 'active' ? 'paused' : 'active')}
                className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-border rounded-xl text-sm font-medium text-text-primary"
              >
                {guideState === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {guideState === 'active' ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={() => setGuideState('complete')}
                className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-border rounded-xl text-sm font-medium text-rose-600"
              >
                <Square className="w-4 h-4" />
                End
              </button>
            </div>
          </div>
        )}

        {/* Complete */}
        {guideState === 'complete' && (
          <div className="w-full max-w-sm text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-xl font-bold text-text-primary mb-1">Session Complete!</h2>
            <p className="text-sm text-text-secondary mb-6">
              {round} rounds · {Math.round(elapsedMin * 10) / 10} min
            </p>
            <p className="text-sm font-medium text-text-primary mb-3">Stress level now? (1=calm, 10=stressed)</p>
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <button
                  key={n}
                  onClick={() => handleSave(n)}
                  className="w-11 h-11 rounded-xl border border-border text-sm font-semibold hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all"
                >
                  {n}
                </button>
              ))}
            </div>
            <button onClick={() => handleSave(stressBefore)} className="text-sm text-text-secondary underline">
              Skip rating
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Client ──────────────────────────────────────────────────────────────
const DEFAULT_FORM: Omit<BreathingLog, 'id' | 'user_id' | 'created_at'> = {
  date: new Date().toISOString().slice(0, 10),
  resting_breathing_rate: 14,
  breathing_pattern: 'nasal',
  breathing_type: 'diaphragmatic',
  mrc_scale: 0,
  symptoms: [],
  exercises_completed: [],
  peak_flow_measured: undefined,
  height_cm: undefined,
  age: undefined,
  sex: undefined,
  notes: '',
}

export function BreathingClient() {
  const [tab, setTab] = useState<TabId>('assess')
  const [form, setForm] = useState(DEFAULT_FORM)
  const [data, setData] = useState<ApiData | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeGuide, setActiveGuide] = useState<BreathingExercise | null>(null)
  const [isCounting, setIsCounting] = useState(false)
  const [countDown, setCountDown] = useState(60)
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch('/api/breathing')
      .then(r => r.json())
      .then((d: ApiData) => {
        setData(d)
        // Pre-fill form with today's log if exists
        if (d.logs.length > 0) {
          const todayStr = new Date().toISOString().slice(0, 10)
          const todayLog = d.logs.find(l => l.date === todayStr)
          if (todayLog) setForm({ ...DEFAULT_FORM, ...todayLog })
        }
      })
      .catch(() => {})
  }, [])

  const rateZone = getBreathingRateZone(form.resting_breathing_rate)
  const localAnalysis = analyzeBreathing({ ...form, exercises_completed: form.exercises_completed ?? [] })

  // Predicted peak flow
  const predictedPF = form.height_cm && form.age && form.sex
    ? Math.round(predictPeakFlow(form.height_cm, form.age, form.sex))
    : null
  const pfPct = predictedPF && form.peak_flow_measured
    ? Math.round((form.peak_flow_measured / predictedPF) * 100)
    : null

  // 60s breath counter
  const startCounting = () => {
    setIsCounting(true)
    setCountDown(60)
    let n = 60
    countRef.current = setInterval(() => {
      n -= 1
      setCountDown(n)
      if (n <= 0) {
        if (countRef.current) clearInterval(countRef.current)
        setIsCounting(false)
      }
    }, 1000)
  }
  useEffect(() => () => { if (countRef.current) clearInterval(countRef.current) }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch('/api/breathing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      const res = await fetch('/api/breathing')
      setData(await res.json())
    } finally {
      setSaving(false)
    }
  }

  const handleGuideComplete = async (session: BreathingSession) => {
    const newSessions = [...(form.exercises_completed ?? []), session]
    const updatedForm = { ...form, exercises_completed: newSessions }
    setForm(updatedForm)
    setActiveGuide(null)
    // Auto-save
    await fetch('/api/breathing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedForm),
    })
    const res = await fetch('/api/breathing')
    setData(await res.json())
  }

  const toggleSymptom = (id: string) => {
    setForm(f => ({
      ...f,
      symptoms: f.symptoms.includes(id)
        ? f.symptoms.filter(s => s !== id)
        : [...f.symptoms, id],
    }))
  }

  // ─── Tabs ────────────────────────────────────────────────────────────────────
  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'assess', label: 'Assess', icon: <Activity className="w-4 h-4" /> },
    { id: 'practice', label: 'Practice', icon: <Wind className="w-4 h-4" /> },
    { id: 'trends', label: 'Trends', icon: <TrendingUp className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen bg-surface pb-32">
      {activeGuide && (
        <BreathingGuide
          exercise={activeGuide}
          onClose={() => setActiveGuide(null)}
          onSave={handleGuideComplete}
        />
      )}

      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center">
            <Wind className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Breathing</h1>
            <p className="text-xs text-text-secondary">Respiratory health & guided exercises</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex bg-white border border-border rounded-2xl p-1 mb-5">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all',
                tab === t.id
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab 1: Assess ─────────────────────────────────────────────────── */}
        {tab === 'assess' && (
          <div className="space-y-4">
            {/* Quality score */}
            <div className="bg-white border border-border rounded-2xl p-4 flex items-center gap-4">
              <ScoreRing score={localAnalysis.qualityScore} color={rateZone.color} />
              <div className="flex-1">
                <p className="text-xs text-text-secondary mb-0.5">Breathing Quality Score</p>
                <p className="text-sm font-semibold text-text-primary mb-1">{localAnalysis.breathingRateZone}</p>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: rateZone.color + '22', color: rateZone.color }}
                >
                  {rateZone.description}
                </span>
              </div>
            </div>

            {/* Breathing rate */}
            <div className="bg-white border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-text-primary text-sm">Resting Breathing Rate</h3>
                <button
                  onClick={startCounting}
                  disabled={isCounting}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-xl border font-medium transition-all',
                    isCounting
                      ? 'border-indigo-300 text-indigo-600 bg-indigo-50'
                      : 'border-border text-text-secondary hover:border-primary hover:text-primary'
                  )}
                >
                  {isCounting ? `Counting… ${countDown}s` : '⏱ Count 60s'}
                </button>
              </div>
              {isCounting && (
                <div className="text-center py-3 mb-3">
                  <div className="text-5xl mb-2 animate-pulse">🫁</div>
                  <p className="text-sm text-text-secondary">Count your breaths for <strong>{countDown}s</strong></p>
                </div>
              )}
              <div className="flex items-center gap-3 mb-2">
                <input
                  type="range"
                  min={6}
                  max={30}
                  value={form.resting_breathing_rate}
                  onChange={e => setForm(f => ({ ...f, resting_breathing_rate: Number(e.target.value) }))}
                  className="flex-1 accent-primary"
                />
                <span className="text-lg font-bold w-16 text-right" style={{ color: rateZone.color }}>
                  {form.resting_breathing_rate} bpm
                </span>
              </div>
              {/* Zone band */}
              <div className="relative h-3 rounded-full overflow-hidden flex">
                {[
                  { max: 8, color: '#6366f1', label: '<8' },
                  { max: 12, color: '#10b981', label: '8-12' },
                  { max: 16, color: '#3b82f6', label: '12-16' },
                  { max: 20, color: '#f59e0b', label: '16-20' },
                  { max: 25, color: '#f97316', label: '20-25' },
                  { max: 30, color: '#ef4444', label: '>25' },
                ].map((z, i) => (
                  <div key={i} className="flex-1" style={{ background: z.color }} />
                ))}
                {/* pointer */}
                <div
                  className="absolute top-0 h-full w-1 bg-white rounded-full shadow-sm transition-all"
                  style={{ left: `${((form.resting_breathing_rate - 6) / 24) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-text-secondary mt-1">
                <span>Very slow</span><span>Optimal</span><span>Normal</span><span>Elevated</span><span>High</span>
              </div>
            </div>

            {/* Breathing pattern */}
            <div className="bg-white border border-border rounded-2xl p-4">
              <h3 className="font-semibold text-text-primary text-sm mb-3">Breathing Pattern</h3>
              <div className="flex gap-2 mb-4">
                {(['nasal', 'mouth', 'mixed'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setForm(f => ({ ...f, breathing_pattern: p }))}
                    className={cn(
                      'flex-1 py-2 rounded-xl border text-sm font-medium transition-all capitalize',
                      form.breathing_pattern === p
                        ? 'bg-primary text-white border-primary'
                        : 'border-border text-text-secondary hover:border-primary/50'
                    )}
                  >
                    {p === 'nasal' ? '👃 Nasal' : p === 'mouth' ? '👄 Mouth' : '↔️ Mixed'}
                  </button>
                ))}
              </div>
              <h3 className="font-semibold text-text-primary text-sm mb-2">Breathing Type</h3>
              <div className="flex gap-2">
                {(['chest', 'diaphragmatic', 'mixed'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setForm(f => ({ ...f, breathing_type: t }))}
                    className={cn(
                      'flex-1 py-2 rounded-xl border text-xs font-medium transition-all capitalize',
                      form.breathing_type === t
                        ? 'bg-primary text-white border-primary'
                        : 'border-border text-text-secondary hover:border-primary/50'
                    )}
                  >
                    {t === 'chest' ? '🫀 Chest' : t === 'diaphragmatic' ? '🫁 Belly' : '↔️ Mixed'}
                  </button>
                ))}
              </div>
            </div>

            {/* MRC Breathlessness Scale */}
            <div className="bg-white border border-border rounded-2xl p-4">
              <h3 className="font-semibold text-text-primary text-sm mb-1">MRC Breathlessness Scale</h3>
              <p className="text-xs text-text-secondary mb-3">Modified Medical Research Council scale (0–4)</p>
              <div className="space-y-2">
                {MRC_DESCRIPTIONS.map(m => (
                  <button
                    key={m.scale}
                    onClick={() => setForm(f => ({ ...f, mrc_scale: m.scale }))}
                    className={cn(
                      'w-full flex items-start gap-3 px-3 py-2.5 rounded-xl border text-left transition-all',
                      form.mrc_scale === m.scale
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-border/80'
                    )}
                  >
                    <span className={cn(
                      'w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold mt-0.5',
                      form.mrc_scale === m.scale ? 'bg-primary text-white' : 'bg-surface text-text-secondary'
                    )}>
                      {m.scale}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-text-primary">{m.short}</p>
                      <p className="text-xs text-text-secondary">{m.detail}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Symptoms */}
            <div className="bg-white border border-border rounded-2xl p-4">
              <h3 className="font-semibold text-text-primary text-sm mb-3">Symptoms Today</h3>
              <div className="flex flex-wrap gap-2">
                {SYMPTOMS_LIST.map(s => (
                  <button
                    key={s.id}
                    onClick={() => toggleSymptom(s.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl border text-sm transition-all',
                      form.symptoms.includes(s.id)
                        ? 'bg-rose-100 border-rose-300 text-rose-700 font-medium'
                        : 'border-border text-text-secondary hover:border-rose-200'
                    )}
                  >
                    {s.emoji} {s.label}
                  </button>
                ))}
                {form.symptoms.length === 0 && (
                  <span className="text-xs text-text-secondary italic">None selected — tap to add</span>
                )}
              </div>
            </div>

            {/* Peak Flow */}
            <div className="bg-white border border-border rounded-2xl p-4">
              <h3 className="font-semibold text-text-primary text-sm mb-1">Peak Flow (optional)</h3>
              <p className="text-xs text-text-secondary mb-3">Measured with a peak flow meter — in L/min</p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-xs text-text-secondary block mb-1">Measured (L/min)</label>
                  <input
                    type="number"
                    placeholder="e.g. 450"
                    value={form.peak_flow_measured ?? ''}
                    onChange={e => setForm(f => ({ ...f, peak_flow_measured: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-sm text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary block mb-1">Height (cm)</label>
                  <input
                    type="number"
                    placeholder="170"
                    value={form.height_cm ?? ''}
                    onChange={e => setForm(f => ({ ...f, height_cm: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-sm text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary block mb-1">Age</label>
                  <input
                    type="number"
                    placeholder="30"
                    value={form.age ?? ''}
                    onChange={e => setForm(f => ({ ...f, age: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-sm text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              {/* Sex selector */}
              <div className="flex gap-2 mb-3">
                {(['male', 'female'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setForm(f => ({ ...f, sex: s }))}
                    className={cn(
                      'px-3 py-1.5 rounded-xl border text-sm capitalize transition-all',
                      form.sex === s ? 'bg-primary text-white border-primary' : 'border-border text-text-secondary'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {predictedPF && (
                <div className="bg-surface rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-text-secondary">Predicted PEF (Wright-McKerrow)</p>
                    <p className="text-sm font-bold text-text-primary">{predictedPF} L/min</p>
                  </div>
                  {pfPct !== null && (
                    <div className="text-right">
                      <p className="text-xs text-text-secondary">% of predicted</p>
                      <p className={cn('text-lg font-bold', pfPct >= 80 ? 'text-emerald-600' : pfPct >= 60 ? 'text-amber-600' : 'text-rose-600')}>
                        {pfPct}%
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white border border-border rounded-2xl p-4">
              <h3 className="font-semibold text-text-primary text-sm mb-2">Notes</h3>
              <textarea
                rows={2}
                placeholder="Any observations about your breathing today…"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-sm text-text-primary focus:outline-none focus:border-primary resize-none"
              />
            </div>

            {/* Recommendations */}
            {localAnalysis.recommendations.length > 0 && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-semibold text-indigo-800 text-sm">Recommendations</h3>
                </div>
                <ul className="space-y-1.5">
                  {localAnalysis.recommendations.map((r, i) => (
                    <li key={i} className="text-xs text-indigo-700 flex gap-1.5">
                      <span className="mt-0.5">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving}
              className={cn(
                'w-full py-3.5 rounded-2xl font-semibold text-sm transition-all',
                saved
                  ? 'bg-emerald-500 text-white'
                  : 'bg-primary text-white hover:opacity-90'
              )}
            >
              {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Assessment'}
            </button>
          </div>
        )}

        {/* ── Tab 2: Practice ───────────────────────────────────────────────── */}
        {tab === 'practice' && (
          <div className="space-y-4">
            {/* Today's sessions */}
            {(form.exercises_completed ?? []).length > 0 && (
              <div className="bg-white border border-border rounded-2xl p-4">
                <h3 className="font-semibold text-text-primary text-sm mb-3">Today's Sessions</h3>
                <div className="space-y-2">
                  {form.exercises_completed.map((s, i) => {
                    const ex = BREATHING_EXERCISES.find(e => e.id === s.exercise_id)
                    const reduction = s.stress_before - s.stress_after
                    return (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{ex?.emoji ?? '🫁'}</span>
                          <div>
                            <p className="text-sm font-medium text-text-primary">{ex?.name ?? s.exercise_id}</p>
                            <p className="text-xs text-text-secondary">{s.rounds_completed} rounds · {s.duration_min}min</p>
                          </div>
                        </div>
                        {reduction !== 0 && (
                          <span className={cn('text-xs font-semibold px-2 py-1 rounded-lg', reduction > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700')}>
                            {reduction > 0 ? '↓' : '↑'}{Math.abs(reduction)} stress
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Exercise cards */}
            <div className="space-y-3">
              {BREATHING_EXERCISES.map(ex => (
                <div key={ex.id} className="bg-white border border-border rounded-2xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{ex.emoji}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-text-primary text-sm">{ex.name}</h3>
                          <DiffBadge level={ex.difficulty} />
                        </div>
                        <p className="text-xs text-text-secondary font-mono">{ex.pattern}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveGuide(ex)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity shrink-0"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Start
                    </button>
                  </div>

                  {/* Phase visual */}
                  <div className="flex gap-1.5 mb-3 flex-wrap">
                    {ex.phases.map((p, i) => (
                      <React.Fragment key={i}>
                        <div
                          className="text-[10px] px-2 py-1 rounded-lg font-medium"
                          style={{ background: p.color + '22', color: p.color }}
                        >
                          {i === 0 ? '↑' : p.label.toLowerCase().includes('exhale') ? '↓' : p.label.toLowerCase().includes('hold') ? '⏸' : '↑'} {p.label} {p.duration}s
                        </div>
                        {i < ex.phases.length - 1 && <span className="text-text-secondary text-[10px] self-center">→</span>}
                      </React.Fragment>
                    ))}
                    <div className="text-[10px] px-2 py-1 rounded-lg bg-surface text-text-secondary font-medium ml-1">
                      ×{ex.rounds} rounds
                    </div>
                  </div>

                  <p className="text-xs text-text-secondary mb-2">{ex.benefit}</p>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {ex.bestFor.map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 bg-surface rounded-full text-text-secondary border border-border">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-text-secondary/70">
                    <BookOpen className="w-3 h-3" />
                    <span>{ex.citation}</span>
                  </div>

                  {ex.caution && (
                    <p className="mt-2 text-[10px] text-amber-700 bg-amber-50 rounded-lg px-2 py-1">
                      ⚠️ {ex.caution}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab 3: Trends ─────────────────────────────────────────────────── */}
        {tab === 'trends' && (
          <div className="space-y-4">
            {!data || data.trend.length === 0 ? (
              <div className="bg-white border border-border rounded-2xl p-8 text-center">
                <div className="text-4xl mb-3">📊</div>
                <p className="text-sm text-text-secondary">No data yet — save your first assessment to see trends.</p>
              </div>
            ) : (
              <>
                {/* Breathing rate trend */}
                <div className="bg-white border border-border rounded-2xl p-4">
                  <h3 className="font-semibold text-text-primary text-sm mb-4">Breathing Rate (bpm)</h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={data.trend} margin={{ left: -20, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      {/* Zone background areas */}
                      <ReferenceArea y1={4} y2={8} fill="#6366f133" />
                      <ReferenceArea y1={8} y2={12} fill="#10b98133" />
                      <ReferenceArea y1={12} y2={16} fill="#3b82f633" />
                      <ReferenceArea y1={16} y2={20} fill="#f59e0b22" />
                      <ReferenceArea y1={20} y2={30} fill="#ef444422" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                        tickFormatter={d => d.slice(5)}
                        tickLine={false}
                      />
                      <YAxis domain={[4, 30]} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12 }}
                        formatter={(v: number) => [`${v} bpm`, 'Rate']}
                        labelFormatter={(l: string) => l}
                      />
                      <Line
                        type="monotone"
                        dataKey="rate"
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#6366f1' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[
                      { label: '<8 Very slow', color: '#6366f1' },
                      { label: '8-12 Optimal', color: '#10b981' },
                      { label: '12-16 Normal', color: '#3b82f6' },
                      { label: '16+ Elevated', color: '#f59e0b' },
                    ].map(z => (
                      <div key={z.label} className="flex items-center gap-1 text-[10px] text-text-secondary">
                        <div className="w-2 h-2 rounded-full" style={{ background: z.color }} />
                        {z.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stress before/after */}
                {data.trend.some(d => d.avgStressBefore !== null) && (
                  <div className="bg-white border border-border rounded-2xl p-4">
                    <h3 className="font-semibold text-text-primary text-sm mb-4">Stress Before vs After (avg per day)</h3>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={data.trend.filter(d => d.avgStressBefore !== null)} margin={{ left: -20, right: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickFormatter={d => d.slice(5)} tickLine={false} />
                        <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12 }}
                        />
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="avgStressBefore" name="Stress Before" fill="#f97316" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="avgStressAfter" name="Stress After" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Sessions per day */}
                <div className="bg-white border border-border rounded-2xl p-4">
                  <h3 className="font-semibold text-text-primary text-sm mb-4">Daily Practice Sessions</h3>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={data.trend} margin={{ left: -20, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickFormatter={d => d.slice(5)} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12 }}
                        formatter={(v: number) => [`${v}`, 'Sessions']}
                      />
                      <Bar dataKey="sessionsCount" name="Sessions" radius={[4, 4, 0, 0]}>
                        {data.trend.map((_, i) => (
                          <Cell key={i} fill="#6366f1" opacity={0.75 + (i / data.trend.length) * 0.25} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* MRC trend */}
                <div className="bg-white border border-border rounded-2xl p-4">
                  <h3 className="font-semibold text-text-primary text-sm mb-1">MRC Breathlessness Scale</h3>
                  <p className="text-xs text-text-secondary mb-3">Lower is better (0 = none)</p>
                  <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={data.trend} margin={{ left: -20, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickFormatter={d => d.slice(5)} tickLine={false} />
                      <YAxis domain={[0, 4]} ticks={[0,1,2,3,4]} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12 }}
                        formatter={(v: number) => [`${v}`, 'MRC Scale']}
                      />
                      <Line type="stepAfter" dataKey="mrc" stroke="#f97316" strokeWidth={2} dot={{ r: 3, fill: '#f97316' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Peak flow trend */}
                {data.trend.some(d => d.peak_flow !== null) && (
                  <div className="bg-white border border-border rounded-2xl p-4">
                    <h3 className="font-semibold text-text-primary text-sm mb-4">Peak Flow Measured (L/min)</h3>
                    <ResponsiveContainer width="100%" height={120}>
                      <LineChart data={data.trend.filter(d => d.peak_flow !== null)} margin={{ left: -20, right: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickFormatter={d => d.slice(5)} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', fontSize: 12 }}
                          formatter={(v: number) => [`${v} L/min`, 'Peak Flow']}
                        />
                        <Line type="monotone" dataKey="peak_flow" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Symptom frequency */}
                {(() => {
                  const sympFreq = SYMPTOMS_LIST.map(s => ({
                    name: s.label,
                    emoji: s.emoji,
                    count: data.trend.filter(d => {
                      const log = data.logs.find(l => l.date === d.date)
                      return log?.symptoms?.includes(s.id) ?? false
                    }).length,
                  })).filter(s => s.count > 0)
                  if (sympFreq.length === 0) return null
                  return (
                    <div className="bg-white border border-border rounded-2xl p-4">
                      <h3 className="font-semibold text-text-primary text-sm mb-3">Symptom Frequency (30 days)</h3>
                      <div className="space-y-2">
                        {sympFreq.sort((a,b) => b.count - a.count).map(s => (
                          <div key={s.name} className="flex items-center gap-2">
                            <span className="text-sm w-5">{s.emoji}</span>
                            <span className="text-xs text-text-secondary w-32">{s.name}</span>
                            <div className="flex-1 bg-border/50 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-rose-400 transition-all"
                                style={{ width: `${(s.count / 30) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-text-secondary w-6 text-right">{s.count}d</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
