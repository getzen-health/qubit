'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, Brain } from 'lucide-react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts'

// ─── Constants ────────────────────────────────────────────────────────────────

const POSITIVE_LABELS = new Set([
  'Calm',
  'Grateful',
  'Joyful',
  'Content',
  'Hopeful',
  'Proud',
  'Peaceful',
])

const NEGATIVE_LABELS = new Set([
  'Stressed',
  'Anxious',
  'Sad',
  'Irritated',
  'Overwhelmed',
])

const VALENCE_COLOR = {
  positive: '#22c55e',
  negative: '#ef4444',
  neutral: '#6b7280',
}

const ASSOCIATION_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#64748b',
]

const TOOLTIP_STYLE = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Seed-based PRNG (deterministic mock data) ────────────────────────────────

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface MindEntry {
  date: string
  dayIndex: number     // 0 = oldest
  valence: number      // -1 to +1
  kind: 'momentary' | 'daily'
  label: string
  association: string
}

// ─── Mock data generator ──────────────────────────────────────────────────────

const EMOTION_POOL: { label: string; valence: [number, number] }[] = [
  { label: 'Calm',        valence: [0.3, 0.7]  },
  { label: 'Grateful',    valence: [0.5, 0.9]  },
  { label: 'Joyful',      valence: [0.6, 0.9]  },
  { label: 'Content',     valence: [0.2, 0.6]  },
  { label: 'Hopeful',     valence: [0.3, 0.7]  },
  { label: 'Proud',       valence: [0.4, 0.8]  },
  { label: 'Peaceful',    valence: [0.3, 0.65] },
  { label: 'Stressed',    valence: [-0.8, -0.3] },
  { label: 'Anxious',     valence: [-0.75, -0.25] },
  { label: 'Sad',         valence: [-0.7, -0.2] },
  { label: 'Irritated',   valence: [-0.6, -0.1] },
  { label: 'Overwhelmed', valence: [-0.8, -0.35] },
]

const ASSOCIATIONS = ['Work', 'Family', 'Fitness', 'Health', 'Hobbies', 'Other']

function generateMockData(): MindEntry[] {
  const rand = seededRandom(20260319)
  const entries: MindEntry[] = []
  const today = new Date('2026-03-19')

  for (let dayIdx = 0; dayIdx < 30; dayIdx++) {
    const d = new Date(today)
    d.setDate(today.getDate() - (29 - dayIdx))
    const dateStr = d.toISOString().split('T')[0]

    // 1–2 entries per day; some days have only a daily check-in, others also a momentary
    const numEntries = rand() < 0.4 ? 1 : 2

    for (let e = 0; e < numEntries; e++) {
      const kind: 'momentary' | 'daily' = e === 0 ? 'daily' : 'momentary'

      // Pick emotion
      const emotionIdx = Math.floor(rand() * EMOTION_POOL.length)
      const emotion = EMOTION_POOL[emotionIdx]

      const [vMin, vMax] = emotion.valence
      const valence = +(vMin + rand() * (vMax - vMin)).toFixed(2)

      // Association — weighted
      const assocWeights = [0.28, 0.20, 0.18, 0.15, 0.12, 0.07]
      let assocR = rand()
      let assocIdx = 0
      for (let i = 0; i < assocWeights.length; i++) {
        assocR -= assocWeights[i]
        if (assocR <= 0) { assocIdx = i; break }
      }

      entries.push({
        date: dateStr,
        dayIndex: dayIdx,
        valence,
        kind,
        label: emotion.label,
        association: ASSOCIATIONS[assocIdx],
      })
    }
  }

  return entries
}

// ─── Rolling average ──────────────────────────────────────────────────────────

function rollingAvg(
  data: { dayIndex: number; valence: number }[],
  window: number
): { dayIndex: number; avg: number }[] {
  const byDay = new Map<number, number[]>()
  for (const d of data) {
    if (!byDay.has(d.dayIndex)) byDay.set(d.dayIndex, [])
    byDay.get(d.dayIndex)!.push(d.valence)
  }

  const sorted = Array.from(byDay.entries()).sort(([a], [b]) => a - b)
  const result: { dayIndex: number; avg: number }[] = []

  for (let i = 0; i < sorted.length; i++) {
    const [idx] = sorted[i]
    const windowEntries = sorted
      .filter(([di]) => di > idx - window && di <= idx)
      .flatMap(([, vals]) => vals)
    if (windowEntries.length === 0) continue
    const avg = windowEntries.reduce((s, v) => s + v, 0) / windowEntries.length
    result.push({ dayIndex: idx, avg: +avg.toFixed(3) })
  }

  return result
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function valenceLabel(v: number): string {
  if (v >= 0.6) return 'Very positive'
  if (v >= 0.3) return 'Slightly positive'
  if (v >= 0.1) return 'Mildly positive'
  if (v > -0.1) return 'Neutral'
  if (v > -0.3) return 'Mildly negative'
  if (v > -0.6) return 'Slightly negative'
  return 'Very negative'
}

function valenceColor(v: number): string {
  if (v > 0.1) return VALENCE_COLOR.positive
  if (v < -0.1) return VALENCE_COLOR.negative
  return VALENCE_COLOR.neutral
}

function dayLabel(idx: number): string {
  const d = new Date('2026-03-19')
  d.setDate(d.getDate() - (29 - idx))
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Custom Pie label ─────────────────────────────────────────────────────────

interface PieLabelProps {
  cx: number
  cy: number
  midAngle: number
  outerRadius: number
  percent: number
  name: string
}

function renderPieLabel({ cx, cy, midAngle, outerRadius, percent, name }: PieLabelProps) {
  if (percent < 0.05) return null
  const RADIAN = Math.PI / 180
  const radius = outerRadius + 20
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text
      x={x}
      y={y}
      fill="var(--color-text-secondary, #9ca3af)"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={11}
    >
      {name} {Math.round(percent * 100)}%
    </text>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StateOfMindPage() {
  const entries = useMemo(() => generateMockData(), [])

  // ── Summary stats ────────────────────────────────────────────────────────────
  const avgValence = useMemo(() => {
    const sum = entries.reduce((s, e) => s + e.valence, 0)
    return +(sum / entries.length).toFixed(2)
  }, [entries])

  const logCount = entries.length
  const dailyCount = useMemo(() => entries.filter((e) => e.kind === 'daily').length, [entries])

  // ── Scatter + rolling avg for 30-day chart ────────────────────────────────
  const scatterData = useMemo(
    () => entries.map((e) => ({ dayIndex: e.dayIndex, valence: e.valence, date: e.date })),
    [entries]
  )
  const rollingData = useMemo(() => rollingAvg(entries, 7), [entries])

  // ── Emotional label frequency ─────────────────────────────────────────────
  const labelFreq = useMemo(() => {
    const counts = new Map<string, number>()
    for (const e of entries) {
      counts.set(e.label, (counts.get(e.label) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([label, count]) => ({
        label,
        count,
        positive: POSITIVE_LABELS.has(label),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [entries])

  // ── Association breakdown ─────────────────────────────────────────────────
  const assocData = useMemo(() => {
    const counts = new Map<string, number>()
    for (const e of entries) {
      counts.set(e.association, (counts.get(e.association) ?? 0) + 1)
    }
    return ASSOCIATIONS.map((name, i) => ({
      name,
      value: counts.get(name) ?? 0,
      fill: ASSOCIATION_COLORS[i],
    })).filter((d) => d.value > 0)
  }, [entries])

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">State of Mind</h1>
            <p className="text-sm text-text-secondary">iOS 18+ | Emotional wellbeing tracking from Apple Health</p>
          </div>
          <Brain className="w-5 h-5 text-text-secondary" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface rounded-2xl border border-border p-4 text-center">
            <p
              className="text-2xl font-bold tabular-nums"
              style={{ color: valenceColor(avgValence) }}
            >
              {avgValence > 0 ? '+' : ''}{avgValence}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Avg Valence</p>
            <p className="text-xs font-medium mt-1" style={{ color: valenceColor(avgValence) }}>
              {valenceLabel(avgValence)}
            </p>
          </div>
          <div className="bg-surface rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-indigo-400 tabular-nums">{logCount}</p>
            <p className="text-xs text-text-secondary mt-0.5">Log Count</p>
            <p className="text-xs text-text-secondary mt-1">Last 30 days</p>
          </div>
          <div className="bg-surface rounded-2xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-violet-400 tabular-nums">{dailyCount}</p>
            <p className="text-xs text-text-secondary mt-0.5">Daily Check-ins</p>
            <p className="text-xs text-text-secondary mt-1">Momentary: {logCount - dailyCount}</p>
          </div>
        </div>

        {/* ── 30-day valence scatter + rolling avg ── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-text-secondary">30-Day Valence Trend</h3>
            <div className="flex items-center gap-4 text-xs text-text-secondary">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded-full bg-indigo-400 inline-block" />
                7-day avg
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                Positive
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                Negative
              </span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <ScatterChart margin={{ top: 8, right: 8, left: -8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />

              {/* Green positive zone */}
              <defs>
                <linearGradient id="positiveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="negativeGrad" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <XAxis
                type="number"
                dataKey="dayIndex"
                domain={[0, 29]}
                tickFormatter={(v: number) => dayLabel(v)}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                type="number"
                dataKey="valence"
                domain={[-1, 1]}
                tickFormatter={(v: number) => (v > 0 ? `+${v}` : String(v))}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                width={36}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value: number, name: string) => {
                  if (name === 'valence') return [`${value > 0 ? '+' : ''}${value}`, 'Valence']
                  return [value, name]
                }}
                labelFormatter={(label: number) => dayLabel(label)}
              />
              <ReferenceLine
                y={0}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={1}
                strokeDasharray="4 3"
              />
              {/* Scatter dots colored by valence */}
              <Scatter
                name="valence"
                data={scatterData}
                shape={(props: { cx?: number; cy?: number; payload?: Record<string, number> }) => {
                  const { cx, cy, payload } = props
                  const color = valenceColor(payload.valence)
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={color}
                      fillOpacity={0.8}
                      stroke={color}
                      strokeWidth={1}
                    />
                  )
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>

          {/* Rolling avg overlay — separate LineChart overlapping */}
          <div className="-mt-[240px] pointer-events-none" aria-hidden="true">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart
                data={rollingData}
                margin={{ top: 8, right: 8, left: -8, bottom: 4 }}
              >
                <XAxis
                  dataKey="dayIndex"
                  domain={[0, 29]}
                  type="number"
                  hide
                />
                <YAxis domain={[-1, 1]} hide />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="#818cf8"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Emotional label frequency bar chart ── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            Top 10 Emotional Labels
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={labelFreq}
              layout="vertical"
              margin={{ top: 4, right: 20, left: 4, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
                width={72}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v: number, _: string, props: { payload?: { note?: string } }) => [
                  `${v} entries`,
                  props.payload.positive ? 'Positive' : 'Negative',
                ]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={16}>
                {labelFreq.map((entry) => (
                  <Cell
                    key={entry.label}
                    fill={entry.positive ? VALENCE_COLOR.positive : VALENCE_COLOR.negative}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" />
              Positive (calm, grateful, joyful…)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" />
              Negative (stressed, anxious…)
            </span>
          </div>
        </div>

        {/* ── Association donut chart ── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            Life-Area Associations
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <ResponsiveContainer width={220} height={220}>
              <PieChart>
                <Pie
                  data={assocData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                  label={renderPieLabel as any}
                >
                  {assocData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v: number, name: string) => [
                    `${v} entries (${Math.round((v / logCount) * 100)}%)`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex flex-col gap-2 flex-1">
              {assocData.map((d) => (
                <div key={d.name} className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: d.fill }}
                  />
                  <span className="text-sm text-text-secondary w-16 shrink-0">{d.name}</span>
                  <div className="flex-1 bg-surface-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round((d.value / logCount) * 100)}%`,
                        backgroundColor: d.fill,
                      }}
                    />
                  </div>
                  <span className="text-xs text-text-secondary w-8 text-right tabular-nums">
                    {Math.round((d.value / logCount) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Science section ── */}
        <div className="bg-surface rounded-2xl border border-indigo-500/30 p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-violet-600/5 pointer-events-none" />
          <div className="relative space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-400" />
              <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">
                The Science
              </h3>
            </div>

            <div className="space-y-3 text-sm text-text-secondary leading-relaxed">
              <p>
                <span className="font-medium text-text-primary">HKStateOfMind</span> was introduced
                in iOS 18 (2024). It lets Apple Health record two distinct entry kinds: a
                "momentary emotion" (how you feel right now) and a "daily mood" (your overall tone
                for the day). Each entry carries a valence score, one or more emotional label
                descriptors, and optional life-area associations.
              </p>

              <p>
                <span className="font-medium text-text-primary">Valence</span> is a scalar ranging
                from −1 (extremely negative) to +1 (extremely positive). The concept originates
                from Russell's (1980) circumplex model of affect, which maps all emotional
                experience onto two orthogonal axes: valence (pleasant–unpleasant) and arousal
                (activated–deactivated). Apple Health captures the valence dimension of this model
                in a standardised, continuous form.
              </p>

              <p>
                <span className="font-medium text-text-primary">Why it matters physiologically:</span>{' '}
                Chronic negative valence is associated with elevated cortisol, suppressed HRV,
                and systemic low-grade inflammation. Longitudinal studies (Cohen et al., 2003;
                Pressman & Cohen, 2005) show that sustained positive affect predicts lower
                allostatic load, faster wound healing, and reduced cardiovascular event risk,
                even after controlling for lifestyle factors.
              </p>
            </div>
          </div>
        </div>

        {/* ── How to log guide ── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-violet-400" />
            <h3 className="text-xs font-semibold text-violet-400 uppercase tracking-wide">
              How to Log State of Mind
            </h3>
          </div>
          <ol className="space-y-2 text-sm text-text-secondary">
            <li className="flex gap-2">
              <span className="text-violet-400 font-semibold shrink-0">1.</span>
              Open the <span className="font-medium text-text-primary">Health</span> app on your
              iPhone (iOS 18+).
            </li>
            <li className="flex gap-2">
              <span className="text-violet-400 font-semibold shrink-0">2.</span>
              Tap <span className="font-medium text-text-primary">Browse</span> at the bottom, then
              select <span className="font-medium text-text-primary">Mental Wellbeing</span>.
            </li>
            <li className="flex gap-2">
              <span className="text-violet-400 font-semibold shrink-0">3.</span>
              Tap <span className="font-medium text-text-primary">State of Mind</span> and follow
              the on-screen prompts to log your current emotion or daily mood.
            </li>
            <li className="flex gap-2">
              <span className="text-violet-400 font-semibold shrink-0">4.</span>
              Alternatively, ask <span className="font-medium text-text-primary">Siri</span>:{' '}
              <span className="italic">"Log my mood"</span> or tap a State of Mind{' '}
              <span className="font-medium text-text-primary">complication</span> on your Apple
              Watch face for a one-tap check-in.
            </li>
          </ol>
          <p className="text-xs text-text-secondary mt-3 border-t border-border pt-3">
            Tip: Apple Watch Ultra and Series 9+ prompt you for a daily mood log automatically
            each morning via a watch notification.
          </p>
        </div>

      </main>
    </div>
  )
}
