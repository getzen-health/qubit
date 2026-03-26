'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Zap,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { BottomNav } from '@/components/bottom-nav'
import { calculateRecovery, type RecoveryInput, type RecoveryResult } from '@/lib/recovery'

// ─── Color constants ──────────────────────────────────────────────────────────
const GRADE_STROKE: Record<string, string> = {
  Excellent: '#22c55e',
  Good: '#14b8a6',
  Fair: '#eab308',
  Poor: '#f97316',
  'Very Poor': '#ef4444',
}

const ACWR_META: Record<RecoveryResult['acwr_zone'], { bg: string; text: string; label: string }> = {
  Optimal: { bg: '#22c55e', text: '#fff', label: 'Optimal Zone' },
  Caution: { bg: '#eab308', text: '#000', label: 'Caution' },
  Overreach: { bg: '#ef4444', text: '#fff', label: 'Overreach – Injury Risk' },
  Undertraining: { bg: '#94a3b8', text: '#000', label: 'Undertraining' },
}

const ZONE_SEGMENTS = [
  { key: 'Undertraining', label: '<0.6', color: '#94a3b8' },
  { key: 'Caution', label: '0.6–0.8', color: '#eab308' },
  { key: 'Optimal', label: '0.8–1.3', color: '#22c55e' },
  { key: 'Caution2', label: '1.3–1.5', color: '#f97316' },
  { key: 'Overreach', label: '>1.5', color: '#ef4444' },
] as const

// ─── Score ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const r = 68
  const circ = 2 * Math.PI * r
  const filled = (score / 100) * circ
  const stroke = GRADE_STROKE[grade] ?? '#6b7280'
  return (
    <svg width="176" height="176" viewBox="0 0 176 176" aria-label={`Recovery score ${score}`}>
      <circle cx="88" cy="88" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
      <circle
        cx="88" cy="88" r={r} fill="none"
        stroke={stroke} strokeWidth="12"
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 88 88)"
        style={{ transition: 'stroke-dasharray 0.4s ease' }}
      />
      <text x="88" y="82" textAnchor="middle" fill="var(--color-text-primary,#f1f5f9)" fontSize="36" fontWeight="bold" fontFamily="inherit">{score}</text>
      <text x="88" y="106" textAnchor="middle" fill={stroke} fontSize="14" fontFamily="inherit">{grade}</text>
    </svg>
  )
}

// ─── Labelled slider ──────────────────────────────────────────────────────────
function Slider({
  label, name, min, max, step = 1, value, onChange, unit, hint,
}: {
  label: string; name: string; min: number; max: number; step?: number
  value: number; onChange: (v: number) => void; unit?: string; hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <label htmlFor={name} className="text-sm font-medium text-text-primary">{label}</label>
        <span className="text-sm font-semibold text-primary">{value}{unit ?? ''}</span>
      </div>
      <input
        id={name} type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full cursor-pointer accent-[color:var(--accent)]"
      />
      {hint && <p className="text-xs text-text-secondary">{hint}</p>}
    </div>
  )
}

// ─── Component score bars ─────────────────────────────────────────────────────
function ComponentBars({ components }: { components: RecoveryResult['components'] }) {
  const bars = [
    { label: 'HRV', value: components.hrv_score, max: 25, color: '#a78bfa' },
    { label: 'Sleep', value: components.sleep_score, max: 30, color: '#60a5fa' },
    { label: 'Subjective', value: components.subjective_score, max: 25, color: '#34d399' },
    { label: 'Load', value: components.load_score, max: 20, color: '#f97316' },
  ]
  return (
    <div className="space-y-3">
      {bars.map(b => (
        <div key={b.label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-text-secondary">{b.label}</span>
            <span className="text-text-primary font-medium">{b.value} / {b.max}</span>
          </div>
          <div className="h-2 rounded-full bg-surface-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${(b.value / b.max) * 100}%`, background: b.color }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── ACWR traffic-light gauge ─────────────────────────────────────────────────
function AcwrGauge({ acwr, zone }: { acwr: number; zone: RecoveryResult['acwr_zone'] }) {
  const meta = ACWR_META[zone]
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold" style={{ color: meta.bg }}>{acwr.toFixed(2)}</p>
          <p className="text-xs text-text-secondary mt-0.5">Acute : Chronic Workload</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: meta.bg, color: meta.text }}>
          {meta.label}
        </span>
      </div>
      {/* 5-segment colour bar */}
      <div className="flex gap-1 h-3">
        {ZONE_SEGMENTS.map((seg, i) => {
          const segZone = seg.key === 'Caution2' ? 'Caution' : seg.key
          const active = segZone === zone && (
            seg.key !== 'Caution' || (acwr < 0.8 ? i === 1 : i === 3)
          )
          return (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{ background: seg.color, opacity: active ? 1 : 0.22 }}
              title={seg.label}
            />
          )
        })}
      </div>
      <div className="flex justify-between text-[10px] text-text-secondary px-0.5">
        <span>&lt;0.6</span><span>0.8</span><span>1.3</span><span>&gt;1.5</span>
      </div>
    </div>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface RecoveryEntry {
  id: string
  logged_at: string
  hrv_ms: number | null
  resting_hr: number | null
  sleep_hours: number | null
  sleep_quality: number | null
  soreness: number | null
  mood: number | null
  acute_load: number | null
  chronic_load: number | null
  recovery_score: number | null
  acwr: number | null
}

const DEFAULT_FORM: RecoveryInput = {
  sleep_hours: 7,
  sleep_quality: 7,
  soreness: 3,
  mood: 7,
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RecoveryPage() {
  const router = useRouter()
  const [form, setForm] = useState<RecoveryInput>(DEFAULT_FORM)
  const [entries, setEntries] = useState<RecoveryEntry[]>([])
  const [baseline, setBaseline] = useState<{ hrv: number; hr: number } | undefined>()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formOpen, setFormOpen] = useState(true)

  const result = useMemo(() => calculateRecovery(form, baseline), [form, baseline])

  useEffect(() => {
    fetch('/api/recovery')
      .then(r => {
        if (r.status === 401) { router.push('/login'); return null }
        return r.json()
      })
      .then(data => {
        if (!data) return
        setEntries(data.entries ?? [])
        if (data.baseline) setBaseline(data.baseline)
        if (data.today) {
          const t = data.today as RecoveryEntry
          setForm({
            hrv_ms: t.hrv_ms ?? undefined,
            resting_hr: t.resting_hr ?? undefined,
            sleep_hours: t.sleep_hours ?? 7,
            sleep_quality: t.sleep_quality ?? 7,
            soreness: t.soreness ?? 3,
            mood: t.mood ?? 7,
            acute_load: t.acute_load ?? undefined,
            chronic_load: t.chronic_load ?? undefined,
          })
          setSubmitted(true)
          setFormOpen(false)
        }
      })
      .finally(() => setLoading(false))
  }, [router])

  const set = useCallback(
    (key: keyof RecoveryInput, value: number | undefined) =>
      setForm(f => ({ ...f, [key]: value })),
    [],
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, recovery_score: result.score, acwr: result.acwr }),
      })
      if (res.ok) {
        const data = await res.json()
        const today = new Date().toISOString().slice(0, 10)
        setEntries(prev => {
          const idx = prev.findIndex(e => e.logged_at === today)
          if (idx >= 0) {
            const next = [...prev]
            next[idx] = data.entry
            return next
          }
          return [...prev, data.entry]
        })
        setSubmitted(true)
        setFormOpen(false)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const chartData = entries.map(e => ({
    date: new Date(e.logged_at + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: e.recovery_score,
  }))

  const tooltipStyle = {
    background: 'var(--color-surface,#1a1a1a)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    fontSize: 12,
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Recovery Score</h1>
            <p className="text-sm text-text-secondary">HRV · Sleep · Training Load</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-24 space-y-5">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Score ring ──────────────────────────────────────────────── */}
            <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col items-center gap-4">
              <ScoreRing score={result.score} grade={result.grade} />
              <div className="flex gap-2 flex-wrap justify-center">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  result.hrv_status === 'High' ? 'bg-green-500/15 text-green-400' :
                  result.hrv_status === 'Low' ? 'bg-red-500/15 text-red-400' :
                  result.hrv_status === 'Normal' ? 'bg-teal-500/15 text-teal-400' :
                  'bg-surface-secondary text-text-secondary'
                }`}>HRV {result.hrv_status}</span>
                {result.acwr > 0 && (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    result.acwr_zone === 'Optimal' ? 'bg-green-500/15 text-green-400' :
                    result.acwr_zone === 'Overreach' ? 'bg-red-500/15 text-red-400' :
                    result.acwr_zone === 'Undertraining' ? 'bg-slate-500/15 text-slate-400' :
                    'bg-yellow-500/15 text-yellow-400'
                  }`}>ACWR {result.acwr.toFixed(2)}</span>
                )}
              </div>
              {submitted && (
                <p className="text-xs text-green-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Today&apos;s check-in saved
                </p>
              )}
            </div>

            {/* ── Daily check-in form ─────────────────────────────────────── */}
            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
              <button
                onClick={() => setFormOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-secondary transition-colors"
              >
                <span className="text-sm font-semibold text-text-primary">Daily Check-in</span>
                {formOpen
                  ? <ChevronUp className="w-4 h-4 text-text-secondary" />
                  : <ChevronDown className="w-4 h-4 text-text-secondary" />}
              </button>

              {formOpen && (
                <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-5 border-t border-border pt-4">
                  {/* Numeric inputs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-text-secondary block mb-1.5">HRV (ms)</label>
                      <input
                        type="number" min={0} max={200} placeholder="e.g. 45"
                        value={form.hrv_ms ?? ''}
                        onChange={e => set('hrv_ms', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full bg-surface-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-text-secondary block mb-1.5">Resting HR (bpm)</label>
                      <input
                        type="number" min={30} max={120} placeholder="e.g. 55"
                        value={form.resting_hr ?? ''}
                        onChange={e => set('resting_hr', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full bg-surface-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  <Slider
                    label="Sleep Duration" name="sleep_hours" min={4} max={12} step={0.5}
                    value={form.sleep_hours ?? 7} onChange={v => set('sleep_hours', v)} unit="h"
                    hint="How many hours did you sleep last night?"
                  />
                  <Slider
                    label="Sleep Quality" name="sleep_quality" min={1} max={10}
                    value={form.sleep_quality ?? 7} onChange={v => set('sleep_quality', v)}
                    hint="1 = terrible · 10 = perfect"
                  />
                  <Slider
                    label="Muscle Soreness" name="soreness" min={1} max={10}
                    value={form.soreness ?? 3} onChange={v => set('soreness', v)}
                    hint="1 = none · 10 = extreme"
                  />
                  <Slider
                    label="Mood / Motivation" name="mood" min={1} max={10}
                    value={form.mood ?? 7} onChange={v => set('mood', v)}
                    hint="1 = very low · 10 = excellent"
                  />

                  {/* Optional TRIMP inputs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-text-secondary block mb-1.5">Acute Load (7d TRIMP)</label>
                      <input
                        type="number" min={0} placeholder="optional"
                        value={form.acute_load ?? ''}
                        onChange={e => set('acute_load', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full bg-surface-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-text-secondary block mb-1.5">Chronic Load (28d TRIMP)</label>
                      <input
                        type="number" min={0} placeholder="optional"
                        value={form.chronic_load ?? ''}
                        onChange={e => set('chronic_load', e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full bg-surface-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit" disabled={submitting}
                    className="w-full bg-primary text-white rounded-xl py-3 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {submitting ? 'Saving…' : submitted ? 'Update Check-in' : 'Save Check-in'}
                  </button>
                </form>
              )}
            </div>

            {/* ── ACWR gauge ──────────────────────────────────────────────── */}
            {result.acwr > 0 && (
              <div className="bg-surface border border-border rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-text-primary mb-4">Training Load (ACWR)</h2>
                <AcwrGauge acwr={result.acwr} zone={result.acwr_zone} />
              </div>
            )}

            {/* ── Score breakdown ─────────────────────────────────────────── */}
            <div className="bg-surface border border-border rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-text-primary mb-4">Score Breakdown</h2>
              <ComponentBars components={result.components} />
            </div>

            {/* ── Recommendations ─────────────────────────────────────────── */}
            {result.recommendations.length > 0 && (
              <div className="bg-surface border border-border rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-text-primary mb-3">Recommendations</h2>
                <ul className="space-y-3">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex gap-3 text-sm text-text-secondary">
                      <Zap className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── 30-day trend ─────────────────────────────────────────────── */}
            {chartData.length > 1 && (
              <div className="bg-surface border border-border rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-text-primary mb-4">30-Day Trend</h2>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: 'var(--color-text-secondary,#888)' }}
                      axisLine={false} tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis domain={[0, 100]} hide />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: number) => [`${v}`, 'Recovery Score']}
                    />
                    <Line
                      type="monotone" dataKey="score"
                      stroke="#22c55e" strokeWidth={2}
                      dot={false} activeDot={{ r: 4 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-xs text-text-secondary mt-2 text-center">Recovery score (0–100) over last 30 days</p>
              </div>
            )}
          </>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
