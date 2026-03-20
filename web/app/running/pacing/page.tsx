'use client'

import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Activity, BarChart2, FlaskConical } from 'lucide-react'
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
  LineChart,
  Line,
} from 'recharts'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface RunRecord {
  id: number
  date: string          // YYYY-MM-DD
  distanceKm: number
  firstHalfPaceSecs: number   // seconds per km
  secondHalfPaceSecs: number  // seconds per km (lower = faster)
  paceCV: number        // coefficient of variation %
  isNegativeSplit: boolean
  splitDeltaSecs: number      // second half minus first half pace (negative = negative split = faster)
  speedSamples: number[]      // 8 equally-spaced speed samples (km/h) for sparkline
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const RUNS: RunRecord[] = [
  // Run 1 — Jan 6, 8.2 km, negative split ✓
  {
    id: 1,
    date: '2026-01-06',
    distanceKm: 8.2,
    firstHalfPaceSecs: 325, // 5:25/km
    secondHalfPaceSecs: 308, // 5:08/km  → negative split
    paceCV: 4.1,
    isNegativeSplit: true,
    splitDeltaSecs: -17,
    speedSamples: [10.8, 10.9, 11.1, 11.3, 11.5, 11.6, 11.8, 11.9],
  },
  // Run 2 — Jan 10, 5.5 km, positive split
  {
    id: 2,
    date: '2026-01-10',
    distanceKm: 5.5,
    firstHalfPaceSecs: 282, // 4:42/km
    secondHalfPaceSecs: 305, // 5:05/km  → positive split
    paceCV: 6.7,
    isNegativeSplit: false,
    splitDeltaSecs: 23,
    speedSamples: [12.8, 12.5, 12.3, 12.0, 11.8, 11.6, 11.4, 11.7],
  },
  // Run 3 — Jan 14, 12.0 km, negative split ✓
  {
    id: 3,
    date: '2026-01-14',
    distanceKm: 12.0,
    firstHalfPaceSecs: 348, // 5:48/km
    secondHalfPaceSecs: 335, // 5:35/km  → negative split
    paceCV: 3.4,
    isNegativeSplit: true,
    splitDeltaSecs: -13,
    speedSamples: [10.2, 10.3, 10.4, 10.5, 10.7, 10.9, 11.0, 11.1],
  },
  // Run 4 — Jan 17, 7.0 km, positive split
  {
    id: 4,
    date: '2026-01-17',
    distanceKm: 7.0,
    firstHalfPaceSecs: 295, // 4:55/km
    secondHalfPaceSecs: 320, // 5:20/km  → positive split
    paceCV: 7.9,
    isNegativeSplit: false,
    splitDeltaSecs: 25,
    speedSamples: [12.2, 12.0, 11.7, 11.5, 11.2, 11.0, 10.9, 11.2],
  },
  // Run 5 — Jan 21, 9.5 km, negative split ✓
  {
    id: 5,
    date: '2026-01-21',
    distanceKm: 9.5,
    firstHalfPaceSecs: 318, // 5:18/km
    secondHalfPaceSecs: 303, // 5:03/km  → negative split
    paceCV: 3.8,
    isNegativeSplit: true,
    splitDeltaSecs: -15,
    speedSamples: [11.2, 11.3, 11.5, 11.6, 11.8, 12.0, 12.1, 12.2],
  },
  // Run 6 — Jan 25, 6.0 km, negative split ✓
  {
    id: 6,
    date: '2026-01-25',
    distanceKm: 6.0,
    firstHalfPaceSecs: 300, // 5:00/km
    secondHalfPaceSecs: 290, // 4:50/km  → negative split
    paceCV: 3.1,
    isNegativeSplit: true,
    splitDeltaSecs: -10,
    speedSamples: [12.0, 12.0, 12.1, 12.2, 12.3, 12.5, 12.6, 12.5],
  },
  // Run 7 — Jan 29, 14.5 km, negative split ✓
  {
    id: 7,
    date: '2026-01-29',
    distanceKm: 14.5,
    firstHalfPaceSecs: 355, // 5:55/km
    secondHalfPaceSecs: 342, // 5:42/km  → negative split
    paceCV: 3.6,
    isNegativeSplit: true,
    splitDeltaSecs: -13,
    speedSamples: [9.9, 10.0, 10.1, 10.2, 10.4, 10.6, 10.7, 10.8],
  },
  // Run 8 — Feb 2, 5.0 km, positive split
  {
    id: 8,
    date: '2026-02-02',
    distanceKm: 5.0,
    firstHalfPaceSecs: 270, // 4:30/km
    secondHalfPaceSecs: 289, // 4:49/km  → positive split
    paceCV: 9.8,
    isNegativeSplit: false,
    splitDeltaSecs: 19,
    speedSamples: [13.3, 13.0, 12.7, 12.4, 12.1, 11.9, 11.8, 12.0],
  },
  // Run 9 — Feb 6, 10.0 km, negative split ✓
  {
    id: 9,
    date: '2026-02-06',
    distanceKm: 10.0,
    firstHalfPaceSecs: 310, // 5:10/km
    secondHalfPaceSecs: 296, // 4:56/km  → negative split
    paceCV: 4.4,
    isNegativeSplit: true,
    splitDeltaSecs: -14,
    speedSamples: [11.5, 11.6, 11.7, 11.8, 12.0, 12.2, 12.3, 12.5],
  },
  // Run 10 — Feb 10, 8.0 km, negative split ✓
  {
    id: 10,
    date: '2026-02-10',
    distanceKm: 8.0,
    firstHalfPaceSecs: 322, // 5:22/km
    secondHalfPaceSecs: 306, // 5:06/km  → negative split
    paceCV: 4.9,
    isNegativeSplit: true,
    splitDeltaSecs: -16,
    speedSamples: [11.0, 11.2, 11.3, 11.5, 11.7, 11.9, 12.0, 12.2],
  },
  // Run 11 — Feb 14, 6.8 km, positive split
  {
    id: 11,
    date: '2026-02-14',
    distanceKm: 6.8,
    firstHalfPaceSecs: 288, // 4:48/km
    secondHalfPaceSecs: 302, // 5:02/km  → positive split
    paceCV: 5.3,
    isNegativeSplit: false,
    splitDeltaSecs: 14,
    speedSamples: [12.5, 12.3, 12.1, 11.9, 11.8, 11.7, 11.8, 11.9],
  },
  // Run 12 — Feb 18, 11.0 km, negative split ✓
  {
    id: 12,
    date: '2026-02-18',
    distanceKm: 11.0,
    firstHalfPaceSecs: 335, // 5:35/km
    secondHalfPaceSecs: 318, // 5:18/km  → negative split
    paceCV: 4.2,
    isNegativeSplit: true,
    splitDeltaSecs: -17,
    speedSamples: [10.6, 10.7, 10.8, 11.0, 11.2, 11.4, 11.5, 11.7],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPace(secs: number): string {
  const min = Math.floor(secs / 60)
  const sec = Math.round(secs % 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

function fmtDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function cvRating(cv: number): { label: string; color: string } {
  if (cv < 3) return { label: 'Elite', color: 'text-purple-400' }
  if (cv < 5) return { label: 'Excellent', color: 'text-green-400' }
  if (cv < 7) return { label: 'Good', color: 'text-teal-400' }
  if (cv < 10) return { label: 'Moderate', color: 'text-yellow-400' }
  return { label: 'Variable', color: 'text-orange-400' }
}

// ─── Derived summary stats ─────────────────────────────────────────────────────

const negSplitCount = RUNS.filter((r) => r.isNegativeSplit).length
const negSplitPct = Math.round((negSplitCount / RUNS.length) * 100)
const avgCV = +(RUNS.reduce((s, r) => s + r.paceCV, 0) / RUNS.length).toFixed(1)
const overallCVRating = cvRating(avgCV)

// Last 10 runs for chart
const chartRuns = RUNS.slice(-10)
// Last 8 runs for table (newest first)
const tableRuns = [...RUNS].reverse().slice(0, 8)

// ─── Custom tooltip for split delta chart ─────────────────────────────────────

interface DeltaPayloadEntry {
  value: number
  payload: {
    date: string
    distanceKm: number
    splitDeltaSecs: number
    isNegativeSplit: boolean
  }
}

function DeltaTooltip({ active, payload }: { active?: boolean; payload?: DeltaPayloadEntry[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div
      style={{
        background: 'rgba(15,15,20,0.97)',
        border: '1px solid rgba(249,115,22,0.3)',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
        fontFamily: 'ui-monospace, monospace',
      }}
    >
      <p style={{ color: '#f97316', fontWeight: 700, marginBottom: 4 }}>{fmtDateShort(d.date)}</p>
      <p style={{ color: '#ccc' }}>{d.distanceKm.toFixed(1)} km</p>
      <p style={{ color: d.isNegativeSplit ? '#4ade80' : '#fb923c' }}>
        {d.isNegativeSplit ? '▲ Negative' : '▼ Positive'} split
      </p>
      <p style={{ color: '#aaa' }}>
        Δ {d.splitDeltaSecs > 0 ? '+' : ''}{d.splitDeltaSecs}s/km
      </p>
    </div>
  )
}

// ─── Mini sparkline for each run ──────────────────────────────────────────────

function Sparkline({ samples, isNegative }: { samples: number[]; isNegative: boolean }) {
  const data = samples.map((v, i) => ({ i, v }))
  return (
    <ResponsiveContainer width={72} height={28}>
      <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <Line
          dataKey="v"
          stroke={isNegative ? '#4ade80' : '#fb923c'}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RunningPacingPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/running"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to running"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <Activity className="w-5 h-5 text-orange-400 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-text-primary truncate">Running Pacing Analysis</h1>
              <p className="text-sm text-text-secondary truncate">
                Negative splits, pacing consistency &amp; within-run speed variation
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero Banner ── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 40%, #ea580c 70%, #f97316 100%)',
        }}
      >
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg,transparent,transparent 24px,rgba(255,255,255,0.3) 24px,rgba(255,255,255,0.3) 25px),' +
              'repeating-linear-gradient(90deg,transparent,transparent 24px,rgba(255,255,255,0.3) 24px,rgba(255,255,255,0.3) 25px)',
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 py-10">
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-2 opacity-80"
            style={{ color: '#fed7aa', fontFamily: 'ui-monospace, monospace' }}
          >
            Apple Watch · iOS 16+ · Instantaneous Speed
          </p>
          <h2
            className="text-3xl sm:text-4xl font-black text-white leading-tight mb-3"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
          >
            Pacing Analysis
          </h2>
          <p className="text-white/80 text-sm max-w-md leading-relaxed">
            Within-run speed variation tells you more than average pace. Negative splits
            signal exceptional pacing discipline and finishing strength.
          </p>
          {/* Decorative running track lines */}
          <div className="absolute right-0 top-0 bottom-0 w-32 opacity-20 hidden sm:flex flex-col justify-center gap-3 pr-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-px w-full"
                style={{ background: 'rgba(255,255,255,0.8)', transform: `scaleX(${0.4 + i * 0.12})`, transformOrigin: 'right' }}
              />
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-28 space-y-6">

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-3 gap-3">

          {/* Negative Split % */}
          <div className="bg-surface rounded-2xl border border-border p-4 flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-400" />
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <div>
              <p
                className="text-3xl font-black text-green-400 leading-none"
                style={{ fontFamily: 'ui-monospace, monospace' }}
              >
                {negSplitPct}%
              </p>
              <p className="text-xs font-medium text-text-primary mt-1">Negative Splits</p>
              <p className="text-xs text-text-secondary opacity-70 mt-0.5">
                {negSplitCount} of {RUNS.length} runs
              </p>
            </div>
          </div>

          {/* Pacing CV */}
          <div className="bg-surface rounded-2xl border border-border p-4 flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-500 to-cyan-400" />
            <BarChart2 className="w-5 h-5 text-teal-400" />
            <div>
              <p
                className="text-3xl font-black text-teal-400 leading-none"
                style={{ fontFamily: 'ui-monospace, monospace' }}
              >
                {avgCV}%
              </p>
              <p className="text-xs font-medium text-text-primary mt-1">Pacing CV</p>
              <p className={`text-xs font-semibold mt-0.5 ${overallCVRating.color}`}>
                {overallCVRating.label}
              </p>
            </div>
          </div>

          {/* Runs Analyzed */}
          <div className="bg-surface rounded-2xl border border-border p-4 flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-amber-400" />
            <Activity className="w-5 h-5 text-orange-400" />
            <div>
              <p
                className="text-3xl font-black text-orange-400 leading-none"
                style={{ fontFamily: 'ui-monospace, monospace' }}
              >
                {RUNS.length}
              </p>
              <p className="text-xs font-medium text-text-primary mt-1">Runs Analyzed</p>
              <p className="text-xs text-text-secondary opacity-70 mt-0.5">Last 6 weeks</p>
            </div>
          </div>
        </div>

        {/* ── Split Delta Chart ── */}
        <div className="bg-surface rounded-2xl border border-border p-5">
          <div className="mb-1">
            <h2 className="text-sm font-semibold text-text-primary">Split Delta — Last 10 Runs</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Above zero = positive split (started too fast). Below zero = negative split (strong finish).
            </p>
          </div>

          <div className="flex items-center gap-4 mb-4 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <div className="w-3 h-3 rounded-sm bg-green-500 opacity-80" />
              Negative split
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <div className="w-3 h-3 rounded-sm bg-orange-500 opacity-80" />
              Positive split
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={chartRuns}
              margin={{ top: 8, right: 4, left: -16, bottom: 0 }}
              barCategoryGap="30%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={fmtDateShort}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)', fontFamily: 'ui-monospace,monospace' }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={40}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)', fontFamily: 'ui-monospace,monospace' }}
                tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v}s`}
                domain={[-20, 30]}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<DeltaTooltip />} cursor={{ fill: 'rgba(249,115,22,0.05)' }} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} />
              <Bar dataKey="splitDeltaSecs" radius={[3, 3, 0, 0]} maxBarSize={32}>
                {chartRuns.map((run) => (
                  <Cell
                    key={run.id}
                    fill={run.isNegativeSplit ? '#4ade80' : '#f97316'}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Recent Runs Table ── */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">Recent Runs</h2>
            <p className="text-xs text-text-secondary mt-0.5">Half-split pacing for last 8 runs</p>
          </div>

          {/* Desktop header */}
          <div className="hidden sm:grid grid-cols-[1fr_2fr_1fr_1fr_72px] gap-x-3 px-5 py-2 border-b border-border">
            {['Date / Distance', '1st Half → 2nd Half', 'Δ s/km', 'CV %', 'Speed'].map((h) => (
              <p key={h} className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                {h}
              </p>
            ))}
          </div>

          <div className="divide-y divide-border">
            {tableRuns.map((run) => {
              const rating = cvRating(run.paceCV)
              return (
                <div
                  key={run.id}
                  className="px-5 py-3 sm:grid sm:grid-cols-[1fr_2fr_1fr_1fr_72px] sm:gap-x-3 sm:items-center flex flex-wrap gap-x-3 gap-y-1"
                >
                  {/* Date + distance */}
                  <div>
                    <p className="text-xs font-semibold text-text-primary">{fmtDateShort(run.date)}</p>
                    <p className="text-xs text-text-secondary">{run.distanceKm.toFixed(1)} km</p>
                  </div>

                  {/* Split paces */}
                  <div
                    className="flex items-center gap-1 text-xs"
                    style={{ fontFamily: 'ui-monospace, monospace' }}
                  >
                    <span className="text-text-primary">{fmtPace(run.firstHalfPaceSecs)}</span>
                    <span className="text-text-secondary opacity-50 mx-0.5">→</span>
                    <span className={run.isNegativeSplit ? 'text-green-400 font-semibold' : 'text-orange-400 font-semibold'}>
                      {fmtPace(run.secondHalfPaceSecs)}
                    </span>
                    <span className="text-text-secondary opacity-50 ml-0.5">/km</span>
                  </div>

                  {/* Split delta */}
                  <div>
                    <span
                      className={`text-xs font-bold ${run.isNegativeSplit ? 'text-green-400' : 'text-orange-400'}`}
                      style={{ fontFamily: 'ui-monospace, monospace' }}
                    >
                      {run.splitDeltaSecs > 0 ? '+' : ''}{run.splitDeltaSecs}s
                    </span>
                  </div>

                  {/* CV */}
                  <div>
                    <span
                      className={`text-xs font-semibold ${rating.color}`}
                      style={{ fontFamily: 'ui-monospace, monospace' }}
                    >
                      {run.paceCV.toFixed(1)}%
                    </span>
                    <p className={`text-xs ${rating.color} opacity-70`}>{rating.label}</p>
                  </div>

                  {/* Sparkline */}
                  <div className="hidden sm:block">
                    <Sparkline samples={run.speedSamples} isNegative={run.isNegativeSplit} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Science Card ── */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div
            className="px-5 py-3 flex items-center gap-2 border-b border-border"
            style={{ background: 'rgba(249,115,22,0.06)' }}
          >
            <FlaskConical className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-semibold text-text-primary">The Science of Pacing</h2>
          </div>

          <div className="px-5 py-5 grid sm:grid-cols-2 gap-5 text-xs text-text-secondary leading-relaxed">

            <div className="space-y-3">
              <div>
                <p className="font-semibold text-text-primary mb-1">Negative Split Strategy</p>
                <p>
                  A negative split means the second half of your run is faster than the first. Elite
                  marathon runners consistently run the second half 30–90 seconds faster — arriving
                  at the finish line with glycogen reserves and full neuromuscular drive intact.
                  Starting conservatively avoids premature lactate accumulation and catastrophic
                  pace collapse.
                </p>
              </div>
              <div>
                <p className="font-semibold text-text-primary mb-1">Coefficient of Variation (CV)</p>
                <p>
                  CV = (standard deviation of pace ÷ mean pace) × 100. It captures overall pacing
                  smoothness across the entire run, independent of average speed. A lower CV means
                  you held pace more consistently — less wasted anaerobic effort in surges,
                  better energy economy overall.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="font-semibold text-text-primary mb-1">CV Benchmarks</p>
                <div className="space-y-1.5">
                  {[
                    { label: 'Elite runners', range: '< 3%', color: 'text-purple-400' },
                    { label: 'Well-trained', range: '3 – 5%', color: 'text-green-400' },
                    { label: 'Recreational', range: '5 – 7%', color: 'text-teal-400' },
                    { label: 'Developing', range: '7 – 10%', color: 'text-yellow-400' },
                    { label: 'Very variable', range: '> 10%', color: 'text-orange-400' },
                  ].map(({ label, range, color }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className={`font-medium ${color}`}>{label}</span>
                      <span
                        className="text-text-secondary"
                        style={{ fontFamily: 'ui-monospace, monospace' }}
                      >
                        {range}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-semibold text-orange-400 mb-1">Apple Watch Data Source</p>
                <p>
                  iOS 16+ exposes instantaneous running speed via HealthKit, sampled ~1 Hz. KQuarks
                  slices each run at the midpoint to compute half-splits, then calculates CV from
                  the full speed series. GPS accuracy affects outdoor precision; treadmill data uses
                  accelerometer estimation.
                </p>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
