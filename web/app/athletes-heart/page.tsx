'use client'

import Link from 'next/link'
import { ArrowLeft, Activity, TrendingDown, TrendingUp, FlaskConical, ChevronRight } from 'lucide-react'
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

// ─── Mock Data Generation ────────────────────────────────────────────────────

function noise(amplitude: number): number {
  return (Math.random() - 0.5) * 2 * amplitude
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const rawData = MONTHS.map((month, i) => {
  const rhr = Math.round((62 - 0.65 * i + noise(1.5)) * 10) / 10
  const hrv = Math.round((38 + 0.9 * i + noise(2)) * 10) / 10
  const vo2 = Math.round((44.5 + 0.31 * i + noise(0.6)) * 10) / 10
  return { month, rhr, hrv, vo2 }
})

// Normalize for composite chart
// RHR (lower better): score = (80 - val) / (80 - 40) * 100
// HRV (higher better): score = (val - 20) / (80 - 20) * 100
// VO2 (higher better): score = (val - 30) / (65 - 30) * 100
const chartData = rawData.map((d) => ({
  month: d.month,
  rhr: d.rhr,
  hrv: d.hrv,
  vo2: d.vo2,
  rhrScore: Math.round(((80 - d.rhr) / (80 - 40)) * 100 * 10) / 10,
  hrvScore: Math.round(((d.hrv - 20) / (80 - 20)) * 100 * 10) / 10,
  vo2Score: Math.round(((d.vo2 - 30) / (65 - 30)) * 100 * 10) / 10,
}))

// Deltas
const rhrDelta = Math.round((rawData[11].rhr - rawData[0].rhr) * 10) / 10  // negative = good
const hrvDelta = Math.round((rawData[11].hrv - rawData[0].hrv) * 10) / 10  // positive = good
const vo2Delta = Math.round((rawData[11].vo2 - rawData[0].vo2) * 10) / 10  // positive = good

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  const point = chartData.find((d) => d.month === label)
  if (!point) return null

  return (
    <div
      style={{
        background: 'rgba(10, 12, 20, 0.96)',
        border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: 10,
        padding: '12px 16px',
        fontSize: 12,
        backdropFilter: 'blur(8px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        minWidth: 160,
      }}
    >
      <p style={{ color: '#ef4444', fontWeight: 700, marginBottom: 8, fontSize: 13, letterSpacing: '0.05em' }}>
        {label}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: '#ef4444', opacity: 0.8 }}>RHR</span>
          <span style={{ color: '#ef4444', fontWeight: 600 }}>{point.rhr} bpm <span style={{ opacity: 0.5 }}>({point.rhrScore})</span></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: '#22c55e', opacity: 0.8 }}>HRV</span>
          <span style={{ color: '#22c55e', fontWeight: 600 }}>{point.hrv} ms <span style={{ opacity: 0.5 }}>({point.hrvScore})</span></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: '#3b82f6', opacity: 0.8 }}>VO₂ Max</span>
          <span style={{ color: '#3b82f6', fontWeight: 600 }}>{point.vo2} mL/kg/min <span style={{ opacity: 0.5 }}>({point.vo2Score})</span></span>
        </div>
      </div>
    </div>
  )
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function MiniSparkline({ values, color, inverted = false }: { values: number[]; color: string; inverted?: boolean }) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const w = 64
  const h = 24
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w
    const normalized = inverted ? (max - v) / range : (v - min) / range
    const y = h - normalized * (h - 4) - 2
    return `${x},${y}`
  })
  const pathD = `M ${pts.join(' L ')}`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <path d={pathD} stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].split(',')[0]} cy={pts[pts.length - 1].split(',')[1]} r={2.5} fill={color} />
    </svg>
  )
}

// ─── Phase Cards ──────────────────────────────────────────────────────────────

const phases = [
  {
    range: 'Weeks 1–4',
    title: 'Plasma Volume & Stroke Volume',
    desc: 'RHR begins dropping as plasma volume expands, increasing stroke volume. The heart pumps more blood per beat.',
    color: '#ef4444',
    dot: 'bg-red-500',
  },
  {
    range: 'Weeks 4–12',
    title: 'Parasympathetic Upregulation',
    desc: 'HRV increases as vagal tone improves. Parasympathetic dominance at rest is a hallmark of aerobic fitness.',
    color: '#22c55e',
    dot: 'bg-green-500',
  },
  {
    range: 'Months 3–6',
    title: 'Mitochondrial & Capillary Gains',
    desc: 'VO₂ max rises from mitochondrial biogenesis, capillary density increases, and improved oxygen extraction.',
    color: '#3b82f6',
    dot: 'bg-blue-500',
  },
  {
    range: 'Months 6–12+',
    title: 'Structural Cardiac Remodeling',
    desc: 'Left ventricular volume enlarges (eccentric hypertrophy). Larger stroke volume, lower resting demand, efficient heart.',
    color: '#a855f7',
    dot: 'bg-purple-500',
  },
]

// ─── Custom Legend ────────────────────────────────────────────────────────────

function CustomLegend() {
  return (
    <div className="flex items-center justify-center gap-6 mt-2 mb-1">
      <div className="flex items-center gap-2">
        <svg width={28} height={10}>
          <line x1={0} y1={5} x2={28} y2={5} stroke="#ef4444" strokeWidth={2} strokeDasharray="4 3" />
        </svg>
        <span className="text-xs text-red-400 font-medium">Resting HR</span>
      </div>
      <div className="flex items-center gap-2">
        <svg width={28} height={10}>
          <line x1={0} y1={5} x2={28} y2={5} stroke="#22c55e" strokeWidth={2} />
        </svg>
        <span className="text-xs text-green-400 font-medium">HRV</span>
      </div>
      <div className="flex items-center gap-2">
        <svg width={28} height={10}>
          <line x1={0} y1={5} x2={28} y2={5} stroke="#3b82f6" strokeWidth={2} />
        </svg>
        <span className="text-xs text-blue-400 font-medium">VO₂ Max</span>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AthletesHeartPage() {
  const rhrValues = rawData.map((d) => d.rhr)
  const hrvValues = rawData.map((d) => d.hrv)
  const vo2Values = rawData.map((d) => d.vo2)

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(160deg, #080b14 0%, #0d1220 40%, #0a0e1a 100%)',
        fontFamily: '"DM Sans", system-ui, -apple-system, sans-serif',
      }}
    >
      {/* ECG grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(239,68,68,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(239,68,68,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
          zIndex: 0,
        }}
      />

      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: 'rgba(8, 11, 20, 0.85)',
          backdropFilter: 'blur(16px)',
          borderColor: 'rgba(239,68,68,0.12)',
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/heartrate"
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2.5 flex-1">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              <Activity className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h1
                className="font-bold leading-tight"
                style={{ fontSize: 18, color: '#f8fafc', letterSpacing: '-0.01em' }}
              >
                Athlete&apos;s Heart
              </h1>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', marginTop: 1 }}>
                Cardiac adaptation markers · 12-month progression
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-6 pb-24 space-y-5">

        {/* ── Hero Section ── */}
        <div
          className="rounded-2xl overflow-hidden relative"
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.18) 0%, rgba(239,68,68,0.06) 50%, rgba(59,130,246,0.08) 100%)',
            border: '1px solid rgba(239,68,68,0.2)',
          }}
        >
          {/* Decorative heartbeat line */}
          <div className="absolute top-0 left-0 right-0 overflow-hidden" style={{ height: 3 }}>
            <div
              className="h-full w-full"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, #ef4444 30%, #ef4444 35%, transparent 38%, transparent 42%, #ef4444 44%, #ef4444 46%, transparent 49%, transparent 55%, #ef4444 57%, transparent 60%, transparent 100%)',
              }}
            />
          </div>

          <div className="px-6 py-7">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p
                  className="font-black tracking-tight"
                  style={{
                    fontSize: 42,
                    lineHeight: 1,
                    background: 'linear-gradient(135deg, #ef4444 0%, #f87171 60%, #fca5a5 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontFeatureSettings: '"ss01"',
                  }}
                >
                  ATHLETE&apos;S
                </p>
                <p
                  className="font-black tracking-tight"
                  style={{
                    fontSize: 42,
                    lineHeight: 1.05,
                    color: '#f1f5f9',
                    fontFeatureSettings: '"ss01"',
                  }}
                >
                  HEART
                </p>
                <p className="mt-3" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', maxWidth: 340, lineHeight: 1.6 }}>
                  The physiological signature of sustained aerobic training — measured across three cardiac adaptation biomarkers.
                </p>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                {[
                  { label: 'RHR', value: `${rawData[0].rhr}→${rawData[11].rhr}`, unit: 'bpm', color: '#ef4444' },
                  { label: 'HRV', value: `${rawData[0].hrv}→${rawData[11].hrv}`, unit: 'ms', color: '#22c55e' },
                  { label: 'VO₂', value: `${rawData[0].vo2}→${rawData[11].vo2}`, unit: 'mL/kg/min', color: '#3b82f6' },
                ].map(({ label, value, unit, color }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${color}22` }}
                  >
                    <span className="text-xs font-bold w-8" style={{ color }}>{label}</span>
                    <span className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>{value}</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{unit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Adaptation Status Banner ── */}
        <div
          className="rounded-xl px-5 py-4 flex items-center gap-4"
          style={{
            background: 'linear-gradient(90deg, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.05) 100%)',
            border: '1px solid rgba(34,197,94,0.22)',
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}
          >
            <Activity className="w-5 h-5 text-green-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-green-400" style={{ fontSize: 15, letterSpacing: '-0.01em' }}>
              Strong Adaptation
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
              3/3 markers improving over 12 months — sustained aerobic training effect confirmed
            </p>
          </div>
          <div
            className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}
          >
            IMPROVING
          </div>
        </div>

        {/* ── Triple-Axis Normalized Chart ── */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(12, 16, 28, 0.8)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="mb-4">
            <h2 className="font-bold" style={{ fontSize: 15, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
              Composite Adaptation Score
            </h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
              All metrics normalized to 0–100 · 100 = best possible value for each metric
            </p>
          </div>

          <CustomLegend />

          <div style={{ height: 280, marginTop: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  horizontal={true}
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickCount={6}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend content={() => null} />
                {/* RHR — red dashed (inverted: lower is better → higher score) */}
                <Line
                  type="monotone"
                  dataKey="rhrScore"
                  name="Resting HR"
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={false}
                  activeDot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }}
                />
                {/* HRV — green solid */}
                <Line
                  type="monotone"
                  dataKey="hrvScore"
                  name="HRV"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }}
                />
                {/* VO2 — blue solid */}
                <Line
                  type="monotone"
                  dataKey="vo2Score"
                  name="VO₂ Max"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── 3 Adaptation Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* RHR Card */}
          <div
            className="rounded-xl p-5 flex flex-col gap-3"
            style={{
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.15)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em' }}>
                  RESTING HR
                </span>
              </div>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}
              >
                Improving
              </span>
            </div>

            <div>
              <p className="font-black" style={{ fontSize: 28, color: '#ef4444', lineHeight: 1, letterSpacing: '-0.02em' }}>
                {rhrDelta > 0 ? '+' : ''}{rhrDelta} <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.7 }}>bpm</span>
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                over 12 months · lower is better
              </p>
            </div>

            <div className="flex items-end justify-between">
              <MiniSparkline values={rhrValues} color="#ef4444" inverted={true} />
              <div className="flex items-center gap-1" style={{ color: '#22c55e' }}>
                <TrendingDown className="w-4 h-4" />
                <span className="text-xs font-semibold">{rawData[11].rhr} bpm</span>
              </div>
            </div>
          </div>

          {/* HRV Card */}
          <div
            className="rounded-xl p-5 flex flex-col gap-3"
            style={{
              background: 'rgba(34,197,94,0.06)',
              border: '1px solid rgba(34,197,94,0.15)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em' }}>
                  HRV (SDNN)
                </span>
              </div>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}
              >
                Improving
              </span>
            </div>

            <div>
              <p className="font-black" style={{ fontSize: 28, color: '#22c55e', lineHeight: 1, letterSpacing: '-0.02em' }}>
                +{hrvDelta} <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.7 }}>ms</span>
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                over 12 months · higher is better
              </p>
            </div>

            <div className="flex items-end justify-between">
              <MiniSparkline values={hrvValues} color="#22c55e" />
              <div className="flex items-center gap-1" style={{ color: '#22c55e' }}>
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-semibold">{rawData[11].hrv} ms</span>
              </div>
            </div>
          </div>

          {/* VO2 Card */}
          <div
            className="rounded-xl p-5 flex flex-col gap-3"
            style={{
              background: 'rgba(59,130,246,0.06)',
              border: '1px solid rgba(59,130,246,0.15)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em' }}>
                  VO₂ MAX
                </span>
              </div>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}
              >
                Improving
              </span>
            </div>

            <div>
              <p className="font-black" style={{ fontSize: 28, color: '#3b82f6', lineHeight: 1, letterSpacing: '-0.02em' }}>
                +{vo2Delta} <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.7 }}>mL/kg/min</span>
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
                over 12 months · higher is better
              </p>
            </div>

            <div className="flex items-end justify-between">
              <MiniSparkline values={vo2Values} color="#3b82f6" />
              <div className="flex items-center gap-1" style={{ color: '#3b82f6' }}>
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-semibold">{rawData[11].vo2}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Expected Adaptation Timeline ── */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(12, 16, 28, 0.8)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <h2 className="font-bold mb-4" style={{ fontSize: 15, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
            Expected Adaptation Timeline
          </h2>

          <div className="flex flex-col gap-3">
            {phases.map((phase, i) => (
              <div
                key={i}
                className="flex gap-4 p-4 rounded-xl"
                style={{
                  background: 'rgba(0,0,0,0.25)',
                  borderLeft: `3px solid ${phase.color}`,
                  border: `1px solid rgba(255,255,255,0.04)`,
                  borderLeftColor: phase.color,
                  borderLeftWidth: 3,
                }}
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded"
                      style={{
                        background: `${phase.color}18`,
                        color: phase.color,
                        border: `1px solid ${phase.color}30`,
                        fontFamily: 'monospace',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {phase.range}
                    </span>
                    <span className="font-semibold" style={{ fontSize: 13, color: '#e2e8f0' }}>
                      {phase.title}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginTop: 2 }}>
                    {phase.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Science Card ── */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(12, 16, 28, 0.8)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.25)' }}
            >
              <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <h2 className="font-bold" style={{ fontSize: 15, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
              The Science of Athlete&apos;s Heart
            </h2>
          </div>

          <div className="space-y-4">
            {/* Definition */}
            <div
              className="rounded-xl p-4"
              style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.12)' }}
            >
              <p className="font-semibold mb-1.5" style={{ fontSize: 13, color: '#d8b4fe' }}>
                What is Athlete&apos;s Heart?
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
                Athlete&apos;s heart is a cluster of structural and functional cardiac adaptations that develop in response to regular, sustained aerobic exercise. It is a benign, reversible physiological phenomenon — not a disease — characterized by increased cardiac output efficiency and autonomic rebalancing toward parasympathetic dominance.
              </p>
            </div>

            {/* Citations */}
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Key Research
              </p>

              {[
                {
                  author: 'Henschen, S.',
                  year: '1899',
                  title: 'Skilanglauf und Skiwettlauf: Eine medizinische Sportstudie',
                  note: 'First observation of cardiac enlargement in cross-country skiers using percussion — the founding study of athlete\'s heart.',
                },
                {
                  author: 'Pelliccia, A. et al.',
                  year: '2018',
                  title: 'ESC Position Paper on Recreational Physical Activity and Sport.',
                  note: 'Defines echocardiographic criteria distinguishing athlete\'s heart from cardiomyopathy. Key finding: detraining reverses morphological changes within 3–6 months.',
                },
                {
                  author: 'Detraining timeline',
                  year: '',
                  title: 'Reversibility of cardiac adaptations',
                  note: 'RHR returns toward baseline in 4–8 weeks of detraining. HRV and VO₂ max normalization follows within 2–3 months. Structural remodeling is the most persistent — LV dimensions can remain elevated for 6+ months.',
                },
              ].map((ref, i) => (
                <div
                  key={i}
                  className="flex gap-3 p-3.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <ChevronRight className="w-3.5 h-3.5 mt-0.5 shrink-0 text-purple-500 opacity-70" />
                  <div>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>
                      {ref.author}{ref.year && <span style={{ color: 'rgba(255,255,255,0.3)' }}> · {ref.year}</span>}
                    </p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic', marginTop: 1 }}>
                      {ref.title}
                    </p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4, lineHeight: 1.6 }}>
                      {ref.note}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p
              className="text-xs rounded-lg px-3 py-2.5"
              style={{
                color: 'rgba(255,255,255,0.25)',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                lineHeight: 1.6,
              }}
            >
              Data shown is illustrative mock data representing typical adaptation trajectories. Individual results vary significantly based on training volume, intensity distribution, baseline fitness, age, and genetics. Not a medical diagnostic tool.
            </p>
          </div>
        </div>

      </main>
    </div>
  )
}
