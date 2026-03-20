'use client'

import Link from 'next/link'
import { ArrowLeft, ShieldAlert, BookOpen, TrendingUp, Activity } from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'

// ─── Types ─────────────────────────────────────────────────────────────────

type Zone = 'underloaded' | 'sweet-spot' | 'elevated' | 'danger'

interface DayPoint {
  date: string      // 'Jan 20' style label
  acwr: number
  zone: Zone
}

// ─── Mock data generation ─────────────────────────────────────────────────
// Simulates a recreational runner who:
//   - Had a steady base phase (ACWR ~1.0)
//   - Took an easy week (ACWR dips to ~0.65)
//   - Then a training spike 2 weeks ago (ACWR peaks ~1.72)
//   - Is now recovering back toward sweet spot (~1.18)

function generateMockData(): DayPoint[] {
  const points: DayPoint[] = []

  // Raw daily workload values (arbitrary units — proxy for TSS/active cal)
  // We seed a realistic 90-day runway then compute ACWR over the last 60.
  const allLoad: number[] = []

  // Days -90..-61: normal base training ~55 AU/day active days, rest days 0
  const basePattern = [55, 60, 0, 50, 65, 0, 70]
  for (let i = 0; i < 30; i++) allLoad.push(basePattern[i % 7] + (Math.random() - 0.5) * 10)

  // Days -60..-43: taper / easy block (~40 AU, ACWR drops toward 0.7)
  const taperPattern = [35, 0, 40, 0, 38, 45, 0]
  for (let i = 0; i < 18; i++) allLoad.push(Math.max(0, taperPattern[i % 7] + (Math.random() - 0.5) * 8))

  // Days -42..-29: ramp back up moderately
  const rampPattern = [55, 60, 0, 65, 60, 0, 75]
  for (let i = 0; i < 14; i++) allLoad.push(Math.max(0, rampPattern[i % 7] + (Math.random() - 0.5) * 10))

  // Days -28..-15: spike — race prep overreach (high load 7 consecutive days then crash)
  const spikePattern = [90, 95, 85, 100, 0, 110, 95, 90, 0, 85, 80, 70, 0, 60]
  for (let i = 0; i < 14; i++) allLoad.push(Math.max(0, spikePattern[i] + (Math.random() - 0.5) * 8))

  // Days -14..-1: recovery taper — volume drops
  const recoveryPattern = [45, 40, 0, 50, 40, 0, 55, 45, 0, 50, 55, 0, 60, 50]
  for (let i = 0; i < 14; i++) allLoad.push(Math.max(0, recoveryPattern[i] + (Math.random() - 0.5) * 8))

  // Total 90 days
  const totalDays = allLoad.length // should be 90

  // Compute 7-day EWA (ATL) and 28-day EWA (CTL) via rolling simple average
  // for simplicity (close enough to EWA for mock purposes)
  function rollingAvg(data: number[], end: number, window: number): number {
    const start = Math.max(0, end - window + 1)
    const slice = data.slice(start, end + 1)
    return slice.reduce((s, v) => s + v, 0) / slice.length
  }

  // Emit only the last 60 days for the chart
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let d = 29; d < totalDays; d++) {
    const atl = rollingAvg(allLoad, d, 7)
    const ctl = rollingAvg(allLoad, d, 28)
    const acwr = ctl > 0 ? Math.round((atl / ctl) * 100) / 100 : 0

    const dayOffset = d - (totalDays - 1)
    const date = new Date(today)
    date.setDate(today.getDate() + dayOffset)
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    let zone: Zone
    if (acwr < 0.8) zone = 'underloaded'
    else if (acwr <= 1.3) zone = 'sweet-spot'
    else if (acwr <= 1.5) zone = 'elevated'
    else zone = 'danger'

    points.push({ date: label, acwr, zone })
  }

  return points
}

// ─── Zone helpers ──────────────────────────────────────────────────────────

function getZone(acwr: number): Zone {
  if (acwr < 0.8) return 'underloaded'
  if (acwr <= 1.3) return 'sweet-spot'
  if (acwr <= 1.5) return 'elevated'
  return 'danger'
}

const ZONE_META: Record<Zone, { label: string; color: string; bg: string; border: string; advice: string; hex: string }> = {
  'underloaded': {
    label: 'Underloaded',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    hex: '#38bdf8',
    advice: 'Your acute load is well below your chronic baseline. You\'re well rested, but extended underloading can reduce fitness. Safe to increase training volume gradually.',
  },
  'sweet-spot': {
    label: 'Sweet Spot',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    hex: '#34d399',
    advice: 'Optimal training range. High enough load to drive adaptation, low enough to avoid spike-related injury. Maintain this ratio for peak fitness gains.',
  },
  'elevated': {
    label: 'Elevated Risk',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    hex: '#fbbf24',
    advice: 'Acute load is outpacing your chronic base. Monitor for signs of fatigue and soreness. Consider adding an easy day or reducing intensity before the next hard session.',
  },
  'danger': {
    label: 'Danger Zone',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    hex: '#f87171',
    advice: 'Load spike detected. Gabbett 2016 shows 2–4× higher non-contact injury risk at this ratio. Prioritise recovery: reduce volume, maintain easy movement, and avoid consecutive hard sessions.',
  },
}

// ─── Custom Tooltip ─────────────────────────────────────────────────────────

function ACWRTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const acwr = payload[0].value
  const zone = getZone(acwr)
  const meta = ZONE_META[zone]
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-xl"
      style={{
        background: 'hsl(0 0% 10%)',
        borderColor: meta.hex + '55',
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <p className="text-[10px] text-white/40 mb-1">{label}</p>
      <p style={{ color: meta.hex }} className="font-bold text-sm">{acwr.toFixed(2)}</p>
      <p style={{ color: meta.hex }} className="opacity-80">{meta.label}</p>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function ACWRPage() {
  const data = generateMockData()
  const today = data[data.length - 1]
  const currentACWR = today.acwr
  const currentZone = getZone(currentACWR)
  const zoneMeta = ZONE_META[currentZone]

  // Stats
  const sweetSpotDays = data.filter((d) => d.zone === 'sweet-spot').length
  const pctSweetSpot = Math.round((sweetSpotDays / data.length) * 100)
  const peakACWR = Math.max(...data.map((d) => d.acwr))

  // Chart reference areas — rendered as two flat areas in the data
  // We encode the shading as static reference using ReferenceArea from recharts
  // But simpler: add shadow area data fields
  const chartData = data.map((d) => ({
    ...d,
    sweetSpotBand: [0.8, 1.3] as [number, number],
    dangerBand: [1.5, 2.2] as [number, number],
  }))

  const tooltipStyle = {
    background: 'hsl(0 0% 10%)',
    border: '1px solid hsl(0 0% 20%)',
    borderRadius: 8,
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
  }

  return (
    <>
      {/* Google Fonts for distinctive typography */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        .font-rajdhani { font-family: 'Rajdhani', sans-serif; }
        .font-mono-jb { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      <div className="min-h-screen bg-[hsl(0_0%_7%)] text-white">

        {/* ── Header ── */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[hsl(0_0%_7%)]/90 backdrop-blur-md">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link
              href="/explore"
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors font-mono-jb"
              aria-label="Back to Explore"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Explore
            </Link>
            <div className="h-4 w-px bg-white/15" />
            <div className="flex-1 flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <div>
                <h1 className="font-rajdhani text-lg font-700 leading-tight tracking-wide text-white">
                  ACWR — Injury Risk Predictor
                </h1>
              </div>
            </div>
            <span className="hidden sm:block text-[10px] font-mono-jb text-white/25 tracking-widest uppercase">
              Acute:Chronic Workload Ratio
            </span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-5">

          {/* ── Summary cards ── */}
          <div className="grid grid-cols-3 gap-3">
            {/* Current ACWR */}
            <div
              className={`col-span-1 rounded-2xl border p-4 flex flex-col justify-between ${zoneMeta.bg} ${zoneMeta.border}`}
              style={{ minHeight: 110 }}
            >
              <p className="text-[10px] font-mono-jb text-white/40 uppercase tracking-widest">Current ACWR</p>
              <div>
                <p
                  className="font-rajdhani text-5xl font-bold leading-none mt-1"
                  style={{ color: zoneMeta.hex }}
                >
                  {currentACWR.toFixed(2)}
                </p>
                <span
                  className="inline-block mt-1.5 rounded-full px-2 py-0.5 text-[10px] font-mono-jb font-medium"
                  style={{ background: zoneMeta.hex + '22', color: zoneMeta.hex }}
                >
                  {zoneMeta.label}
                </span>
              </div>
            </div>

            {/* % days in sweet spot */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 flex flex-col justify-between">
              <p className="text-[10px] font-mono-jb text-white/40 uppercase tracking-widest">Days in Sweet Spot</p>
              <div>
                <p className="font-rajdhani text-5xl font-bold leading-none mt-1 text-emerald-400">
                  {pctSweetSpot}<span className="text-2xl text-emerald-400/60">%</span>
                </p>
                <p className="text-[10px] font-mono-jb text-white/30 mt-1.5">last 60 days</p>
              </div>
            </div>

            {/* Peak ACWR */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 flex flex-col justify-between">
              <p className="text-[10px] font-mono-jb text-white/40 uppercase tracking-widest">Peak ACWR</p>
              <div>
                <p className="font-rajdhani text-5xl font-bold leading-none mt-1 text-red-400">
                  {peakACWR.toFixed(2)}
                </p>
                <p className="text-[10px] font-mono-jb text-white/30 mt-1.5">30-day high</p>
              </div>
            </div>
          </div>

          {/* ── Zone status banner ── */}
          <div className={`rounded-2xl border p-4 ${zoneMeta.bg} ${zoneMeta.border}`}>
            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 rounded-full p-1.5 shrink-0"
                style={{ background: zoneMeta.hex + '22' }}
              >
                <Activity className="w-3.5 h-3.5" style={{ color: zoneMeta.hex }} />
              </div>
              <div>
                <p className="font-rajdhani font-bold text-base tracking-wide" style={{ color: zoneMeta.hex }}>
                  {zoneMeta.label}
                </p>
                <p className="text-sm text-white/60 mt-1 leading-relaxed">{zoneMeta.advice}</p>
              </div>
            </div>
          </div>

          {/* ── 60-day ACWR chart ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-white/40" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                60-Day ACWR History
              </h2>
            </div>

            <ResponsiveContainer width="100%" height={230}>
              <ComposedChart
                data={chartData}
                margin={{ top: 12, right: 8, left: -10, bottom: 0 }}
              >
                <defs>
                  {/* Sweet spot green fill */}
                  <linearGradient id="sweetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0.04} />
                  </linearGradient>
                  {/* Danger red fill */}
                  <linearGradient id="dangerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#f87171" stopOpacity={0.06} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />

                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}
                  axisLine={false}
                  tickLine={false}
                  interval={9}
                />
                <YAxis
                  domain={[0.4, 2.0]}
                  tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}
                  width={30}
                  tickFormatter={(v: number) => v.toFixed(1)}
                />

                <Tooltip content={<ACWRTooltip />} />

                {/* Sweet spot band: 0.8 – 1.3 */}
                <Area
                  type="monotone"
                  dataKey={() => 1.3}
                  stroke="none"
                  fill="url(#sweetGrad)"
                  isAnimationActive={false}
                  legendType="none"
                  name="sweetTop"
                  tooltipType="none"
                  baseValue={0.8}
                />

                {/* Danger zone band: 1.5 – 2.0 */}
                <Area
                  type="monotone"
                  dataKey={() => 2.05}
                  stroke="none"
                  fill="url(#dangerGrad)"
                  isAnimationActive={false}
                  legendType="none"
                  name="dangerTop"
                  tooltipType="none"
                  baseValue={1.5}
                />

                {/* Reference lines for zone boundaries */}
                <ReferenceLine y={0.8} stroke="#38bdf8" strokeWidth={1} strokeDasharray="4 4" strokeOpacity={0.4} />
                <ReferenceLine y={1.3} stroke="#34d399" strokeWidth={1} strokeDasharray="4 4" strokeOpacity={0.4} />
                <ReferenceLine
                  y={1.5}
                  stroke="#f87171"
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  strokeOpacity={0.9}
                  label={{
                    value: 'DANGER 1.5',
                    position: 'insideTopRight',
                    fill: '#f87171',
                    fontSize: 9,
                    fontFamily: "'JetBrains Mono', monospace",
                    opacity: 0.7,
                  }}
                />

                {/* ACWR line */}
                <Line
                  type="monotone"
                  dataKey="acwr"
                  stroke="#e2e8f0"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#e2e8f0', stroke: 'hsl(0 0% 10%)', strokeWidth: 2 }}
                  name="ACWR"
                />
              </ComposedChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[10px] font-mono-jb text-white/40">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#34d399', opacity: 0.45 }} />
                Sweet Spot (0.8–1.3)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#f87171', opacity: 0.45 }} />
                Danger Zone (&gt;1.5)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-6 h-px border-t border-dashed border-red-400/80" />
                1.5 threshold
              </span>
            </div>
          </div>

          {/* ── Risk zone guide ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Risk Zone Guide
              </h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="px-4 py-2.5 text-left text-[10px] font-mono-jb font-medium text-white/30 uppercase tracking-widest">ACWR Range</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-mono-jb font-medium text-white/30 uppercase tracking-widest">Zone</th>
                  <th className="hidden sm:table-cell px-4 py-2.5 text-left text-[10px] font-mono-jb font-medium text-white/30 uppercase tracking-widest">Injury Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {[
                  { range: '< 0.8', zone: 'underloaded' as Zone, risk: 'Deconditioning risk' },
                  { range: '0.8 – 1.3', zone: 'sweet-spot' as Zone, risk: 'Lowest injury risk' },
                  { range: '1.3 – 1.5', zone: 'elevated' as Zone, risk: 'Moderate — monitor closely' },
                  { range: '> 1.5', zone: 'danger' as Zone, risk: '2–4× non-contact injury risk' },
                ].map(({ range, zone, risk }) => {
                  const meta = ZONE_META[zone]
                  return (
                    <tr key={zone} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-3 font-mono-jb text-xs font-medium text-white/70">{range}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-mono-jb font-medium"
                          style={{ background: meta.hex + '1a', color: meta.hex }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: meta.hex }} />
                          {meta.label}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3 text-xs text-white/40 font-mono-jb">{risk}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ── Science card ── */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full p-1.5 bg-amber-500/15 shrink-0 mt-0.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="space-y-3">
                <p className="font-rajdhani font-semibold text-sm text-amber-400 tracking-wide">
                  Science Behind ACWR
                </p>
                <div className="space-y-2.5 text-xs text-white/55 leading-relaxed font-mono-jb">
                  <p>
                    <span className="text-white/80 font-medium">ACWR = ATL ÷ CTL</span>
                    {' '}— Acute Training Load (7-day rolling average) divided by Chronic Training Load (28-day rolling average).
                  </p>
                  <div className="border-l-2 border-amber-500/30 pl-3 space-y-1.5">
                    <p>
                      <span className="text-amber-300/80">Gabbett TJ (2016)</span>
                      {' '}— "The training-injury prevention paradox: should athletes be training smarter and harder?"
                      {' '}<em>Br J Sports Med</em> 50(5):273–280.
                      {' '}Established ACWR 0.8–1.3 as the sweet spot with 2–4× injury risk above 1.5.
                    </p>
                    <p>
                      <span className="text-amber-300/80">Hulin BT et al. (2016)</span>
                      {' '}— "Spikes in acute workload are associated with increased injury risk in elite cricket fast bowlers."
                      {' '}<em>Br J Sports Med</em> 48(8):708–712.
                      {' '}Demonstrated that rapid load increases — not high absolute load — drive non-contact injury.
                    </p>
                  </div>
                  <p className="text-white/35 text-[10px]">
                    Load units are estimated from active calories and workout duration. Accuracy improves with more synced workout data.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </main>

        <BottomNav />
      </div>
    </>
  )
}
