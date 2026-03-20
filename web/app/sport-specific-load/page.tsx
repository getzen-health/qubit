'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  Bike,
  Waves,
  Dumbbell,
  Zap,
  MoreHorizontal,
  PersonStanding,
  TrendingUp,
  TrendingDown,
  Minus,
  PieChart as PieChartIcon,
} from 'lucide-react'
import { BottomNav } from '@/components/bottom-nav'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

// ─── Fonts ──────────────────────────────────────────────────────────────────

// injected via <style> — see render

// ─── Sport definitions ──────────────────────────────────────────────────────

type SportKey = 'running' | 'cycling' | 'swimming' | 'strength' | 'cardio' | 'other'
type TSBStatus = 'fresh' | 'neutral' | 'fatigued' | 'overreaching'

interface SportMeta {
  key: SportKey
  label: string
  color: string          // hex
  tailwindText: string   // tailwind class
  tailwindBg: string
  tailwindBorder: string
  Icon: React.ElementType
}

const SPORTS: Record<SportKey, SportMeta> = {
  running: {
    key: 'running',
    label: 'Running',
    color: '#fb923c',
    tailwindText: 'text-orange-400',
    tailwindBg: 'bg-orange-500/10',
    tailwindBorder: 'border-orange-500/30',
    Icon: PersonStanding,
  },
  cycling: {
    key: 'cycling',
    label: 'Cycling',
    color: '#3b82f6',
    tailwindText: 'text-blue-400',
    tailwindBg: 'bg-blue-500/10',
    tailwindBorder: 'border-blue-500/30',
    Icon: Bike,
  },
  swimming: {
    key: 'swimming',
    label: 'Swimming',
    color: '#22d3ee',
    tailwindText: 'text-cyan-400',
    tailwindBg: 'bg-cyan-500/10',
    tailwindBorder: 'border-cyan-500/30',
    Icon: Waves,
  },
  strength: {
    key: 'strength',
    label: 'Strength',
    color: '#f87171',
    tailwindText: 'text-red-400',
    tailwindBg: 'bg-red-500/10',
    tailwindBorder: 'border-red-500/30',
    Icon: Dumbbell,
  },
  cardio: {
    key: 'cardio',
    label: 'Cardio / HIIT',
    color: '#f472b6',
    tailwindText: 'text-pink-400',
    tailwindBg: 'bg-pink-500/10',
    tailwindBorder: 'border-pink-500/30',
    Icon: Zap,
  },
  other: {
    key: 'other',
    label: 'Other',
    color: '#a78bfa',
    tailwindText: 'text-violet-400',
    tailwindBg: 'bg-violet-500/10',
    tailwindBorder: 'border-violet-500/30',
    Icon: MoreHorizontal,
  },
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface SportLoad {
  sport: SportKey
  ctl: number      // 42-day EWA fitness
  atl: number      // 7-day EWA fatigue
  tsb: number      // form = CTL − ATL
  tss7: number     // total TSS last 7 days (proxy: kcal/500)
}

// ─── Mock data ──────────────────────────────────────────────────────────────
// Triathlete in late build phase:
//   Running: building fitness but a bit fatigued (TSB -5)
//   Cycling: most fit sport, well recovered (TSB +8)
//   Swimming: moderate fitness, nearly neutral (TSB -2)
//   Strength: complementary, fresh (TSB +5)

const SPORT_LOADS: SportLoad[] = [
  // CTL=45, ATL=50 → TSB=-5  Running building phase
  { sport: 'running',  ctl: 45, atl: 50, tsb: -5,  tss7: 312 },
  // CTL=65, ATL=57 → TSB=+8  Cycling peak fitness, recovery week
  { sport: 'cycling',  ctl: 65, atl: 57, tsb:  8,  tss7: 395 },
  // CTL=30, ATL=32 → TSB=-2  Swimming neutral
  { sport: 'swimming', ctl: 30, atl: 32, tsb: -2,  tss7: 210 },
  // CTL=15, ATL=10 → TSB=+5  Strength fresh
  { sport: 'strength', ctl: 15, atl: 10, tsb:  5,  tss7:  68 },
]

// ─── TSB Status helpers ─────────────────────────────────────────────────────

function getTSBStatus(tsb: number): TSBStatus {
  if (tsb > 10)   return 'fresh'
  if (tsb >= 0)   return 'neutral'
  if (tsb >= -20) return 'fatigued'
  return 'overreaching'
}

const TSB_META: Record<TSBStatus, { label: string; color: string; bg: string; border: string; description: string }> = {
  fresh: {
    label: 'Fresh',
    color: '#34d399',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/25',
    description: 'Well recovered. Ready for a hard training block or race.',
  },
  neutral: {
    label: 'Neutral',
    color: '#60a5fa',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/25',
    description: 'Balanced state. Good for quality training sessions.',
  },
  fatigued: {
    label: 'Fatigued',
    color: '#fbbf24',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/25',
    description: 'Accumulated fatigue from recent training load.',
  },
  overreaching: {
    label: 'Overreaching',
    color: '#f87171',
    bg: 'bg-red-500/10',
    border: 'border-red-500/25',
    description: 'Heavy fatigue. Reduce intensity and prioritise recovery.',
  },
}

// ─── Computed totals ─────────────────────────────────────────────────────────

const totalCTL  = SPORT_LOADS.reduce((s, d) => s + d.ctl, 0)
const totalATL  = SPORT_LOADS.reduce((s, d) => s + d.atl, 0)
const totalTSB  = totalCTL - totalATL
const maxCTL    = Math.max(...SPORT_LOADS.map((d) => d.ctl))

// Primary sport = highest CTL
const primarySport = SPORT_LOADS.reduce((a, b) => (a.ctl >= b.ctl ? a : b)).sport

// Pie data
const pieData = SPORT_LOADS.map((d) => ({
  name: SPORTS[d.sport].label,
  value: d.ctl,
  color: SPORTS[d.sport].color,
}))

// ─── TSB Icon ────────────────────────────────────────────────────────────────

function TSBIcon({ tsb }: { tsb: number }) {
  if (tsb > 5)  return <TrendingUp className="w-3.5 h-3.5" />
  if (tsb < -5) return <TrendingDown className="w-3.5 h-3.5" />
  return <Minus className="w-3.5 h-3.5" />
}

// ─── Custom Pie Tooltip ──────────────────────────────────────────────────────

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }> }) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  const pct = Math.round((entry.value / totalCTL) * 100)
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-xl"
      style={{
        background: 'hsl(0 0% 10%)',
        borderColor: entry.payload.color + '55',
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <p className="text-[10px] text-white/40 mb-1">Training Load Share</p>
      <p className="font-bold text-sm" style={{ color: entry.payload.color }}>{entry.name}</p>
      <p className="text-white/70 mt-0.5">CTL {entry.value} &middot; {pct}%</p>
    </div>
  )
}

// ─── Sport Card ──────────────────────────────────────────────────────────────

function SportCard({ load }: { load: SportLoad }) {
  const meta    = SPORTS[load.sport]
  const status  = getTSBStatus(load.tsb)
  const tsbMeta = TSB_META[status]
  const barPct  = Math.round((load.ctl / maxCTL) * 100)
  const { Icon } = meta

  return (
    <div
      className={`rounded-2xl border p-4 space-y-3.5 ${meta.tailwindBg} ${meta.tailwindBorder}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="rounded-lg p-1.5 shrink-0"
            style={{ background: meta.color + '22' }}
          >
            <Icon className="w-4 h-4" style={{ color: meta.color }} />
          </div>
          <span
            className="font-rajdhani font-semibold text-base tracking-wide"
            style={{ color: meta.color }}
          >
            {meta.label}
          </span>
        </div>
        {/* TSB badge */}
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-mono-jb font-medium"
          style={{ background: tsbMeta.color + '22', color: tsbMeta.color }}
        >
          <TSBIcon tsb={load.tsb} />
          {tsbMeta.label}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'CTL', value: load.ctl, hint: '42-day' },
          { label: 'ATL', value: load.atl, hint: '7-day' },
          { label: 'TSB', value: load.tsb > 0 ? `+${load.tsb}` : String(load.tsb), hint: 'Form' },
          { label: 'TSS₇', value: load.tss7, hint: 'Last 7d' },
        ].map(({ label, value, hint }) => (
          <div key={label} className="space-y-0.5">
            <p className="text-[9px] font-mono-jb text-white/35 uppercase tracking-widest">{label}</p>
            <p
              className="font-rajdhani text-xl font-bold leading-none"
              style={{ color: label === 'TSB' ? tsbMeta.color : meta.color }}
            >
              {value}
            </p>
            <p className="text-[9px] font-mono-jb text-white/25">{hint}</p>
          </div>
        ))}
      </div>

      {/* CTL bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[9px] font-mono-jb text-white/30 uppercase tracking-widest">Fitness (CTL)</p>
          <p className="text-[9px] font-mono-jb text-white/30">{barPct}% of peak</p>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${barPct}%`, background: meta.color }}
          />
        </div>
      </div>

      {/* TSB description */}
      <p className="text-[10px] font-mono-jb text-white/40 leading-relaxed">{tsbMeta.description}</p>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SportSpecificLoadPage() {
  const totalTSBStatus = getTSBStatus(totalTSB)
  const tsbMeta        = TSB_META[totalTSBStatus]
  const primaryMeta    = SPORTS[primarySport]
  const { Icon: PrimaryIcon } = primaryMeta

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        .font-rajdhani { font-family: 'Rajdhani', sans-serif; }
        .font-mono-jb  { font-family: 'JetBrains Mono', monospace; }
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
              <TrendingUp className="w-4 h-4 text-violet-400" />
              <div>
                <h1 className="font-rajdhani text-lg font-700 leading-tight tracking-wide text-white">
                  Sport-Specific Training Load
                </h1>
              </div>
            </div>
            <span className="hidden sm:block text-[10px] font-mono-jb text-white/25 tracking-widest uppercase">
              CTL · ATL · TSB per sport
            </span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-5">

          {/* ── Overview card ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest mb-4">Overview — All Sports Combined</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

              {/* Total CTL */}
              <div className="space-y-1">
                <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">Total CTL</p>
                <p className="font-rajdhani text-5xl font-bold leading-none text-white">{totalCTL}</p>
                <p className="text-[10px] font-mono-jb text-white/30">42-day fitness</p>
              </div>

              {/* Total ATL */}
              <div className="space-y-1">
                <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">Total ATL</p>
                <p className="font-rajdhani text-5xl font-bold leading-none text-white/80">{totalATL}</p>
                <p className="text-[10px] font-mono-jb text-white/30">7-day fatigue</p>
              </div>

              {/* Total TSB */}
              <div className="space-y-1">
                <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">Total TSB</p>
                <p
                  className="font-rajdhani text-5xl font-bold leading-none"
                  style={{ color: tsbMeta.color }}
                >
                  {totalTSB > 0 ? `+${totalTSB}` : totalTSB}
                </p>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-mono-jb font-medium"
                  style={{ background: tsbMeta.color + '22', color: tsbMeta.color }}
                >
                  <TSBIcon tsb={totalTSB} />
                  {tsbMeta.label}
                </span>
              </div>

              {/* Primary sport */}
              <div className="space-y-1">
                <p className="text-[10px] font-mono-jb text-white/35 uppercase tracking-widest">Primary Sport</p>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="rounded-lg p-2 shrink-0"
                    style={{ background: primaryMeta.color + '22' }}
                  >
                    <PrimaryIcon className="w-5 h-5" style={{ color: primaryMeta.color }} />
                  </div>
                  <p
                    className="font-rajdhani text-2xl font-bold leading-tight"
                    style={{ color: primaryMeta.color }}
                  >
                    {primaryMeta.label}
                  </p>
                </div>
                <p className="text-[10px] font-mono-jb text-white/30">Highest CTL</p>
              </div>

            </div>
          </div>

          {/* ── TSB scale legend ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Form (TSB) Interpretation Guide
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-white/[0.06]">
              {(Object.entries(TSB_META) as [TSBStatus, typeof TSB_META[TSBStatus]][]).map(([status, meta]) => (
                <div key={status} className="px-4 py-3 space-y-1">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-mono-jb"
                    style={{ background: meta.color + '1a', color: meta.color }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: meta.color }} />
                    {meta.label}
                  </span>
                  <p className="text-[10px] font-mono-jb text-white/35 leading-relaxed">
                    {status === 'fresh'        && 'TSB > +10'}
                    {status === 'neutral'      && 'TSB 0 to +10'}
                    {status === 'fatigued'     && 'TSB -20 to 0'}
                    {status === 'overreaching' && 'TSB < -20'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Per-sport cards ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-white/30" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/70">
                Per-Sport Breakdown
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SPORT_LOADS.map((load) => (
                <SportCard key={load.sport} load={load} />
              ))}
            </div>
          </div>

          {/* ── Distribution pie chart ── */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 mb-1">
              <PieChartIcon className="w-4 h-4 text-white/40" />
              <h2 className="font-rajdhani font-semibold text-sm tracking-wide text-white/80">
                Training Load Distribution
              </h2>
            </div>
            <p className="text-[10px] font-mono-jb text-white/30 mb-4">
              Share of total Chronic Training Load (CTL) per sport
            </p>

            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} fillOpacity={0.85} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => (
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 10,
                        color: 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Manual percentage row */}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              {pieData.map((entry) => {
                const pct = Math.round((entry.value / totalCTL) * 100)
                return (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: entry.color }}
                    />
                    <span className="text-[10px] font-mono-jb text-white/50">
                      {entry.name} <span className="text-white/70 font-medium">{pct}%</span>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Science card ── */}
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full p-1.5 bg-amber-500/15 shrink-0 mt-0.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="space-y-3">
                <p className="font-rajdhani font-semibold text-sm text-amber-400 tracking-wide">
                  Science Behind Sport-Specific Load
                </p>
                <div className="space-y-2.5 text-xs text-white/55 leading-relaxed font-mono-jb">
                  <p>
                    <span className="text-white/80 font-medium">TSS proxy: kcal ÷ 500 per session</span>
                    {' '}— used to normalise sessions across sport modalities where power meters or pace zones are unavailable.
                    CTL = 42-day exponentially weighted average; ATL = 7-day EWA (Bannister 1991).
                  </p>
                  <div className="border-l-2 border-amber-500/30 pl-3 space-y-2">
                    <p>
                      <span className="text-amber-300/80">Impellizzeri FM et al. (2004)</span>
                      {' '}— "Use of RPE-based training load in soccer."
                      {' '}<em>Int J Sports Med</em> 25(6):450–454.
                      {' '}Established that sport-specific internal load tracking is necessary for multi-sport athletes
                      — aggregate load metrics obscure modality-specific overreaching.
                    </p>
                    <p>
                      <span className="text-amber-300/80">Soligard T et al. (2016)</span>
                      {' '}— "How much is too much? (Part 1) International Olympic Committee consensus statement on load in sport and risk of injury."
                      {' '}<em>Br J Sports Med</em> 50(17):1030–1041.
                      {' '}Sport-specific load distributions predict injury independently of total load;
                      sudden shifts in which sport dominates the training week are a primary risk factor.
                    </p>
                    <p>
                      <span className="text-amber-300/80">Bannister EW (1991)</span>
                      {' '}— "Modeling elite athletic performance." In <em>Physiological Testing of Elite Athletes</em>.
                      {' '}Original derivation of CTL (42-day EWA = fitness) and ATL (7-day EWA = fatigue);
                      TSB = CTL − ATL as an operational readiness proxy.
                    </p>
                  </div>
                  <p className="text-white/30 text-[10px]">
                    Accuracy improves with consistent workout logging across all disciplines.
                    Running power or swim pace data enables more precise TSS calculation.
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
