'use client'

import Link from 'next/link'
import { ArrowLeft, Droplets, FlaskConical, BookOpen, ChevronRight, Info } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts'

// ─── Mock data ────────────────────────────────────────────────────────────────

type IntensityLevel = 'Optimal' | 'Mild' | 'Caution' | 'Significant'

interface SweatSession {
  id: string
  date: string
  sport: string
  durationMin: number
  preWeightKg: number
  postWeightKg: number
  fluidIntakeLiters: number
}

function massLossPct(s: SweatSession): number {
  return ((s.preWeightKg - s.postWeightKg) / s.preWeightKg) * 100
}

function sweatRateLhr(s: SweatSession): number {
  // Sawka 2007: Sweat rate = (pre − post + fluid intake) / duration (hrs)
  const fluidLossKg = s.preWeightKg - s.postWeightKg
  const totalSweatL = fluidLossKg + s.fluidIntakeLiters
  return totalSweatL / (s.durationMin / 60)
}

function fluidLossKg(s: SweatSession): number {
  return s.preWeightKg - s.postWeightKg
}

function intensityLevel(massPct: number): IntensityLevel {
  if (massPct < 1) return 'Optimal'
  if (massPct < 2) return 'Mild'
  if (massPct < 3) return 'Caution'
  return 'Significant'
}

const MOCK_SESSIONS: SweatSession[] = [
  { id: '1',  date: '2026-03-18', sport: 'Running',  durationMin: 75,  preWeightKg: 74.2, postWeightKg: 73.0, fluidIntakeLiters: 0.5 },
  { id: '2',  date: '2026-03-15', sport: 'Cycling',  durationMin: 120, preWeightKg: 74.4, postWeightKg: 72.9, fluidIntakeLiters: 1.2 },
  { id: '3',  date: '2026-03-13', sport: 'Running',  durationMin: 60,  preWeightKg: 74.1, postWeightKg: 73.2, fluidIntakeLiters: 0.3 },
  { id: '4',  date: '2026-03-10', sport: 'Swimming', durationMin: 50,  preWeightKg: 74.3, postWeightKg: 73.9, fluidIntakeLiters: 0.2 },
  { id: '5',  date: '2026-03-08', sport: 'Running',  durationMin: 90,  preWeightKg: 74.0, postWeightKg: 72.5, fluidIntakeLiters: 0.8 },
  { id: '6',  date: '2026-03-05', sport: 'Cycling',  durationMin: 105, preWeightKg: 74.5, postWeightKg: 73.2, fluidIntakeLiters: 1.0 },
  { id: '7',  date: '2026-03-02', sport: 'Running',  durationMin: 45,  preWeightKg: 74.2, postWeightKg: 73.6, fluidIntakeLiters: 0.2 },
  { id: '8',  date: '2026-02-28', sport: 'HIIT',     durationMin: 40,  preWeightKg: 74.3, postWeightKg: 73.7, fluidIntakeLiters: 0.3 },
  { id: '9',  date: '2026-02-25', sport: 'Running',  durationMin: 80,  preWeightKg: 74.1, postWeightKg: 72.8, fluidIntakeLiters: 0.6 },
  { id: '10', date: '2026-02-22', sport: 'Cycling',  durationMin: 135, preWeightKg: 74.6, postWeightKg: 73.0, fluidIntakeLiters: 1.4 },
  { id: '11', date: '2026-02-18', sport: 'Swimming', durationMin: 55,  preWeightKg: 74.3, postWeightKg: 74.0, fluidIntakeLiters: 0.2 },
  { id: '12', date: '2026-02-15', sport: 'Running',  durationMin: 70,  preWeightKg: 74.2, postWeightKg: 73.1, fluidIntakeLiters: 0.4 },
]

// ─── Color helpers ─────────────────────────────────────────────────────────────

const INTENSITY_META: Record<IntensityLevel, { color: string; bg: string; border: string; label: string }> = {
  Optimal:     { color: '#34d399', bg: '#34d39915', border: '#34d39930', label: 'Optimal <1%'     },
  Mild:        { color: '#60a5fa', bg: '#60a5fa15', border: '#60a5fa30', label: 'Mild 1–2%'       },
  Caution:     { color: '#fbbf24', bg: '#fbbf2415', border: '#fbbf2430', label: 'Caution 2–3%'    },
  Significant: { color: '#f87171', bg: '#f8717115', border: '#f8717130', label: 'Significant >3%' },
}

const SPORT_COLORS: Record<string, string> = {
  Running:  '#38bdf8',
  Cycling:  '#818cf8',
  Swimming: '#34d399',
  HIIT:     '#fb923c',
}

function sportColor(sport: string): string {
  return SPORT_COLORS[sport] ?? '#94a3b8'
}

// ─── Recharts custom tooltip ──────────────────────────────────────────────────

const tooltipStyle = {
  background: '#0f172a',
  border: '1px solid #1e3a5f',
  borderRadius: 10,
  fontSize: 12,
  color: '#94a3b8',
}

function SweatRateTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const val: number = payload[0].value
  return (
    <div style={tooltipStyle} className="px-3 py-2 shadow-xl">
      <p className="text-slate-400 text-[11px] mb-1">{label}</p>
      <p className="font-mono text-sky-300 font-semibold">{val.toFixed(2)} L/hr</p>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  unit,
  sub,
  accent,
}: {
  label: string
  value: string
  unit?: string
  sub?: string
  accent: string
}) {
  return (
    <div
      className="rounded-2xl border p-4 flex flex-col gap-1 relative overflow-hidden"
      style={{ background: '#0f172a', borderColor: '#1e3a5f' }}
    >
      <div
        className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-10 blur-2xl pointer-events-none"
        style={{ background: accent }}
      />
      <p className="text-[11px] uppercase tracking-widest font-medium" style={{ color: '#4d7fa8' }}>
        {label}
      </p>
      <p className="font-mono text-2xl font-bold leading-none" style={{ color: accent }}>
        {value}
        {unit && <span className="text-sm font-normal ml-1 opacity-70">{unit}</span>}
      </p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: '#4d7fa8' }}>{sub}</p>}
    </div>
  )
}

function HydrationStatusDrop({ avgMassPct }: { avgMassPct: number }) {
  const compliant = avgMassPct < 2
  const fillPct = Math.min(100, (avgMassPct / 4) * 100)
  const color = compliant ? '#34d399' : '#fbbf24'
  const glowColor = compliant ? '#34d39940' : '#fbbf2440'

  return (
    <div
      className="rounded-2xl border p-5 flex flex-col items-center gap-3 relative overflow-hidden"
      style={{ background: '#0f172a', borderColor: compliant ? '#1e4d3a' : '#4d3a0f' }}
    >
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 80%, ${color} 0%, transparent 70%)`,
        }}
      />

      {/* Drop shape SVG */}
      <div className="relative">
        <svg width="80" height="96" viewBox="0 0 80 96" fill="none" className="drop-shadow-lg">
          <defs>
            <clipPath id="dropClip">
              <path d="M40 2C40 2 8 38 8 60C8 79.88 22.12 94 40 94C57.88 94 72 79.88 72 60C72 38 40 2 40 2Z" />
            </clipPath>
            <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.9" />
              <stop offset="100%" stopColor={color} stopOpacity="0.4" />
            </linearGradient>
          </defs>
          {/* Background drop */}
          <path
            d="M40 2C40 2 8 38 8 60C8 79.88 22.12 94 40 94C57.88 94 72 79.88 72 60C72 38 40 2 40 2Z"
            fill="#132030"
            stroke="#1e3a5f"
            strokeWidth="1.5"
          />
          {/* Fluid fill — grows from bottom */}
          <rect
            x="8"
            y={8 + ((1 - fillPct / 100) * 86)}
            width="64"
            height={fillPct / 100 * 86}
            fill="url(#fillGrad)"
            clipPath="url(#dropClip)"
          />
          {/* Shine */}
          <ellipse cx="30" cy="42" rx="5" ry="9" fill="white" opacity="0.08" transform="rotate(-20 30 42)" />
        </svg>

        {/* Glow */}
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-50 pointer-events-none"
          style={{ background: glowColor }}
        />
      </div>

      <div className="text-center">
        <p className="font-mono text-3xl font-bold leading-none" style={{ color }}>
          {avgMassPct.toFixed(2)}%
        </p>
        <p className="text-xs mt-1" style={{ color: '#4d7fa8' }}>avg body mass loss</p>
      </div>

      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border"
        style={{ color, background: glowColor, borderColor: color + '40' }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
        {compliant ? 'Hydration: On Track' : 'Attention: Dehydration Risk'}
      </div>

      <p className="text-[11px] text-center leading-relaxed max-w-[240px]" style={{ color: '#4d7fa8' }}>
        {compliant
          ? 'Average fluid loss below 2% target. Performance not impaired.'
          : 'Average >2% loss impairs aerobic output 3–7% (Cheuvront & Kenefick 2014).'}
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SweatRatePage() {
  const sessions = MOCK_SESSIONS

  // ── Aggregates ──────────────────────────────────────────────────────────────
  const rates = sessions.map(sweatRateLhr)
  const massPcts = sessions.map(massLossPct)
  const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length
  const peakRate = Math.max(...rates)
  const avgMassPct = massPcts.reduce((a, b) => a + b, 0) / massPcts.length

  // ── Bar chart data (last 12 sessions, oldest first) ─────────────────────────
  const chartData = [...sessions]
    .reverse()
    .map((s) => ({
      label: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      rate: +sweatRateLhr(s).toFixed(2),
      sport: s.sport,
    }))

  // ── Hydration targets (80% replacement — Burke & Hawley 2006) ───────────────
  const targets = [
    { duration: '30 min', mins: 30 },
    { duration: '60 min', mins: 60 },
    { duration: '90 min', mins: 90 },
    { duration: '2 hr',   mins: 120 },
  ].map(({ duration, mins }) => {
    const totalSweatL = avgRate * (mins / 60)
    const recommended = totalSweatL * 0.8
    const perKm = recommended / (mins / 60)
    return { duration, totalSweatL, recommended, perKm }
  })

  return (
    <div className="min-h-screen" style={{ background: '#080e1a' }}>
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50 backdrop-blur-md border-b"
        style={{ background: '#080e1acc', borderColor: '#1e3a5f' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/explore"
            className="flex items-center gap-1.5 text-sm transition-colors group"
            style={{ color: '#4d7fa8' }}
          >
            <ArrowLeft className="w-4 h-4 group-hover:text-sky-400 transition-colors" />
            <span className="group-hover:text-sky-400 transition-colors">Back to Explore</span>
          </Link>
          <div className="w-px h-4 mx-0.5" style={{ background: '#1e3a5f' }} />
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Droplets className="w-5 h-5 shrink-0" style={{ color: '#38bdf8' }} />
            <div className="min-w-0">
              <h1 className="text-base font-bold leading-tight text-slate-100 truncate">
                Sweat Rate Estimator
              </h1>
              <p className="text-[11px] leading-none mt-0.5" style={{ color: '#4d7fa8' }}>
                Fluid loss · hydration targets · Sawka 2007
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-28">

        {/* ── Summary cards ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            label="Avg Sweat Rate"
            value={avgRate.toFixed(2)}
            unit="L/hr"
            sub="Sawka 2007 method"
            accent="#38bdf8"
          />
          <StatCard
            label="Peak Session"
            value={peakRate.toFixed(2)}
            unit="L/hr"
            sub="highest recorded"
            accent="#818cf8"
          />
          <div className="col-span-2 sm:col-span-1">
            <StatCard
              label="Avg Mass Loss"
              value={avgMassPct.toFixed(2)}
              unit="%"
              sub={avgMassPct < 2 ? 'Below 2% threshold' : 'Above 2% threshold'}
              accent={avgMassPct < 2 ? '#34d399' : '#fbbf24'}
            />
          </div>
        </div>

        {/* ── Compliance drop ── */}
        <HydrationStatusDrop avgMassPct={avgMassPct} />

        {/* ── Sweat rate bar chart ── */}
        <div
          className="rounded-2xl border p-4"
          style={{ background: '#0f172a', borderColor: '#1e3a5f' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Sweat Rate Per Session</h2>
              <p className="text-[11px] mt-0.5" style={{ color: '#4d7fa8' }}>Last 12 measured sessions</p>
            </div>
            <div
              className="text-[10px] font-mono px-2 py-1 rounded-lg border"
              style={{ color: '#38bdf8', borderColor: '#1e3a5f', background: '#132030' }}
            >
              avg {avgRate.toFixed(2)} L/hr
            </div>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#4d7fa8' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#4d7fa8' }}
                width={28}
                domain={[0, 'auto']}
              />
              <ReferenceLine
                y={avgRate}
                stroke="#38bdf860"
                strokeDasharray="4 3"
                label={{ value: 'avg', position: 'insideTopRight', fontSize: 10, fill: '#38bdf8' }}
              />
              <Tooltip content={<SweatRateTooltip />} cursor={{ fill: '#1e3a5f40' }} />
              <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={sportColor(entry.sport)} opacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Sport legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
            {Object.entries(SPORT_COLORS).map(([sport, color]) => (
              <div key={sport} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                <span className="text-[11px]" style={{ color: '#4d7fa8' }}>{sport}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Session list ── */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: '#0f172a', borderColor: '#1e3a5f' }}
        >
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: '#1e3a5f' }}>
            <h2 className="text-sm font-semibold text-slate-200">Session Detail</h2>
            <span className="text-[11px]" style={{ color: '#4d7fa8' }}>{sessions.length} sessions</span>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm min-w-[540px]">
              <thead>
                <tr className="border-b" style={{ borderColor: '#132030' }}>
                  {['Date', 'Sport', 'Intensity', 'Sweat Rate', 'Fluid Loss', '% Mass'].map((h) => (
                    <th
                      key={h}
                      className={`px-3 py-2.5 text-[11px] font-medium uppercase tracking-wider ${h === 'Date' || h === 'Sport' ? 'text-left' : 'text-right'}`}
                      style={{ color: '#4d7fa8' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const pct = massLossPct(s)
                  const rate = sweatRateLhr(s)
                  const loss = fluidLossKg(s)
                  const level = intensityLevel(pct)
                  const meta = INTENSITY_META[level]
                  return (
                    <tr
                      key={s.id}
                      className="border-b transition-colors hover:bg-slate-800/30"
                      style={{ borderColor: '#132030' }}
                    >
                      <td className="px-3 py-2.5 text-[12px]" style={{ color: '#64748b' }}>
                        {new Date(s.date).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric',
                        })}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className="text-[11px] font-medium px-2 py-0.5 rounded-md"
                          style={{ color: sportColor(s.sport), background: sportColor(s.sport) + '18' }}
                        >
                          {s.sport}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-full border"
                          style={{ color: meta.color, background: meta.bg, borderColor: meta.border }}
                        >
                          {level}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-[12px]" style={{ color: '#38bdf8' }}>
                        {rate.toFixed(2)} L/hr
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-[12px] text-slate-300">
                        {loss.toFixed(2)} kg
                      </td>
                      <td
                        className="px-3 py-2.5 text-right font-mono text-[12px] font-semibold"
                        style={{ color: meta.color }}
                      >
                        {pct.toFixed(2)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Intensity legend */}
          <div className="px-4 py-3 border-t flex flex-wrap gap-x-4 gap-y-1.5" style={{ borderColor: '#132030' }}>
            {(Object.entries(INTENSITY_META) as [IntensityLevel, typeof INTENSITY_META[IntensityLevel]][]).map(([, meta]) => (
              <div key={meta.label} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
                <span className="text-[11px]" style={{ color: '#4d7fa8' }}>{meta.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Personalised hydration targets ── */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: '#0f172a', borderColor: '#1e3a5f' }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: '#1e3a5f' }}>
            <div className="flex items-start gap-2">
              <Droplets className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#38bdf8' }} />
              <div>
                <h2 className="text-sm font-semibold text-slate-200">Personalised Hydration Targets</h2>
                <p className="text-[11px] mt-0.5" style={{ color: '#4d7fa8' }}>
                  80% sweat replacement per Burke &amp; Hawley 2006 · based on your avg {avgRate.toFixed(2)} L/hr
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {targets.map((t) => (
              <div
                key={t.duration}
                className="rounded-xl border p-3 flex flex-col gap-1.5 text-center"
                style={{ background: '#080e1a', borderColor: '#1e3a5f' }}
              >
                <p className="text-[10px] uppercase tracking-widest font-medium" style={{ color: '#4d7fa8' }}>
                  {t.duration}
                </p>
                <p className="font-mono text-xl font-bold leading-none" style={{ color: '#38bdf8' }}>
                  {(t.recommended * 1000).toFixed(0)}
                  <span className="text-xs font-normal ml-0.5 opacity-60">ml</span>
                </p>
                <p className="text-[10px] leading-relaxed" style={{ color: '#4d7fa8' }}>
                  ≈{(t.perKm * 1000).toFixed(0)} ml every 15 min
                </p>
                <div
                  className="mt-1 text-[10px] font-mono px-1.5 py-0.5 rounded-md border self-center"
                  style={{ color: '#818cf8', borderColor: '#818cf830', background: '#818cf810' }}
                >
                  {t.totalSweatL.toFixed(2)} L total loss
                </div>
              </div>
            ))}
          </div>

          <div
            className="mx-4 mb-4 rounded-xl border p-3 flex gap-2"
            style={{ background: '#0a1628', borderColor: '#1e3a5f' }}
          >
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#38bdf8' }} />
            <p className="text-[11px] leading-relaxed" style={{ color: '#4d7fa8' }}>
              Casa et al. 2000 (J Athl Train): match fluid intake to your individual sweat rate — not a
              fixed schedule. These targets are based on your personal measurement history.
            </p>
          </div>
        </div>

        {/* ── How to measure ── */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: '#0f172a', borderColor: '#1e3a5f' }}
        >
          <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: '#1e3a5f' }}>
            <FlaskConical className="w-4 h-4" style={{ color: '#818cf8' }} />
            <h2 className="text-sm font-semibold text-slate-200">How to Measure Your Sweat Rate</h2>
          </div>
          <div className="p-4 space-y-3">
            {[
              {
                step: '01',
                title: 'Weigh yourself pre-workout',
                body: 'Use a digital scale in minimal clothing immediately before you exercise. Record to the nearest 0.1 kg.',
              },
              {
                step: '02',
                title: 'Track all fluids consumed',
                body: 'Note every ml you drink during the session. A measured bottle makes this precise.',
              },
              {
                step: '03',
                title: 'Weigh yourself post-workout',
                body: 'Same conditions: minimal dry clothing, no shower yet. Towel off any sweat first.',
              },
              {
                step: '04',
                title: 'Apply the Sawka formula',
                body: 'Sweat rate (L/hr) = (pre − post + fluid intake in L) ÷ duration (hrs). 1 kg ≈ 1 litre.',
              },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex gap-3">
                <span
                  className="font-mono text-[11px] font-bold shrink-0 w-6 pt-0.5"
                  style={{ color: '#4d7fa8' }}
                >
                  {step}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-200">{title}</p>
                  <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: '#4d7fa8' }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Science card ── */}
        <div
          className="rounded-2xl border p-4 relative overflow-hidden"
          style={{ background: '#0f172a', borderColor: '#1e3a5f' }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, #38bdf840, transparent)' }}
          />
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% -20%, #38bdf8 0%, transparent 65%)' }}
          />

          <div className="relative flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 shrink-0" style={{ color: '#38bdf8' }} />
            <h2 className="text-sm font-semibold text-slate-200">Science &amp; Citations</h2>
          </div>

          <div className="relative space-y-3">
            {[
              {
                ref: 'Sawka et al. 2007',
                pub: 'Med Sci Sports Exerc (ACSM position stand)',
                text: 'Sweat rate = (pre-exercise mass − post-exercise mass + fluid intake) / exercise duration. 1 kg body mass loss ≈ 1 litre of fluid loss. The gold-standard field measurement protocol.',
              },
              {
                ref: 'Cheuvront & Kenefick 2014',
                pub: 'Compr Physiol',
                text: 'Dehydration exceeding 2% of body mass impairs aerobic exercise performance by 3–7%. Cognitive effects begin around 1–2%.',
              },
              {
                ref: 'Casa et al. 2000',
                pub: 'J Athl Train',
                text: 'Athletes should match fluid intake to their individual sweat rate rather than following a fixed drinking schedule. Thirst alone underestimates needs during intense exercise.',
              },
              {
                ref: 'Burke & Hawley 2006',
                pub: 'Sports nutrition consensus',
                text: 'Replacing approximately 80% of sweat losses during exercise balances hydration with the practical constraints of competition and training.',
              },
            ].map(({ ref, pub, text }) => (
              <div
                key={ref}
                className="rounded-xl border p-3"
                style={{ background: '#080e1a', borderColor: '#1e3a5f' }}
              >
                <div className="flex items-start gap-2 mb-1">
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#38bdf8' }} />
                  <div>
                    <span className="text-[12px] font-semibold" style={{ color: '#38bdf8' }}>{ref}</span>
                    <span className="text-[11px] ml-1.5 italic" style={{ color: '#4d7fa8' }}>— {pub}</span>
                  </div>
                </div>
                <p className="text-[12px] leading-relaxed pl-5" style={{ color: '#64748b' }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
