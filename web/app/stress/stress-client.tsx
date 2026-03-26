'use client'

import { useState, useTransition } from 'react'
import dynamic from 'next/dynamic'
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import {
  Plus,
  X,
  Brain,
  Moon,
  TrendingUp,
  Tag,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Activity,
} from 'lucide-react'
import type { StressPageData, TrendPoint, CorrelationData } from './page'
import { cn } from '@/lib/utils'

const ComposedChart = dynamic(
  () => import('recharts').then((m) => ({ default: m.ComposedChart })),
  { ssr: false }
)

const CONTEXT_TAGS = ['work', 'exercise', 'sleep', 'illness', 'caffeine'] as const
type ContextTag = (typeof CONTEXT_TAGS)[number]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function stressColor(level: number): string {
  if (level <= 3) return '#10b981'
  if (level <= 6) return '#f59e0b'
  return '#ef4444'
}

function stressLabel(level: number): string {
  if (level <= 2) return 'Very Low'
  if (level <= 4) return 'Low'
  if (level <= 6) return 'Moderate'
  if (level <= 8) return 'High'
  return 'Very High'
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// ─── StressGauge ─────────────────────────────────────────────────────────────

interface GaugeProps {
  value: number
  label: string
  sublabel?: string
}

function StressGauge({ value, label, sublabel }: GaugeProps) {
  const cx = 60,
    cy = 60,
    r = 48,
    sw = 10

  // Background arc: 225° → 135° clockwise (270° sweep, opening at bottom)
  const bgStart = polarToCartesian(cx, cy, r, 225)
  const bgEnd = polarToCartesian(cx, cy, r, 135)
  const bgPath = `M ${bgStart.x.toFixed(2)} ${bgStart.y.toFixed(2)} A ${r} ${r} 0 1 1 ${bgEnd.x.toFixed(2)} ${bgEnd.y.toFixed(2)}`

  // Fill arc: starts at 225°, sweeps (value/10)*270° clockwise
  const fillDeg = Math.max(0, (value / 10) * 270)
  const fillEndAngle = 225 + fillDeg
  const fillEnd = polarToCartesian(cx, cy, r, fillEndAngle)
  const largeArc = fillDeg > 180 ? 1 : 0
  const fillPath =
    value > 0
      ? `M ${bgStart.x.toFixed(2)} ${bgStart.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${fillEnd.x.toFixed(2)} ${fillEnd.y.toFixed(2)}`
      : ''

  const color = stressColor(value)

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 120 120" className="w-full h-full">
          <path
            d={bgPath}
            fill="none"
            stroke="currentColor"
            strokeWidth={sw}
            strokeLinecap="round"
            className="text-gray-200 dark:text-gray-700"
          />
          {fillPath && (
            <path
              d={fillPath}
              fill="none"
              stroke={color}
              strokeWidth={sw}
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <span className="text-3xl font-bold tabular-nums" style={{ color }}>
            {value}
          </span>
          <span className="text-[10px] text-text-secondary">/10</span>
        </div>
      </div>
      <p className="text-xs font-semibold text-text-primary">{label}</p>
      {sublabel && <p className="text-[11px] text-text-secondary">{sublabel}</p>}
    </div>
  )
}

// ─── LogModal ─────────────────────────────────────────────────────────────────

interface LogModalProps {
  onClose: () => void
  onSaved: () => void
}

function LogModal({ onClose, onSaved }: LogModalProps) {
  const [level, setLevel] = useState(5)
  const [tags, setTags] = useState<ContextTag[]>([])
  const [notes, setNotes] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const toggleTag = (tag: ContextTag) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = () => {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/stress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stress_level: level,
            context_tags: tags,
            notes: notes.trim() || undefined,
          }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          setError((json as { error?: string }).error ?? 'Failed to save. Please try again.')
          return
        }
        onSaved()
        onClose()
      } catch {
        setError('Network error — please try again.')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-sm bg-background border border-border rounded-2xl p-6 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-primary">Log Stress</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Stress level slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-text-primary">Stress Level</label>
            <span className="text-2xl font-bold tabular-nums" style={{ color: stressColor(level) }}>
              {level}
              <span className="text-sm text-text-secondary font-normal"> / 10</span>
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{ accentColor: stressColor(level) }}
            aria-label="Stress level slider"
          />
          <div className="flex justify-between text-xs">
            <span className="text-text-secondary">Low</span>
            <span className="font-semibold" style={{ color: stressColor(level) }}>
              {stressLabel(level)}
            </span>
            <span className="text-text-secondary">High</span>
          </div>
        </div>

        {/* Context tags */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">Context</label>
          <div className="flex flex-wrap gap-2">
            {CONTEXT_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize',
                  tags.includes(tag)
                    ? 'bg-violet-600 text-white'
                    : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary">
            Notes{' '}
            <span className="text-text-secondary font-normal">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What's contributing to your stress?"
            rows={2}
            maxLength={500}
            className="w-full px-3 py-2 text-sm bg-surface-secondary border border-border rounded-lg text-text-primary placeholder:text-text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-xs text-red-500">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          {isPending ? 'Saving…' : 'Save Stress Log'}
        </button>
      </div>
    </div>
  )
}

// ─── Trend chart tooltip ──────────────────────────────────────────────────────

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-border rounded-lg p-2.5 shadow-lg text-sm min-w-[140px]">
      <p className="text-xs font-semibold text-text-primary mb-1.5">{label}</p>
      {payload.map(
        (p) =>
          p.value != null && (
            <p key={p.name} className="tabular-nums text-xs text-text-secondary">
              {p.name}:{' '}
              <span className="font-semibold" style={{ color: p.color }}>
                {p.value}
              </span>
            </p>
          )
      )}
    </div>
  )
}

// ─── TrendChart ───────────────────────────────────────────────────────────────

function TrendChart({ trend, days }: { trend: TrendPoint[]; days: 7 | 30 }) {
  const sliced = days === 7 ? trend.slice(-7) : trend.slice(-30)
  const data = sliced.map((p) => ({ ...p, date: fmtDate(p.date) }))

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <Brain className="w-8 h-8 text-text-secondary/40" />
        <p className="text-sm text-text-secondary">No stress data in this period</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={data} margin={{ top: 5, right: 10, left: -22, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #334155)" opacity={0.4} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #94a3b8)' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 10]}
          ticks={[0, 2, 4, 6, 8, 10]}
          tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #94a3b8)' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<TrendTooltip />} />
        {/* Zone markers */}
        <ReferenceLine y={3} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.35} />
        <ReferenceLine y={6} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.35} />
        {/* HRV-derived stress — dashed violet line */}
        <Line
          type="monotone"
          dataKey="hrv_derived_stress"
          name="HRV-Derived"
          stroke="#8b5cf6"
          strokeWidth={2}
          strokeDasharray="4 2"
          dot={false}
          connectNulls
        />
        {/* Manual stress — solid amber line with dots */}
        <Line
          type="monotone"
          dataKey="avg_stress"
          name="Manual"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
          connectNulls={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

// ─── CorrelationCard ──────────────────────────────────────────────────────────

const STRENGTH_CONFIG: Record<
  string,
  { color: string; bg: string; border: string }
> = {
  negligible: {
    color: 'text-gray-500 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-800/40',
    border: 'border-gray-200 dark:border-gray-700',
  },
  weak: {
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-900/50',
  },
  moderate: {
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-900/50',
  },
  strong: {
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-900/50',
  },
  very_strong: {
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-300 dark:border-red-800/50',
  },
  insufficient_data: {
    color: 'text-gray-400',
    bg: 'bg-surface-secondary',
    border: 'border-border',
  },
}

function CorrelationCard({ correlation }: { correlation: CorrelationData }) {
  const { r, strength, interpretation, n } = correlation
  const cfg = STRENGTH_CONFIG[strength] ?? STRENGTH_CONFIG.insufficient_data

  return (
    <div className={cn('rounded-2xl border p-4 space-y-3', cfg.bg, cfg.border)}>
      <div className="flex items-center gap-2">
        <Moon className="w-4 h-4 text-text-secondary shrink-0" />
        <span className="text-sm font-semibold text-text-primary">Stress vs Sleep</span>
        {n > 0 && (
          <span className="ml-auto text-xs text-text-secondary tabular-nums">{n} days</span>
        )}
      </div>

      {r !== null ? (
        <>
          <div className="flex items-baseline gap-2">
            <span className={cn('text-2xl font-bold tabular-nums', cfg.color)}>
              {r >= 0 ? '+' : ''}
              {r.toFixed(2)}
            </span>
            <span className="text-xs text-text-secondary capitalize">
              {strength.replace('_', ' ')} correlation
            </span>
          </div>
          <p className="text-sm text-text-secondary leading-snug">{interpretation}</p>
        </>
      ) : (
        <p className="text-sm text-text-secondary leading-snug">{interpretation}</p>
      )}
    </div>
  )
}

// ─── ContextTagsCloud ─────────────────────────────────────────────────────────

function ContextTagsCloud({ frequencies }: { frequencies: Record<string, number> }) {
  const presentTags = CONTEXT_TAGS.filter((t) => (frequencies[t] ?? 0) > 0)
  const maxFreq = Math.max(...presentTags.map((t) => frequencies[t] ?? 0), 1)

  if (presentTags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 gap-2">
        <Tag className="w-7 h-7 text-text-secondary/40" />
        <p className="text-xs text-text-secondary text-center">
          Tag your stress logs to see context patterns here
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2 py-1 justify-center">
      {presentTags.map((tag) => {
        const freq = frequencies[tag] ?? 0
        const scale = 0.72 + (freq / maxFreq) * 0.56
        const opacity = 0.55 + (freq / maxFreq) * 0.45
        return (
          <div
            key={tag}
            className="px-3 py-1 rounded-full bg-background border border-border capitalize font-medium text-text-primary select-none transition-transform hover:scale-105"
            style={{ fontSize: `${scale}rem`, opacity }}
            title={`${freq} log${freq !== 1 ? 's' : ''}`}
          >
            {tag}
            <span className="ml-1 text-[10px] text-text-secondary">×{freq}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Skeleton placeholder ─────────────────────────────────────────────────────

function GaugePlaceholder({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="bg-surface-secondary rounded-2xl p-4 flex flex-col items-center justify-center gap-2 min-h-[160px]">
      <Icon className="w-8 h-8 text-text-secondary/40" />
      <p className="text-xs text-text-secondary text-center leading-snug">{text}</p>
    </div>
  )
}

// ─── StressClient ─────────────────────────────────────────────────────────────

export function StressClient({ data }: { data: StressPageData }) {
  const [showModal, setShowModal] = useState(false)
  const [chartDays, setChartDays] = useState<7 | 30>(7)
  const [refreshKey, setRefreshKey] = useState(0)

  const { today, trend, correlation, contextFrequencies } = data

  // Suppress unused variable warning for refreshKey; it's used as a re-render trigger
  void refreshKey

  return (
    <>
      {showModal && (
        <LogModal
          onClose={() => setShowModal(false)}
          onSaved={() => setRefreshKey((k) => k + 1)}
        />
      )}

      <div className="space-y-5">
        {/* ── Header row ── */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Today&apos;s Stress</h2>
            <p className="text-sm text-text-secondary">
              {today.logCount > 0
                ? `${today.logCount} manual log${today.logCount !== 1 ? 's' : ''} today`
                : 'No manual logs today'}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Log Stress
          </button>
        </div>

        {/* ── Gauges ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {today.latestManual ? (
            <div className="bg-surface-secondary rounded-2xl p-4 flex justify-center">
              <StressGauge
                value={today.latestManual.stress_level}
                label="Manual"
                sublabel="Latest log"
              />
            </div>
          ) : (
            <GaugePlaceholder
              icon={Brain}
              text="Log your stress to see today's reading"
            />
          )}

          {today.hrvDerived ? (
            <div className="bg-surface-secondary rounded-2xl p-4 flex justify-center">
              <StressGauge
                value={today.hrvDerived.stress_level}
                label="HRV-Derived"
                sublabel={`HRV: ${today.hrvDerived.hrv_input}ms`}
              />
            </div>
          ) : (
            <GaugePlaceholder
              icon={Activity}
              text="HRV data needed for an estimate"
            />
          )}

          {today.dailyAverage != null ? (
            <div className="col-span-2 sm:col-span-1 bg-surface-secondary rounded-2xl p-4 flex justify-center">
              <StressGauge
                value={Math.round(today.dailyAverage)}
                label="Daily Avg"
                sublabel={`${today.logCount} log${today.logCount !== 1 ? 's' : ''}`}
              />
            </div>
          ) : (
            <div className="col-span-2 sm:col-span-1 bg-surface-secondary rounded-2xl p-4 flex flex-col items-center justify-center gap-2 min-h-[160px]">
              <TrendingUp className="w-7 h-7 text-text-secondary/40" />
              <p className="text-xs text-text-secondary text-center">
                Log multiple times a day for a daily average
              </p>
            </div>
          )}
        </div>

        {/* ── Trend chart ── */}
        <div className="bg-surface-secondary rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-text-secondary" />
              <h3 className="text-sm font-semibold text-text-primary">Stress Trend</h3>
            </div>
            <div className="flex gap-1 bg-background rounded-lg p-0.5 border border-border">
              {([7, 30] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setChartDays(d)}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                    chartDays === d
                      ? 'bg-violet-600 text-white'
                      : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          <TrendChart trend={trend} days={chartDays} />

          {/* Legend */}
          <div className="flex items-center gap-5 text-xs text-text-secondary">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 bg-amber-400 rounded" />
              <span>Manual logs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-5 h-0.5 rounded"
                style={{
                  background: '#8b5cf6',
                  backgroundImage:
                    'repeating-linear-gradient(90deg, #8b5cf6 0, #8b5cf6 4px, transparent 4px, transparent 6px)',
                }}
              />
              <span>HRV-derived</span>
            </div>
          </div>
        </div>

        {/* ── Bottom row: Correlation + Context Tags ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CorrelationCard correlation={correlation} />

          <div className="bg-surface-secondary rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-text-secondary" />
              <h3 className="text-sm font-semibold text-text-primary">Stress Contexts</h3>
              <span className="ml-auto text-xs text-text-secondary">30 days</span>
            </div>
            <ContextTagsCloud frequencies={contextFrequencies} />
          </div>
        </div>
      </div>
    </>
  )
}
