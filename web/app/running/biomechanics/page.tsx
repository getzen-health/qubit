'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Activity,
  TrendingUp,
  TrendingDown,
  FlaskConical,
  X,
  ChevronRight,
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
  ReferenceLine,
  Dot,
} from 'recharts'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface RunSession {
  date: string        // YYYY-MM-DD
  dateLabel: string   // "Jan 6"
  dayIndex: number    // 0–89
  gct: number         // ground contact time ms
  vo: number          // vertical oscillation cm
  stride: number      // stride length m
  power: number | null // watts (null = no Watch Ultra reading)
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────
// 30 runs over 90 days (Dec 20 2025 – Mar 20 2026).
// Avg GCT ~235ms (trending down toward 240ms target).
// Avg VO ~7.8cm (trending down, just below 8cm target).
// Avg stride ~1.32m (gentle upward trend as efficiency improves).

const RAW: Array<{
  date: string
  gct: number
  vo: number
  stride: number
  power: number | null
}> = [
  { date: '2025-12-20', gct: 258, vo:  9.1, stride: 1.19, power: null },
  { date: '2025-12-23', gct: 252, vo:  8.8, stride: 1.21, power: null },
  { date: '2025-12-26', gct: 255, vo:  8.9, stride: 1.20, power: null },
  { date: '2025-12-29', gct: 249, vo:  8.6, stride: 1.23, power: 248 },
  { date: '2026-01-01', gct: 247, vo:  8.4, stride: 1.24, power: null },
  { date: '2026-01-04', gct: 244, vo:  8.5, stride: 1.25, power: 251 },
  { date: '2026-01-07', gct: 246, vo:  8.2, stride: 1.26, power: null },
  { date: '2026-01-10', gct: 241, vo:  8.0, stride: 1.27, power: 255 },
  { date: '2026-01-13', gct: 243, vo:  8.1, stride: 1.27, power: null },
  { date: '2026-01-16', gct: 238, vo:  7.9, stride: 1.29, power: 258 },
  { date: '2026-01-19', gct: 240, vo:  7.8, stride: 1.28, power: null },
  { date: '2026-01-22', gct: 237, vo:  7.7, stride: 1.30, power: 261 },
  { date: '2026-01-25', gct: 235, vo:  7.8, stride: 1.31, power: null },
  { date: '2026-01-28', gct: 232, vo:  7.6, stride: 1.32, power: 264 },
  { date: '2026-01-31', gct: 234, vo:  7.5, stride: 1.32, power: null },
  { date: '2026-02-03', gct: 229, vo:  7.4, stride: 1.33, power: 267 },
  { date: '2026-02-06', gct: 231, vo:  7.6, stride: 1.33, power: null },
  { date: '2026-02-09', gct: 228, vo:  7.3, stride: 1.34, power: 271 },
  { date: '2026-02-12', gct: 230, vo:  7.5, stride: 1.34, power: null },
  { date: '2026-02-15', gct: 227, vo:  7.2, stride: 1.35, power: 274 },
  { date: '2026-02-18', gct: 229, vo:  7.4, stride: 1.35, power: null },
  { date: '2026-02-21', gct: 225, vo:  7.1, stride: 1.36, power: 277 },
  { date: '2026-02-24', gct: 227, vo:  7.3, stride: 1.36, power: null },
  { date: '2026-02-27', gct: 224, vo:  7.0, stride: 1.37, power: 279 },
  { date: '2026-03-02', gct: 226, vo:  7.2, stride: 1.37, power: null },
  { date: '2026-03-05', gct: 222, vo:  6.9, stride: 1.38, power: 282 },
  { date: '2026-03-08', gct: 224, vo:  7.1, stride: 1.38, power: null },
  { date: '2026-03-12', gct: 221, vo:  6.8, stride: 1.39, power: 285 },
  { date: '2026-03-16', gct: 223, vo:  7.0, stride: 1.39, power: null },
  { date: '2026-03-20', gct: 220, vo:  6.9, stride: 1.40, power: 287 },
]

const START_DATE = new Date('2025-12-20')

function dayIndex(dateStr: string): number {
  return Math.round((new Date(dateStr).getTime() - START_DATE.getTime()) / 86_400_000)
}

function fmtDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const RUNS: RunSession[] = RAW.map((r) => ({
  date:      r.date,
  dateLabel: fmtDateShort(r.date),
  dayIndex:  dayIndex(r.date),
  gct:       r.gct,
  vo:        r.vo,
  stride:    r.stride,
  power:     r.power,
}))

// ─── Derived stats ─────────────────────────────────────────────────────────────

const avgGct    = Math.round(RUNS.reduce((s, r) => s + r.gct, 0) / RUNS.length)
const avgVo     = +(RUNS.reduce((s, r) => s + r.vo, 0) / RUNS.length).toFixed(1)
const avgStride = +(RUNS.reduce((s, r) => s + r.stride, 0) / RUNS.length).toFixed(2)

const powerRuns   = RUNS.filter((r) => r.power !== null)
const avgPower    = powerRuns.length
  ? Math.round(powerRuns.reduce((s, r) => s + (r.power ?? 0), 0) / powerRuns.length)
  : null

// Trend: first 10 vs last 10 runs
const firstTenGct    = +(RUNS.slice(0, 10).reduce((s, r) => s + r.gct, 0) / 10).toFixed(1)
const lastTenGct     = +(RUNS.slice(-10).reduce((s, r) => s + r.gct, 0) / 10).toFixed(1)
const firstTenVo     = +(RUNS.slice(0, 10).reduce((s, r) => s + r.vo, 0) / 10).toFixed(1)
const lastTenVo      = +(RUNS.slice(-10).reduce((s, r) => s + r.vo, 0) / 10).toFixed(1)
const firstTenStride = +(RUNS.slice(0, 10).reduce((s, r) => s + r.stride, 0) / 10).toFixed(2)
const lastTenStride  = +(RUNS.slice(-10).reduce((s, r) => s + r.stride, 0) / 10).toFixed(2)

// ─── Score helpers ────────────────────────────────────────────────────────────

// GCT: <200ms = elite (100), 200–239ms = good (60–99), 240–280ms = target zone (20–59), >280 = poor
function gctScore(ms: number): number {
  if (ms <= 200) return 100
  if (ms <= 239) return Math.round(100 - ((ms - 200) / 39) * 40)
  if (ms <= 280) return Math.round(60 - ((ms - 240) / 40) * 40)
  return Math.max(0, Math.round(20 - ((ms - 280) / 40) * 20))
}

// VO: <6cm = elite, 6–8cm = good, 8–10cm = ok, >10cm = poor
function voScore(cm: number): number {
  if (cm <= 6) return 100
  if (cm <= 8) return Math.round(100 - ((cm - 6) / 2) * 30)
  if (cm <= 10) return Math.round(70 - ((cm - 8) / 2) * 40)
  return Math.max(0, Math.round(30 - ((cm - 10) / 2) * 30))
}

// Stride: context-dependent — for a ~5:00/km pace, ~1.3–1.4m is ideal
function strideScore(m: number): number {
  if (m >= 1.30 && m <= 1.45) return 100
  if (m >= 1.20 && m < 1.30) return Math.round(70 + ((m - 1.20) / 0.10) * 30)
  if (m > 1.45 && m <= 1.60) return Math.round(70 + ((1.60 - m) / 0.15) * 30)
  return 50
}

const gctScoreVal    = gctScore(avgGct)
const voScoreVal     = voScore(avgVo)
const strideScoreVal = strideScore(avgStride)

// ─── Chart data ───────────────────────────────────────────────────────────────

// LineChart expects flat array; we use dateLabel on X axis
const GCT_DATA    = RUNS.map((r) => ({ label: r.dateLabel, value: r.gct,    date: r.date }))
const VO_DATA     = RUNS.map((r) => ({ label: r.dateLabel, value: r.vo,     date: r.date }))
const STRIDE_DATA = RUNS.map((r) => ({ label: r.dateLabel, value: r.stride, date: r.date }))

// ─── Custom dot (colours green if below target) ───────────────────────────────

interface DotProps {
  cx?: number
  cy?: number
  payload?: { value: number }
  target: number
  below: boolean  // true = green when value < target
  color: string
}

function MetricDot({ cx = 0, cy = 0, payload, target, below, color }: DotProps) {
  if (cx === undefined || cy === undefined || !payload) return null
  const val   = payload.value
  const good  = below ? val < target : val >= target
  const fill  = good ? '#22c55e' : color
  return <circle cx={cx} cy={cy} r={4} fill={fill} stroke="transparent" />
}

// ─── Custom Tooltips ──────────────────────────────────────────────────────────

interface GctTipPayload {
  payload?: { value: number; date: string }
}
function GctTooltip({ active, payload }: { active?: boolean; payload?: GctTipPayload[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  const good = d.value < 240
  return (
    <div style={{ background: 'rgba(12,12,18,0.97)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontFamily: 'ui-monospace,monospace' }}>
      <p style={{ color: '#ccc', marginBottom: 2 }}>{fmtDateShort(d.date)}</p>
      <p style={{ color: good ? '#22c55e' : '#f97316', fontWeight: 700 }}>{d.value} ms</p>
      <p style={{ color: good ? '#22c55e' : '#f97316', fontSize: 10 }}>{good ? 'Below target' : 'Above target'}</p>
    </div>
  )
}

interface VoTipPayload {
  payload?: { value: number; date: string }
}
function VoTooltip({ active, payload }: { active?: boolean; payload?: VoTipPayload[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  const good = d.value < 8
  return (
    <div style={{ background: 'rgba(12,12,18,0.97)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontFamily: 'ui-monospace,monospace' }}>
      <p style={{ color: '#ccc', marginBottom: 2 }}>{fmtDateShort(d.date)}</p>
      <p style={{ color: good ? '#22c55e' : '#3b82f6', fontWeight: 700 }}>{d.value} cm</p>
      <p style={{ color: good ? '#22c55e' : '#3b82f6', fontSize: 10 }}>{good ? 'Below target' : 'Above target'}</p>
    </div>
  )
}

interface StrideTipPayload {
  payload?: { value: number; date: string }
}
function StrideTooltip({ active, payload }: { active?: boolean; payload?: StrideTipPayload[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div style={{ background: 'rgba(12,12,18,0.97)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontFamily: 'ui-monospace,monospace' }}>
      <p style={{ color: '#ccc', marginBottom: 2 }}>{fmtDateShort(d.date)}</p>
      <p style={{ color: '#a855f7', fontWeight: 700 }}>{d.value.toFixed(2)} m</p>
    </div>
  )
}

// ─── Score Bar ────────────────────────────────────────────────────────────────

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${score}%`, background: color }}
      />
    </div>
  )
}

// ─── Ticks helper ─────────────────────────────────────────────────────────────

function everyNthLabel(data: { label: string }[], n = 5): string[] {
  return data.map((d, i) => (i % n === 0 || i === data.length - 1 ? d.label : '')).filter(Boolean)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RunningBiomechanicsPage() {
  const [bannerDismissed, setBannerDismissed] = useState(false)

  return (
    <div className="min-h-screen bg-background">

      {/* ── Sticky Header ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/explore"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to explore"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <Activity className="w-5 h-5 text-orange-400 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-text-primary truncate">Running Biomechanics</h1>
              <p className="text-sm text-text-secondary truncate">
                Ground contact · oscillation · stride · power
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ── iOS Notice Banner ─────────────────────────────────────────────── */}
      {!bannerDismissed && (
        <div
          className="border-b"
          style={{ background: 'rgba(30,27,20,0.9)', borderColor: 'rgba(251,191,36,0.2)' }}
        >
          <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center gap-3">
            <div
              className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-xs font-black"
              style={{ background: 'rgba(251,191,36,0.18)', color: '#fbbf24' }}
            >
              i
            </div>
            <p className="text-xs text-text-secondary flex-1 leading-relaxed">
              <span className="font-semibold" style={{ color: '#fbbf24' }}>iOS 16+ &amp; Apple Watch Series 8/Ultra required</span>
              {' '}— Ground contact time, vertical oscillation, stride length, and running power are measured by
              the onboard accelerometer and require watchOS 9+. Running Power additionally needs Watch Ultra or a paired Stryd pod.
            </p>
            <button
              onClick={() => setBannerDismissed(true)}
              className="p-1 rounded-md hover:bg-white/10 transition-colors shrink-0"
              aria-label="Dismiss notice"
            >
              <X className="w-3.5 h-3.5 text-text-secondary" />
            </button>
          </div>
        </div>
      )}

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1c0d00 0%, #7c2d12 40%, #c2410c 70%, #f97316 100%)',
        }}
      >
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
            Running Form · Apple Watch Series 8 / Ultra
          </p>
          <h2
            className="text-3xl sm:text-4xl font-black text-white leading-tight mb-3"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}
          >
            Biomechanics
          </h2>
          <p className="text-white/80 text-sm max-w-md leading-relaxed">
            Ground contact time, vertical oscillation, and stride length are the three mechanical
            pillars of running economy. Together they determine how much energy you spend per metre.
          </p>
          {/* Decorative waveform */}
          <div className="absolute right-4 top-0 bottom-0 flex items-center gap-1 opacity-15 hidden sm:flex">
            {[20, 36, 52, 44, 60, 48, 56, 40, 64, 52, 44, 36].map((h, i) => (
              <div
                key={i}
                className="w-1 rounded-full"
                style={{ height: h, background: 'rgba(255,255,255,0.9)' }}
              />
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-28 space-y-6">

        {/* ── 4-Metric Summary Grid ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">

          {/* GCT Card */}
          <div
            className="rounded-2xl border p-4 flex flex-col gap-3 relative overflow-hidden"
            style={{ background: 'rgba(249,115,22,0.07)', borderColor: 'rgba(249,115,22,0.25)' }}
          >
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg,#f97316,#fb923c)' }} />
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Ground Contact</p>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
              >
                {avgGct < 240 ? 'On Target' : avgGct < 260 ? 'Near Target' : 'Above Target'}
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-3xl font-black leading-none"
                  style={{ color: '#f97316', fontFamily: 'ui-monospace, monospace' }}
                >
                  {avgGct}
                </span>
                <span className="text-sm font-semibold text-text-secondary">ms</span>
              </div>
              <p className="text-xs text-text-secondary mt-1">target &lt;240ms · elite &lt;200ms</p>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-text-secondary">
                <span>Score</span>
                <span style={{ color: '#f97316', fontFamily: 'ui-monospace,monospace' }}>{gctScoreVal}/100</span>
              </div>
              <ScoreBar score={gctScoreVal} color="#f97316" />
            </div>
          </div>

          {/* Vertical Oscillation Card */}
          <div
            className="rounded-2xl border p-4 flex flex-col gap-3 relative overflow-hidden"
            style={{ background: 'rgba(59,130,246,0.07)', borderColor: 'rgba(59,130,246,0.25)' }}
          >
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg,#3b82f6,#60a5fa)' }} />
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Vert. Oscillation</p>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
              >
                {avgVo < 8 ? 'On Target' : avgVo < 10 ? 'Near Target' : 'High'}
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-3xl font-black leading-none"
                  style={{ color: '#3b82f6', fontFamily: 'ui-monospace, monospace' }}
                >
                  {avgVo}
                </span>
                <span className="text-sm font-semibold text-text-secondary">cm</span>
              </div>
              <p className="text-xs text-text-secondary mt-1">target &lt;8cm · &gt;10cm = −15% economy</p>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-text-secondary">
                <span>Score</span>
                <span style={{ color: '#3b82f6', fontFamily: 'ui-monospace,monospace' }}>{voScoreVal}/100</span>
              </div>
              <ScoreBar score={voScoreVal} color="#3b82f6" />
            </div>
          </div>

          {/* Stride Length Card */}
          <div
            className="rounded-2xl border p-4 flex flex-col gap-3 relative overflow-hidden"
            style={{ background: 'rgba(168,85,247,0.07)', borderColor: 'rgba(168,85,247,0.25)' }}
          >
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg,#a855f7,#c084fc)' }} />
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Stride Length</p>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7' }}
              >
                Pace-dependent
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-3xl font-black leading-none"
                  style={{ color: '#a855f7', fontFamily: 'ui-monospace, monospace' }}
                >
                  {avgStride.toFixed(2)}
                </span>
                <span className="text-sm font-semibold text-text-secondary">m</span>
              </div>
              <p className="text-xs text-text-secondary mt-1">optimal 1.30–1.45m at 5:00/km pace</p>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-text-secondary">
                <span>Score</span>
                <span style={{ color: '#a855f7', fontFamily: 'ui-monospace,monospace' }}>{strideScoreVal}/100</span>
              </div>
              <ScoreBar score={strideScoreVal} color="#a855f7" />
            </div>
          </div>

          {/* Running Power Card */}
          <div
            className="rounded-2xl border p-4 flex flex-col gap-3 relative overflow-hidden"
            style={{ background: 'rgba(234,179,8,0.07)', borderColor: 'rgba(234,179,8,0.25)' }}
          >
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg,#eab308,#facc15)' }} />
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Running Power</p>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: 'rgba(234,179,8,0.15)', color: '#eab308' }}
              >
                Ultra / Stryd
              </span>
            </div>
            <div>
              {avgPower !== null ? (
                <>
                  <div className="flex items-baseline gap-1">
                    <span
                      className="text-3xl font-black leading-none"
                      style={{ color: '#eab308', fontFamily: 'ui-monospace, monospace' }}
                    >
                      {avgPower}
                    </span>
                    <span className="text-sm font-semibold text-text-secondary">W</span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">avg over {powerRuns.length} runs with power data</p>
                </>
              ) : (
                <>
                  <p className="text-xl font-black text-text-secondary leading-none">—</p>
                  <p className="text-xs text-text-secondary mt-1">requires Watch Ultra or Stryd pod</p>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" style={{ color: '#eab308' }} />
              <p className="text-xs text-text-secondary">
                {avgPower !== null ? 'Trending up as efficiency improves' : 'Connect Apple Watch Ultra to enable'}
              </p>
            </div>
          </div>

        </div>

        {/* ── Trend Summary Row ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">

          {/* GCT trend */}
          <div className="bg-surface rounded-2xl border border-border p-4">
            <p className="text-xs text-text-secondary mb-1 uppercase tracking-wide font-medium">GCT trend</p>
            <div className="flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-green-400 shrink-0" />
              <span
                className="text-base font-black"
                style={{ color: '#22c55e', fontFamily: 'ui-monospace,monospace' }}
              >
                {(firstTenGct - lastTenGct).toFixed(0)}ms
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-1 leading-snug">
              {firstTenGct}ms → {lastTenGct}ms
            </p>
          </div>

          {/* VO trend */}
          <div className="bg-surface rounded-2xl border border-border p-4">
            <p className="text-xs text-text-secondary mb-1 uppercase tracking-wide font-medium">VO trend</p>
            <div className="flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-green-400 shrink-0" />
              <span
                className="text-base font-black"
                style={{ color: '#22c55e', fontFamily: 'ui-monospace,monospace' }}
              >
                {(firstTenVo - lastTenVo).toFixed(1)}cm
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-1 leading-snug">
              {firstTenVo}cm → {lastTenVo}cm
            </p>
          </div>

          {/* Stride trend */}
          <div className="bg-surface rounded-2xl border border-border p-4">
            <p className="text-xs text-text-secondary mb-1 uppercase tracking-wide font-medium">Stride trend</p>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-400 shrink-0" />
              <span
                className="text-base font-black"
                style={{ color: '#3b82f6', fontFamily: 'ui-monospace,monospace' }}
              >
                +{(lastTenStride - firstTenStride).toFixed(2)}m
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-1 leading-snug">
              {firstTenStride}m → {lastTenStride}m
            </p>
          </div>
        </div>

        {/* ── GCT Line Chart ────────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-text-primary">Ground Contact Time — 90 Days</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Green dot = below 240ms target. Dashed line = 240ms target. Lower is better.
            </p>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={GCT_DATA} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary,#888)', fontFamily: 'ui-monospace,monospace' }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                domain={[210, 270]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary,#888)', fontFamily: 'ui-monospace,monospace' }}
                tickFormatter={(v: number) => `${v}`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<GctTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.12)' }} />
              <ReferenceLine
                y={240}
                stroke="#22c55e"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                strokeOpacity={0.7}
                label={{ value: '240ms', position: 'insideTopRight', fontSize: 9, fill: '#22c55e', fontFamily: 'ui-monospace,monospace' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#f97316"
                strokeWidth={2}
                dot={(props) => (
                  <MetricDot
                    {...props}
                    target={240}
                    below={true}
                    color="#f97316"
                  />
                )}
                activeDot={{ r: 5, fill: '#f97316', stroke: 'transparent' }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Mini legend */}
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-text-secondary">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span>Below 240ms target</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#f97316' }} />
              <span>Above target</span>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-6 h-0 border-t-2 border-dashed"
                style={{ borderColor: '#22c55e', opacity: 0.7 }}
              />
              <span>240ms target</span>
            </div>
          </div>
        </div>

        {/* ── Vertical Oscillation Line Chart ──────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-text-primary">Vertical Oscillation — 90 Days</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Green dot = below 8cm target. Dashed line = 8cm threshold. Lower = less energy wasted bouncing.
            </p>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={VO_DATA} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary,#888)', fontFamily: 'ui-monospace,monospace' }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                domain={[6, 10]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary,#888)', fontFamily: 'ui-monospace,monospace' }}
                tickFormatter={(v: number) => `${v}`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<VoTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.12)' }} />
              <ReferenceLine
                y={8}
                stroke="#22c55e"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                strokeOpacity={0.7}
                label={{ value: '8cm', position: 'insideTopRight', fontSize: 9, fill: '#22c55e', fontFamily: 'ui-monospace,monospace' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={(props) => (
                  <MetricDot
                    {...props}
                    target={8}
                    below={true}
                    color="#3b82f6"
                  />
                )}
                activeDot={{ r: 5, fill: '#3b82f6', stroke: 'transparent' }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-3 flex flex-wrap gap-4 text-xs text-text-secondary">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span>Below 8cm target</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#3b82f6' }} />
              <span>Above target</span>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-6 h-0 border-t-2 border-dashed"
                style={{ borderColor: '#22c55e', opacity: 0.7 }}
              />
              <span>8cm target</span>
            </div>
          </div>
        </div>

        {/* ── Stride Length Line Chart ──────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border p-5">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-text-primary">Stride Length — 90 Days</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Stride length is pace-dependent. Upward trend alongside falling GCT and VO indicates improving efficiency.
            </p>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={STRIDE_DATA} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary,#888)', fontFamily: 'ui-monospace,monospace' }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                domain={[1.10, 1.50]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary,#888)', fontFamily: 'ui-monospace,monospace' }}
                tickFormatter={(v: number) => v.toFixed(2)}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<StrideTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.12)' }} />
              {/* Optimal zone band shading via two reference lines serving as bounds */}
              <ReferenceLine
                y={1.30}
                stroke="rgba(168,85,247,0.35)"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{ value: '1.30m', position: 'insideBottomRight', fontSize: 9, fill: 'rgba(168,85,247,0.7)', fontFamily: 'ui-monospace,monospace' }}
              />
              <ReferenceLine
                y={1.45}
                stroke="rgba(168,85,247,0.35)"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{ value: '1.45m', position: 'insideTopRight', fontSize: 9, fill: 'rgba(168,85,247,0.7)', fontFamily: 'ui-monospace,monospace' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#a855f7"
                strokeWidth={2}
                dot={<MetricDot target={1.30} below={false} color="#a855f7" />}
                activeDot={{ r: 5, fill: '#a855f7', stroke: 'transparent' }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-3 flex flex-wrap gap-4 text-xs text-text-secondary">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span>At or above 1.30m</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#a855f7' }} />
              <span>Below optimal range</span>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-6 h-0 border-t-2 border-dashed"
                style={{ borderColor: 'rgba(168,85,247,0.6)' }}
              />
              <span>1.30–1.45m optimal zone</span>
            </div>
          </div>
        </div>

        {/* ── Quick Insight Row ─────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-semibold text-text-primary">Biomechanical Insights</h2>
          </div>
          <div className="divide-y divide-border">

            <div className="px-5 py-4 flex items-start gap-3">
              <ChevronRight className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-text-primary">Ground contact is improving</p>
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                  GCT dropped from {firstTenGct}ms to {lastTenGct}ms over 3 months — a {(((firstTenGct - lastTenGct) / firstTenGct) * 100).toFixed(1)}% reduction. You are now
                  below the 240ms performance threshold consistently.
                </p>
              </div>
            </div>

            <div className="px-5 py-4 flex items-start gap-3">
              <ChevronRight className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-text-primary">Vertical bounce is well controlled</p>
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                  Average oscillation of {avgVo}cm is below the 8cm threshold. Early sessions at {firstTenVo}cm
                  are now down to {lastTenVo}cm — indicating better forward propulsion and less wasted vertical energy.
                </p>
              </div>
            </div>

            <div className="px-5 py-4 flex items-start gap-3">
              <ChevronRight className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-text-primary">Stride length growing naturally</p>
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                  From {firstTenStride}m to {lastTenStride}m as GCT and oscillation both fell. This is the
                  correct order — do not force stride length; let it emerge from improved mechanics.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ── Science Callout ──────────────────────────────────────────────── */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: 'rgba(249,115,22,0.3)', background: 'rgba(249,115,22,0.04)' }}
        >
          <div
            className="px-5 py-3 flex items-center gap-2 border-b"
            style={{ borderColor: 'rgba(249,115,22,0.2)', background: 'rgba(249,115,22,0.08)' }}
          >
            <FlaskConical className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-semibold text-orange-400">The Science</h2>
          </div>

          <div className="px-5 py-5 space-y-4 text-xs text-text-secondary leading-relaxed">

            <div>
              <p className="font-semibold text-text-primary mb-1">
                Morin et al. 2011 — J Exp Biol
              </p>
              <p>
                Ground contact time is the primary mechanical determinant of running speed. Elite
                sprinters maintain GCT below 100ms; elite distance runners below 200ms. Every
                millisecond of unnecessary contact time represents energy dissipated through
                the foot-ground interface rather than converted to forward propulsion.
              </p>
            </div>

            <div>
              <p className="font-semibold text-text-primary mb-1">
                Tartaruga et al. 2012
              </p>
              <p>
                Vertical oscillation greater than 10cm is associated with a 15% reduction
                in running economy, measured by oxygen cost per metre. Higher bounce means
                more energy spent fighting gravity on each stride — energy that contributes
                nothing to horizontal velocity.
              </p>
            </div>

            <div>
              <p className="font-semibold text-text-primary mb-1">
                Heiderscheit et al. 2011
              </p>
              <p>
                Increasing cadence by just 5–10% naturally shortens stride length, reduces
                vertical oscillation, and decreases ground contact time simultaneously —
                without conscious effort on any individual metric. The three variables are
                mechanically coupled: improve one and the others follow.
              </p>
            </div>

            <div
              className="rounded-lg p-3 mt-2"
              style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)' }}
            >
              <p className="font-semibold text-orange-400 mb-1">Practical takeaway</p>
              <p>
                Focus on cadence first (165–175 spm). GCT, oscillation, and stride length
                will self-optimise as foot-strike timing improves. Use Apple Watch running
                form notifications (watchOS 9+) during runs to get real-time feedback
                when your vertical oscillation drifts above threshold.
              </p>
            </div>

          </div>
        </div>

      </main>
    </div>
  )
}
