'use client'

import Link from 'next/link'
import { ArrowLeft, Heart, Info } from 'lucide-react'
import {
  ComposedChart,
  Scatter,
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
import { BottomNav } from '@/components/bottom-nav'

// ─── Mock data ────────────────────────────────────────────────────────────────

const AGE = 35
const OBSERVED_HRMAX = 192
const FOX = 220 - AGE                        // 185
const TANAKA = Math.round((208 - 0.7 * AGE) * 10) / 10   // 183.5
const GELLISH = Math.round((207 - 0.7 * AGE) * 10) / 10  // 182.5
const NES = Math.round((211 - 0.64 * AGE) * 10) / 10     // 188.6

// Sport colour palette
const SPORT_COLORS: Record<string, string> = {
  Running: '#f97316',
  Cycling: '#3b82f6',
  HIIT: '#ef4444',
  Hiking: '#22c55e',
  Walking: '#a855f7',
}

// 12-month scatter data — each point is one workout session
const SCATTER_DATA = [
  // Running
  { date: 'Mar 19', peakHR: 178, sport: 'Running' },
  { date: 'Mar 26', peakHR: 183, sport: 'Running' },
  { date: 'Apr 8',  peakHR: 186, sport: 'Running' },
  { date: 'Apr 22', peakHR: 181, sport: 'Running' },
  { date: 'May 5',  peakHR: 188, sport: 'Running' },
  { date: 'May 18', peakHR: 185, sport: 'Running' },
  { date: 'Jun 3',  peakHR: 190, sport: 'Running' },
  { date: 'Jun 17', peakHR: 182, sport: 'Running' },
  { date: 'Jul 4',  peakHR: 187, sport: 'Running' },
  { date: 'Jul 22', peakHR: 179, sport: 'Running' },
  { date: 'Aug 9',  peakHR: 184, sport: 'Running' },
  { date: 'Sep 1',  peakHR: 189, sport: 'Running' },
  { date: 'Sep 20', peakHR: 185, sport: 'Running' },
  { date: 'Oct 8',  peakHR: 183, sport: 'Running' },
  { date: 'Nov 3',  peakHR: 187, sport: 'Running' },
  { date: 'Dec 1',  peakHR: 180, sport: 'Running' },
  { date: 'Jan 14', peakHR: 186, sport: 'Running' },
  { date: 'Feb 2',  peakHR: 184, sport: 'Running' },
  { date: 'Mar 5',  peakHR: 188, sport: 'Running' },
  // Cycling
  { date: 'Mar 30', peakHR: 172, sport: 'Cycling' },
  { date: 'Apr 15', peakHR: 175, sport: 'Cycling' },
  { date: 'May 10', peakHR: 178, sport: 'Cycling' },
  { date: 'Jun 5',  peakHR: 181, sport: 'Cycling' },
  { date: 'Jul 10', peakHR: 176, sport: 'Cycling' },
  { date: 'Aug 20', peakHR: 174, sport: 'Cycling' },
  { date: 'Oct 15', peakHR: 179, sport: 'Cycling' },
  { date: 'Dec 20', peakHR: 173, sport: 'Cycling' },
  { date: 'Feb 18', peakHR: 177, sport: 'Cycling' },
  // HIIT
  { date: 'Apr 3',  peakHR: 188, sport: 'HIIT' },
  { date: 'Apr 24', peakHR: 191, sport: 'HIIT' },
  { date: 'May 28', peakHR: 192, sport: 'HIIT' },  // observed max
  { date: 'Jul 14', peakHR: 189, sport: 'HIIT' },
  { date: 'Sep 10', peakHR: 190, sport: 'HIIT' },
  { date: 'Nov 18', peakHR: 188, sport: 'HIIT' },
  { date: 'Jan 28', peakHR: 191, sport: 'HIIT' },
  // Hiking
  { date: 'May 20', peakHR: 168, sport: 'Hiking' },
  { date: 'Jun 28', peakHR: 172, sport: 'Hiking' },
  { date: 'Aug 3',  peakHR: 165, sport: 'Hiking' },
  { date: 'Sep 28', peakHR: 170, sport: 'Hiking' },
  { date: 'Oct 30', peakHR: 164, sport: 'Hiking' },
  // Walking
  { date: 'Mar 22', peakHR: 148, sport: 'Walking' },
  { date: 'Apr 30', peakHR: 155, sport: 'Walking' },
  { date: 'Jun 10', peakHR: 151, sport: 'Walking' },
  { date: 'Aug 28', peakHR: 153, sport: 'Walking' },
  { date: 'Nov 25', peakHR: 149, sport: 'Walking' },
  { date: 'Jan 5',  peakHR: 152, sport: 'Walking' },
]

// Max HR per sport
const SPORT_MAX_DATA = [
  { sport: 'HIIT',    maxHR: 192 },
  { sport: 'Running', maxHR: 190 },
  { sport: 'Cycling', maxHR: 181 },
  { sport: 'Hiking',  maxHR: 172 },
  { sport: 'Walking', maxHR: 155 },
]

// Formula comparison
const FORMULAS = [
  { name: 'Fox (1971)',    formula: '220 − age',               estimate: FOX,    ref: 'Fox & Haskell' },
  { name: 'Tanaka (2001)', formula: '208 − (0.7 × age)',       estimate: TANAKA, ref: 'Tanaka et al.' },
  { name: 'Gellish (2007)',formula: '207 − (0.7 × age)',       estimate: GELLISH,ref: 'Gellish et al.' },
  { name: 'Nes (2013)',    formula: '211 − (0.64 × age)',      estimate: NES,    ref: 'Nes et al.' },
]

// Zone bands — [% HRmax lo, % HRmax hi, label, tailwind bg colour token]
const ZONE_BANDS: Array<{ zone: string; pctLo: number; pctHi: number; color: string }> = [
  { zone: 'Z1 — Recovery',    pctLo: 0.50, pctHi: 0.60, color: '#22c55e' },
  { zone: 'Z2 — Aerobic',     pctLo: 0.60, pctHi: 0.70, color: '#84cc16' },
  { zone: 'Z3 — Tempo',       pctLo: 0.70, pctHi: 0.80, color: '#eab308' },
  { zone: 'Z4 — Threshold',   pctLo: 0.80, pctHi: 0.90, color: '#f97316' },
  { zone: 'Z5 — Max Effort',  pctLo: 0.90, pctHi: 1.00, color: '#ef4444' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function diffColor(diff: number): string {
  const abs = Math.abs(diff)
  if (abs < 5) return 'text-green-500 dark:text-green-400'
  if (abs <= 10) return 'text-amber-500 dark:text-amber-400'
  return 'text-red-500 dark:text-red-400'
}

function fmtDiff(diff: number): string {
  return diff >= 0 ? `+${diff}` : `${diff}`
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MaxHeartRatePage() {
  const formulaDiff = OBSERVED_HRMAX - FOX  // +7

  const recentPeak = (() => {
    // Observed max in last 90 days (simulate: last 3 months of data)
    const recentSports = ['HIIT', 'Running']
    const recent = SCATTER_DATA.filter((d) => recentSports.includes(d.sport))
    return Math.max(...recent.map((d) => d.peakHR))
  })()

  const workoutsAnalyzed = SCATTER_DATA.length
  const sportsTracked = Object.keys(SPORT_COLORS).length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/heartrate"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to heart rate"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Max Heart Rate Analysis</h1>
            <p className="text-sm text-text-secondary">Observed vs formula estimates · 12 months</p>
          </div>
          <Heart className="w-5 h-5 text-red-500" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">

        {/* ── 1. Hero summary card ──────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-5">
          <p className="text-xs font-medium text-text-secondary uppercase tracking-widest mb-2">
            Observed HRmax
          </p>
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-6xl font-black text-red-500 tabular-nums leading-none">
              {OBSERVED_HRMAX}
            </span>
            <span className="text-2xl font-semibold text-text-secondary">bpm</span>
            <span className="text-sm text-text-secondary ml-1">
              vs 220−age formula:{' '}
              <span className="font-semibold text-text-primary">{FOX} bpm</span>
              {' '}
              <span className={`font-bold ${formulaDiff >= 0 ? 'text-green-500 dark:text-green-400' : 'text-amber-500 dark:text-amber-400'}`}>
                ({fmtDiff(formulaDiff)})
              </span>
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-2">
            Peak recorded during a HIIT session — May 28 · captured by Apple Watch
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mt-5">
            {[
              { label: 'Recent Peak (90d)', value: `${recentPeak} bpm`, color: 'text-red-500' },
              { label: 'Tanaka Estimate',   value: `${TANAKA} bpm`,     color: 'text-orange-400' },
              { label: 'Workouts Analyzed', value: String(workoutsAnalyzed), color: 'text-blue-400' },
              { label: 'Sports Tracked',    value: String(sportsTracked),    color: 'text-purple-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-surface-secondary rounded-xl border border-border p-3 text-center">
                <p className={`text-lg font-bold ${color}`}>{value}</p>
                <p className="text-xs text-text-secondary mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── 2. Peak HR scatter by workout ─────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Peak HR by Workout</h2>
          <p className="text-xs text-text-secondary mb-4">12 months · each point is one session</p>

          {/* Sport legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-text-secondary mb-4">
            {Object.entries(SPORT_COLORS).map(([sport, color]) => (
              <span key={sport} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
                {sport}
              </span>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart
              data={SCATTER_DATA}
              margin={{ top: 8, right: 16, left: -16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.12)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                interval={7}
              />
              <YAxis
                domain={[140, 200]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                tickLine={false}
                axisLine={false}
                width={32}
                tickFormatter={(v: number) => `${v}`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number, _name: string, props: { payload?: { sport?: string } }) => [
                  `${value} bpm`,
                  props?.payload?.sport ?? 'Peak HR',
                ]}
              />
              {/* Observed HRmax reference line */}
              <ReferenceLine
                y={OBSERVED_HRMAX}
                stroke="#ef4444"
                strokeWidth={2}
                label={{
                  value: `HRmax ${OBSERVED_HRMAX}`,
                  position: 'insideTopRight',
                  fontSize: 10,
                  fill: '#ef4444',
                }}
              />
              {/* Fox 220-age reference line */}
              <ReferenceLine
                y={FOX}
                stroke="#f97316"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                label={{
                  value: `220−age ${FOX}`,
                  position: 'insideBottomRight',
                  fontSize: 10,
                  fill: '#f97316',
                }}
              />
              <Scatter
                dataKey="peakHR"
                isAnimationActive={false}
                shape={(props: {
                  cx?: number
                  cy?: number
                  payload?: { sport?: string }
                }) => {
                  const { cx = 0, cy = 0, payload } = props
                  const sport = payload?.sport ?? ''
                  const fill = SPORT_COLORS[sport] ?? '#888'
                  return <circle cx={cx} cy={cy} r={4} fill={fill} fillOpacity={0.85} />
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* ── 3. Max HR by sport — horizontal bar chart ─────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Max HR by Sport</h2>
          <p className="text-xs text-text-secondary mb-4">Highest recorded peak per activity type</p>

          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              layout="vertical"
              data={SPORT_MAX_DATA}
              margin={{ top: 0, right: 40, left: 8, bottom: 0 }}
              barSize={20}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.12)" horizontal={false} />
              <XAxis
                type="number"
                domain={[130, 200]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v}`}
              />
              <YAxis
                type="category"
                dataKey="sport"
                tick={{ fontSize: 11, fill: 'var(--color-text-primary, #eee)' }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v} bpm`, 'Peak HR']}
              />
              <ReferenceLine x={OBSERVED_HRMAX} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1.5} />
              <Bar dataKey="maxHR" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 10, fill: 'var(--color-text-secondary, #888)', formatter: (v: number) => `${v}` }}>
                {SPORT_MAX_DATA.map((entry) => (
                  <Cell key={entry.sport} fill={SPORT_COLORS[entry.sport] ?? '#888'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── 4. Formula comparison table ───────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">Formula Comparison</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Age-predicted HRmax vs your observed {OBSERVED_HRMAX} bpm
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary">Formula</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-text-secondary hidden sm:table-cell">Equation</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary">Estimate</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-text-secondary">Difference</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary hidden md:table-cell">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {FORMULAS.map((f) => {
                  const diff = OBSERVED_HRMAX - f.estimate
                  const roundedEst = typeof f.estimate === 'number' ? f.estimate : f.estimate
                  return (
                    <tr key={f.name} className="hover:bg-surface-secondary/40 transition-colors">
                      <td className="px-4 py-3 text-xs font-medium text-text-primary whitespace-nowrap">
                        {f.name}
                      </td>
                      <td className="px-3 py-3 text-xs text-text-secondary hidden sm:table-cell font-mono">
                        {f.formula}
                      </td>
                      <td className="px-3 py-3 text-right text-xs font-semibold text-text-primary tabular-nums">
                        {roundedEst} bpm
                      </td>
                      <td className={`px-3 py-3 text-right text-xs font-bold tabular-nums ${diffColor(diff)}`}>
                        {fmtDiff(Math.round(diff * 10) / 10)}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary hidden md:table-cell italic">
                        {f.ref}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-border flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> &lt;5 bpm difference
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> 5–10 bpm difference
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> &gt;10 bpm difference
            </span>
          </div>
        </div>

        {/* ── 5. Zone calibration side-by-side ─────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">Zone Calibration</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Formula-based zones vs zones calibrated to your observed HRmax
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-text-secondary w-32">Zone</th>
                  <th className="px-3 py-2.5 text-center text-xs font-medium text-text-secondary">
                    Formula (220−age = {FOX})
                  </th>
                  <th className="px-3 py-2.5 text-center text-xs font-medium text-text-secondary">
                    Observed ({OBSERVED_HRMAX} bpm)
                  </th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-text-secondary">Shift</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ZONE_BANDS.map((band) => {
                  const formulaLo = Math.round(FOX * band.pctLo)
                  const formulaHi = Math.round(FOX * band.pctHi)
                  const obsLo = Math.round(OBSERVED_HRMAX * band.pctLo)
                  const obsHi = Math.round(OBSERVED_HRMAX * band.pctHi)
                  const shiftLo = obsLo - formulaLo
                  return (
                    <tr key={band.zone} className="hover:bg-surface-secondary/40 transition-colors">
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2 text-xs font-medium text-text-primary">
                          <span
                            className="w-3 h-3 rounded-sm inline-block flex-shrink-0"
                            style={{ backgroundColor: band.color }}
                          />
                          {band.zone}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-xs text-text-secondary tabular-nums">
                        {formulaLo}–{formulaHi} bpm
                      </td>
                      <td className="px-3 py-3 text-center text-xs font-semibold text-text-primary tabular-nums">
                        {obsLo}–{obsHi} bpm
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-bold text-red-500 dark:text-red-400 tabular-nums">
                        +{shiftLo} bpm
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="px-4 py-2.5 text-xs text-text-secondary border-t border-border">
            Using formula-based zones would place you a full zone lower for every training effort. Calibrate to your observed HRmax for accurate training.
          </p>
        </div>

        {/* ── 6. Science card ──────────────────────────────────────────────── */}
        <div className="bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-800/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
            <h2 className="text-sm font-semibold text-red-700 dark:text-red-300">
              The Science of HRmax
            </h2>
          </div>
          <div className="space-y-3">
            {[
              {
                title: 'Formula inaccuracy',
                body: '220−age has ±10–20 bpm individual variation (Robergs & Landwehr, 2002). Every formula is a population mean — your true max is determined by genetics, not averages.',
              },
              {
                title: 'HRmax is not trainable',
                body: 'Aerobic training raises stroke volume, lowers resting HR, and improves economy — but it does not raise your maximum heart rate. HRmax is genetically set.',
              },
              {
                title: 'Age-related decline',
                body: 'HRmax declines approximately 1 bpm per year from age 20, regardless of fitness level. A 60-year-old elite marathoner has a lower HRmax than a 25-year-old couch potato.',
              },
              {
                title: 'Zone calibration impact',
                body: 'A 10 bpm error in HRmax shifts every zone boundary. Training in the wrong zone for months can under- or over-stress your cardiovascular system and impair adaptation.',
              },
              {
                title: 'How Apple Watch captures HRmax',
                body: 'Apple Watch samples optical HR every second during workouts. During an all-out effort (sprint finish, HIIT peak) it typically captures within 2–3 bpm of true maximum. No lab required.',
              },
            ].map(({ title, body }) => (
              <div key={title} className="flex gap-3">
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-red-700 dark:text-red-300">{title}</p>
                  <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
      <BottomNav />
    </div>
  )
}
