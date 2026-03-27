'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Wind, CheckCircle2, Play, Pause, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import { cn } from '@/lib/utils'
import {
  BREATHING_EXERCISES,
  GROUNDING_TECHNIQUES,
  calculateAllostaticLoad,
} from '@/lib/stress'
import type { ANSState, StressLog, AllostaticLoad, BreathingExercise } from '@/lib/stress'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

// ─── Constants ────────────────────────────────────────────────────────────────

const ANS_STATES: { id: ANSState; emoji: string; label: string; desc: string; color: string }[] = [
  {
    id: 'thriving',
    emoji: '🌿',
    label: 'Thriving',
    desc: 'Safe & Social — ventral vagal; connected, calm, curious',
    color: 'border-emerald-500 bg-emerald-500/10 text-emerald-600',
  },
  {
    id: 'stressed',
    emoji: '⚡',
    label: 'Stressed',
    desc: 'Mobilised — sympathetic; fight-or-flight activated',
    color: 'border-amber-500 bg-amber-500/10 text-amber-600',
  },
  {
    id: 'depleted',
    emoji: '😔',
    label: 'Depleted',
    desc: 'Shutdown — dorsal vagal; withdrawn, fatigued, numb',
    color: 'border-rose-500 bg-rose-500/10 text-rose-600',
  },
]

const STRESSORS = ['Work', 'Relationships', 'Financial', 'Health', 'Family', 'News', 'Other']
const SYMPTOMS = ['Headache', 'Tension', 'Fatigue', 'Digestive', 'Racing heart', 'Poor sleep']
const COPING = ['Exercise', 'Breathing', 'Meditation', 'Social connection', 'Nature', 'Rest']

const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

// ─── Gauge ────────────────────────────────────────────────────────────────────

function AllostaticGauge({ score, level }: { score: number; level: string }) {
  const radius = 80
  const stroke = 14
  const cx = 110; const cy = 100
  const startAngle = 180; const endAngle = 0
  const toRad = (d: number) => (d * Math.PI) / 180
  const arcX = (a: number) => cx + radius * Math.cos(toRad(a))
  const arcY = (a: number) => cy - radius * Math.sin(toRad(a))
  const scoreAngle = 180 - (score / 100) * 180
  const levelColor = level === 'Low' ? '#10b981' : level === 'Moderate' ? '#f59e0b' : level === 'High' ? '#f97316' : '#ef4444'

  return (
    <svg viewBox="0 0 220 120" className="w-full max-w-xs mx-auto">
      {/* Track */}
      <path
        d={`M ${arcX(180)} ${arcY(180)} A ${radius} ${radius} 0 0 1 ${arcX(0)} ${arcY(0)}`}
        fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round"
        className="text-border"
      />
      {/* Fill */}
      {score > 0 && (
        <path
          d={`M ${arcX(180)} ${arcY(180)} A ${radius} ${radius} 0 0 1 ${arcX(scoreAngle)} ${arcY(scoreAngle)}`}
          fill="none" stroke={levelColor} strokeWidth={stroke} strokeLinecap="round"
        />
      )}
      <text x={cx} y={cy - 10} textAnchor="middle" fontSize={28} fontWeight="bold" fill={levelColor}>{score}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize={11} fill="currentColor" className="text-text-secondary">{level}</text>
      <text x={cx} y={cy + 26} textAnchor="middle" fontSize={9} fill="currentColor" className="text-text-secondary">Allostatic Load</text>
    </svg>
  )
}

// ─── Breathing Guide ──────────────────────────────────────────────────────────

function BreathingGuide({ exercise }: { exercise: BreathingExercise }) {
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState<'inhale' | 'hold1' | 'exhale' | 'hold2'>('inhale')
  const [timeLeft, setTimeLeft] = useState(exercise.pattern.inhale)
  const [scale, setScale] = useState(1)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const phases: Array<{ key: 'inhale' | 'hold1' | 'exhale' | 'hold2'; label: string; dur: number }> = [
    { key: 'inhale', label: 'Inhale', dur: exercise.pattern.inhale },
    { key: 'hold1', label: 'Hold', dur: exercise.pattern.hold1 },
    { key: 'exhale', label: 'Exhale', dur: exercise.pattern.exhale },
    { key: 'hold2', label: 'Hold', dur: exercise.pattern.hold2 },
  ].filter((p) => p.dur > 0)

  const phaseIdx = useRef(0)
  const remaining = useRef(exercise.pattern.inhale)

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(false)
    phaseIdx.current = 0
    remaining.current = phases[0].dur
    setPhase(phases[0].key)
    setTimeLeft(phases[0].dur)
    setScale(1)
  }, [phases])

  useEffect(() => {
    reset()
  }, [exercise.id])

  const start = useCallback(() => {
    setRunning(true)
    intervalRef.current = setInterval(() => {
      remaining.current -= 1
      setTimeLeft(remaining.current)
      const cur = phases[phaseIdx.current]
      const progress = 1 - remaining.current / cur.dur
      if (cur.key === 'inhale') setScale(1 + progress * 0.6)
      else if (cur.key === 'exhale') setScale(1.6 - progress * 0.6)

      if (remaining.current <= 0) {
        phaseIdx.current = (phaseIdx.current + 1) % phases.length
        const next = phases[phaseIdx.current]
        remaining.current = next.dur
        setPhase(next.key)
        setTimeLeft(next.dur)
      }
    }, 1000)
  }, [phases])

  const pause = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(false)
  }, [])

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  const phaseColor = phase === 'inhale' ? '#6366f1' : phase === 'exhale' ? '#10b981' : '#f59e0b'
  const phaseLabel = phases.find((p) => p.key === phase)?.label ?? ''

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
        <div
          className="rounded-full transition-transform"
          style={{
            width: 80, height: 80,
            background: `radial-gradient(circle, ${phaseColor}40, ${phaseColor}20)`,
            border: `2px solid ${phaseColor}`,
            transform: `scale(${scale})`,
            transition: running ? 'transform 1s linear' : 'none',
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-semibold" style={{ color: phaseColor }}>{phaseLabel}</span>
          <span className="text-lg font-bold text-text-primary">{timeLeft}</span>
        </div>
      </div>
      <div className="flex gap-2">
        {!running ? (
          <button onClick={start} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium">
            <Play className="w-4 h-4" /> Start
          </button>
        ) : (
          <button onClick={pause} className="flex items-center gap-1.5 px-4 py-2 bg-surface border border-border rounded-xl text-sm font-medium">
            <Pause className="w-4 h-4" /> Pause
          </button>
        )}
        <button onClick={reset} className="flex items-center gap-1.5 px-3 py-2 bg-surface border border-border rounded-xl text-sm">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Chip multi-select ────────────────────────────────────────────────────────

function ChipSelect({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (v: string) => {
    onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt.toLowerCase())}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
            selected.includes(opt.toLowerCase())
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-surface border-border text-text-secondary hover:border-primary/50'
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'checkin' | 'toolkit' | 'insights'

interface ApiData {
  logs: Array<{
    id: string
    log_date: string
    perceived_stress: number | null
    ans_state: string | null
    stressors: string[] | null
    stressor_intensity: number | null
    physical_symptoms: string[] | null
    coping_used: string[] | null
    notes: string | null
  }>
  allostaticLoad: AllostaticLoad
  trend: Array<{ date: string; stress: number; ans_state: string }>
  recoveryData?: { hrv_ms?: number; resting_hr?: number; sleep_hours?: number; mood?: number }
}

export default function StressPage() {
  const [tab, setTab] = useState<Tab>('checkin')
  const [apiData, setApiData] = useState<ApiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Check-in form state
  const [ansState, setAnsState] = useState<ANSState>('stressed')
  const [stressLevel, setStressLevel] = useState(5)
  const [stressors, setStressors] = useState<string[]>([])
  const [stressorIntensity, setStressorIntensity] = useState(5)
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [coping, setCoping] = useState<string[]>([])

  // Toolkit state
  const [activeBreathing, setActiveBreathing] = useState<string | null>(null)
  const [expandedGrounding, setExpandedGrounding] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/stress')
      if (res.ok) {
        const d = await res.json()
        setApiData(d)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/stress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          perceived_stress: stressLevel,
          ans_state: ansState,
          stressors,
          stressor_intensity: stressors.length > 0 ? stressorIntensity : null,
          physical_symptoms: symptoms,
          coping_used: coping,
        }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
        await fetchData()
      }
    } finally {
      setSaving(false)
    }
  }

  const stressEmoji = (v: number) => {
    const emojis = ['😌', '😌', '🙂', '😐', '😐', '😟', '😟', '😰', '😰', '😱']
    return emojis[v - 1] ?? '😐'
  }

  // Stressor pie data
  const stressorCounts = (() => {
    const counts: Record<string, number> = {}
    for (const log of apiData?.logs ?? []) {
      for (const s of log.stressors ?? []) {
        counts[s] = (counts[s] ?? 0) + 1
      }
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  })()

  // Work-day vs weekend
  const wdAvg = (() => {
    const wdStress: number[] = []
    const weStress: number[] = []
    for (const pt of apiData?.trend ?? []) {
      const day = new Date(pt.date).getDay()
      if (day === 0 || day === 6) weStress.push(pt.stress)
      else wdStress.push(pt.stress)
    }
    return {
      weekday: wdStress.length ? (wdStress.reduce((s, v) => s + v, 0) / wdStress.length).toFixed(1) : null,
      weekend: weStress.length ? (weStress.reduce((s, v) => s + v, 0) / weStress.length).toFixed(1) : null,
    }
  })()

  const al = apiData?.allostaticLoad
  const alColor = al?.level === 'Low' ? 'text-emerald-500' : al?.level === 'Moderate' ? 'text-amber-500' : al?.level === 'High' ? 'text-orange-500' : 'text-rose-500'

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-lg hover:bg-surface transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Wind className="w-5 h-5 text-primary" /> Stress & Nervous System
            </h1>
            <p className="text-xs text-text-secondary">Allostatic load · ANS state · Recovery toolkit</p>
          </div>
        </div>
        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4 pb-1 flex gap-1">
          {(['checkin', 'toolkit', 'insights'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-lg transition-colors',
                tab === t ? 'bg-primary text-primary-foreground' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {t === 'checkin' ? 'Check-In' : t === 'toolkit' ? 'Toolkit' : 'Insights'}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 pb-28 space-y-5">

        {/* ── Check-In Tab ─────────────────────────────────────────────────── */}
        {tab === 'checkin' && (
          <div className="space-y-5">
            {/* ANS State selector */}
            <section className="rounded-2xl border border-border bg-surface p-4 space-y-3">
              <h2 className="text-sm font-semibold text-text-primary">How&apos;s your nervous system right now?</h2>
              <div className="grid grid-cols-3 gap-2">
                {ANS_STATES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setAnsState(s.id)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all text-center',
                      ansState === s.id ? s.color : 'border-border bg-background text-text-secondary hover:border-border/70'
                    )}
                  >
                    <span className="text-2xl">{s.emoji}</span>
                    <span className="text-xs font-semibold">{s.label}</span>
                    <span className="text-[10px] leading-tight opacity-80">{s.desc.split('—')[0].trim()}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-text-secondary italic">
                {ANS_STATES.find((s) => s.id === ansState)?.desc}
              </p>
            </section>

            {/* Perceived stress slider */}
            <section className="rounded-2xl border border-border bg-surface p-4 space-y-3">
              <h2 className="text-sm font-semibold text-text-primary">Perceived Stress Level</h2>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{stressEmoji(stressLevel)}</span>
                <input
                  type="range" min={1} max={10} value={stressLevel}
                  onChange={(e) => setStressLevel(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="text-lg font-bold text-text-primary w-10 text-center">{stressLevel}/10</span>
              </div>
              <div className="flex justify-between text-[11px] text-text-secondary px-1">
                <span>Very calm</span>
                <span>Moderate</span>
                <span>Overwhelmed</span>
              </div>
            </section>

            {/* Stressors */}
            <section className="rounded-2xl border border-border bg-surface p-4 space-y-3">
              <h2 className="text-sm font-semibold text-text-primary">What&apos;s causing stress today?</h2>
              <ChipSelect options={STRESSORS} selected={stressors} onChange={setStressors} />
              {stressors.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs text-text-secondary">Stressor intensity</label>
                  <div className="flex items-center gap-2">
                    <input type="range" min={1} max={10} value={stressorIntensity}
                      onChange={(e) => setStressorIntensity(Number(e.target.value))}
                      className="flex-1 accent-primary"
                    />
                    <span className="text-sm font-semibold w-6">{stressorIntensity}</span>
                  </div>
                </div>
              )}
            </section>

            {/* Physical symptoms */}
            <section className="rounded-2xl border border-border bg-surface p-4 space-y-3">
              <h2 className="text-sm font-semibold text-text-primary">Physical symptoms?</h2>
              <ChipSelect options={SYMPTOMS} selected={symptoms} onChange={setSymptoms} />
            </section>

            {/* Coping */}
            <section className="rounded-2xl border border-border bg-surface p-4 space-y-3">
              <h2 className="text-sm font-semibold text-text-primary">What helped today?</h2>
              <ChipSelect options={COPING} selected={coping} onChange={setCoping} />
            </section>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : saving ? 'Saving…' : 'Save Check-In'}
            </button>
          </div>
        )}

        {/* ── Toolkit Tab ──────────────────────────────────────────────────── */}
        {tab === 'toolkit' && (
          <div className="space-y-5">
            {/* Breathing section */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-text-primary">🫁 Breathing Exercises</h2>
              {BREATHING_EXERCISES.map((ex) => {
                const open = activeBreathing === ex.id
                const pattern = `${ex.pattern.inhale}-${ex.pattern.hold1 || '0'}-${ex.pattern.exhale}${ex.pattern.hold2 ? `-${ex.pattern.hold2}` : ''}`
                return (
                  <div key={ex.id} className="rounded-2xl border border-border bg-surface overflow-hidden">
                    <button
                      className="w-full p-4 flex items-start gap-3 text-left"
                      onClick={() => setActiveBreathing(open ? null : ex.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-text-primary">{ex.name}</span>
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono">{pattern}s</span>
                          <span className="text-[10px] text-text-secondary">{ex.duration_min} min</span>
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{ex.benefit}</p>
                      </div>
                      {open ? <ChevronUp className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" /> : <ChevronDown className="w-4 h-4 text-text-secondary shrink-0 mt-0.5" />}
                    </button>
                    {open && (
                      <div className="border-t border-border px-4 pb-4 space-y-2">
                        <BreathingGuide exercise={ex} />
                        <p className="text-[11px] text-text-secondary text-center italic">{ex.research}</p>
                        <p className="text-xs text-text-secondary">{ex.description}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Grounding section */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-text-primary">🌱 Grounding Techniques</h2>
              {GROUNDING_TECHNIQUES.map((gt) => {
                const open = expandedGrounding === gt.name
                return (
                  <div key={gt.name} className="rounded-2xl border border-border bg-surface overflow-hidden">
                    <button
                      className="w-full p-4 flex items-center gap-3 text-left"
                      onClick={() => setExpandedGrounding(open ? null : gt.name)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-text-primary">{gt.name}</span>
                          <span className="text-[10px] text-text-secondary">{gt.duration_min} min</span>
                        </div>
                      </div>
                      {open ? <ChevronUp className="w-4 h-4 text-text-secondary" /> : <ChevronDown className="w-4 h-4 text-text-secondary" />}
                    </button>
                    {open && (
                      <ol className="border-t border-border px-4 pb-4 pt-2 space-y-1.5 list-decimal list-inside">
                        {gt.steps.map((step, i) => (
                          <li key={i} className="text-sm text-text-secondary">{step}</li>
                        ))}
                      </ol>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Insights Tab ─────────────────────────────────────────────────── */}
        {tab === 'insights' && (
          <div className="space-y-5">
            {loading && <p className="text-sm text-text-secondary text-center py-8">Loading insights…</p>}

            {al && (
              <>
                {/* Allostatic load gauge */}
                <section className="rounded-2xl border border-border bg-surface p-4">
                  <h2 className="text-sm font-semibold text-text-primary mb-2">Allostatic Load Score</h2>
                  <AllostaticGauge score={al.score} level={al.level} />
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', {
                      'bg-emerald-500/10 text-emerald-600': al.level === 'Low',
                      'bg-amber-500/10 text-amber-600': al.level === 'Moderate',
                      'bg-orange-500/10 text-orange-600': al.level === 'High',
                      'bg-rose-500/10 text-rose-600': al.level === 'Critical',
                    })}>
                      {al.level} Load
                    </span>
                    <span className={cn('text-xs px-2.5 py-1 rounded-full bg-surface-secondary', {
                      'text-emerald-500': al.trend === 'improving',
                      'text-text-secondary': al.trend === 'stable',
                      'text-rose-500': al.trend === 'worsening',
                    })}>
                      {al.trend === 'improving' ? '↓ Improving' : al.trend === 'worsening' ? '↑ Worsening' : '→ Stable'}
                    </span>
                  </div>
                  {/* Contributors */}
                  <div className="space-y-1.5">
                    {al.contributors.map((c) => (
                      <div key={c.factor} className="flex items-center gap-2">
                        <span className="text-xs text-text-secondary w-40 truncate">{c.factor}</span>
                        <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full', alColor.replace('text-', 'bg-'))} style={{ width: `${Math.min(100, (c.contribution / 25) * 100)}%` }} />
                        </div>
                        <span className="text-xs font-mono text-text-secondary w-6 text-right">{c.contribution}</span>
                      </div>
                    ))}
                  </div>
                  {/* Recommendations */}
                  {al.recommendations.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {al.recommendations.map((r, i) => (
                        <div key={i} className="flex gap-2 text-xs text-text-secondary">
                          <span className="text-primary shrink-0">→</span>
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* 30-day trend */}
                {(apiData?.trend?.length ?? 0) > 1 && (
                  <section className="rounded-2xl border border-border bg-surface p-4">
                    <h2 className="text-sm font-semibold text-text-primary mb-3">30-Day Stress Trend</h2>
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart data={apiData!.trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                        <YAxis domain={[1, 10]} tick={{ fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                          formatter={(v: number) => [v, 'Stress']}
                        />
                        <Line type="monotone" dataKey="stress" stroke="var(--primary)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </section>
                )}

                {/* Stressor pie */}
                {stressorCounts.length > 0 && (
                  <section className="rounded-2xl border border-border bg-surface p-4">
                    <h2 className="text-sm font-semibold text-text-primary mb-3">Top Stressors (30 days)</h2>
                    <div className="flex items-center gap-4">
                      <PieChart width={120} height={120}>
                        <Pie data={stressorCounts} cx={55} cy={55} innerRadius={30} outerRadius={55} dataKey="value" paddingAngle={2}>
                          {stressorCounts.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                      <div className="flex-1 space-y-1">
                        {stressorCounts.slice(0, 5).map((s, i) => (
                          <div key={s.name} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-xs text-text-secondary capitalize flex-1">{s.name}</span>
                            <span className="text-xs font-semibold text-text-primary">{s.value}d</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}

                {/* Work day vs weekend */}
                {wdAvg.weekday && wdAvg.weekend && (
                  <section className="rounded-2xl border border-border bg-surface p-4">
                    <h2 className="text-sm font-semibold text-text-primary mb-3">Weekday vs Weekend</h2>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                        <div className="text-2xl font-bold text-amber-500">{wdAvg.weekday}</div>
                        <div className="text-xs text-text-secondary mt-0.5">Weekday avg</div>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                        <div className="text-2xl font-bold text-emerald-500">{wdAvg.weekend}</div>
                        <div className="text-xs text-text-secondary mt-0.5">Weekend avg</div>
                      </div>
                    </div>
                    {Number(wdAvg.weekday) > Number(wdAvg.weekend) + 0.5 && (
                      <p className="text-xs text-text-secondary mt-2 italic">Your weekday stress is {(Number(wdAvg.weekday) - Number(wdAvg.weekend)).toFixed(1)} points higher — weekends provide meaningful recovery.</p>
                    )}
                  </section>
                )}

                {/* HRV correlation */}
                {apiData?.recoveryData?.hrv_ms && (
                  <section className="rounded-2xl border border-border bg-surface p-4">
                    <h2 className="text-sm font-semibold text-text-primary mb-2">Recovery Data</h2>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      {apiData.recoveryData.hrv_ms !== undefined && (
                        <div className="p-2.5 rounded-xl bg-surface-secondary">
                          <div className="text-lg font-bold text-primary">{apiData.recoveryData.hrv_ms.toFixed(0)}ms</div>
                          <div className="text-[11px] text-text-secondary">HRV</div>
                        </div>
                      )}
                      {apiData.recoveryData.resting_hr !== undefined && (
                        <div className="p-2.5 rounded-xl bg-surface-secondary">
                          <div className="text-lg font-bold text-primary">{apiData.recoveryData.resting_hr.toFixed(0)} bpm</div>
                          <div className="text-[11px] text-text-secondary">Resting HR</div>
                        </div>
                      )}
                      {apiData.recoveryData.sleep_hours !== undefined && (
                        <div className="p-2.5 rounded-xl bg-surface-secondary">
                          <div className="text-lg font-bold text-primary">{apiData.recoveryData.sleep_hours.toFixed(1)}h</div>
                          <div className="text-[11px] text-text-secondary">Sleep</div>
                        </div>
                      )}
                      {apiData.recoveryData.mood !== undefined && (
                        <div className="p-2.5 rounded-xl bg-surface-secondary">
                          <div className="text-lg font-bold text-primary">{apiData.recoveryData.mood.toFixed(1)}/10</div>
                          <div className="text-[11px] text-text-secondary">Mood</div>
                        </div>
                      )}
                    </div>
                    {apiData.recoveryData.hrv_ms < 30 && (
                      <p className="text-xs text-text-secondary mt-2 italic">Your HRV is below 30ms — a sign of elevated nervous system load. Try coherent breathing today.</p>
                    )}
                  </section>
                )}
              </>
            )}

            {!loading && !al && (
              <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                  <Wind className="w-8 h-8 text-amber-500/60" />
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-1">No check-ins yet</h3>
                <p className="text-sm text-text-secondary max-w-xs">
                  Log how you&apos;re feeling above to track your stress patterns and get personalised insights.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
