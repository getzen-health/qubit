'use client'

import Link from 'next/link'
import { ArrowLeft, Zap, TrendingUp, Activity } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  LineChart,
  Line,
  Cell,
} from 'recharts'

// ─── Constants ────────────────────────────────────────────────────────────────

const FTP = 287       // Watts
const WEIGHT_KG = 72  // kg
const W_PER_KG = +(FTP / WEIGHT_KG).toFixed(2) // 3.99

// ─── Power Zones ──────────────────────────────────────────────────────────────

interface PowerZone {
  zone: number
  name: string
  pctLow: number
  pctHigh: number | null
  color: string
  bgColor: string
  textColor: string
  description: string
}

const ZONES: PowerZone[] = [
  { zone: 1, name: 'Recovery',    pctLow: 0,    pctHigh: 55,  color: '#6b7280', bgColor: 'bg-gray-500/20',   textColor: 'text-gray-400',   description: 'Active recovery, easy spinning' },
  { zone: 2, name: 'Endurance',   pctLow: 55,   pctHigh: 75,  color: '#3b82f6', bgColor: 'bg-blue-500/20',   textColor: 'text-blue-400',   description: 'All-day aerobic base building' },
  { zone: 3, name: 'Tempo',       pctLow: 75,   pctHigh: 90,  color: '#22c55e', bgColor: 'bg-green-500/20',  textColor: 'text-green-400',  description: 'Comfortably hard; builds aerobic power' },
  { zone: 4, name: 'Threshold',   pctLow: 90,   pctHigh: 105, color: '#eab308', bgColor: 'bg-yellow-500/20', textColor: 'text-yellow-400', description: 'Sweet spot 88–93% FTP; highest adaptation/hr' },
  { zone: 5, name: 'VO₂ Max',     pctLow: 105,  pctHigh: 120, color: '#f97316', bgColor: 'bg-orange-500/20', textColor: 'text-orange-400', description: 'Short, hard intervals to raise ceiling' },
  { zone: 6, name: 'Anaerobic',   pctLow: 120,  pctHigh: 150, color: '#ef4444', bgColor: 'bg-red-500/20',    textColor: 'text-red-400',    description: 'Very short maximal efforts' },
  { zone: 7, name: 'Sprint',      pctLow: 150,  pctHigh: null, color: '#a855f7', bgColor: 'bg-purple-500/20', textColor: 'text-purple-400', description: 'Neuromuscular peak power sprints' },
]

function zoneWatts(z: PowerZone): string {
  const lo = Math.round(FTP * z.pctLow / 100)
  if (z.pctHigh === null) return `>${lo} W`
  const hi = Math.round(FTP * z.pctHigh / 100)
  if (z.pctLow === 0) return `<${hi} W`
  return `${lo}–${hi} W`
}

function classifyZone(watts: number): number {
  const pct = (watts / FTP) * 100
  if (pct < 55) return 1
  if (pct < 75) return 2
  if (pct < 90) return 3
  if (pct < 105) return 4
  if (pct < 120) return 5
  if (pct < 150) return 6
  return 7
}

function zoneColor(z: number): string {
  return ZONES[z - 1]?.color ?? '#6b7280'
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

// 90-day power trend — 32 rides spread across the window
// Mix of Z2 endurance (160–200 W) and structured training (240–290 W)
function buildTrendData() {
  const rides = [
    // Week 1 (day 0–6)
    { day: 2,  watts: 178, type: 'endurance' },
    { day: 5,  watts: 262, type: 'threshold' },
    // Week 2
    { day: 9,  watts: 191, type: 'endurance' },
    { day: 12, watts: 245, type: 'tempo' },
    { day: 13, watts: 171, type: 'endurance' },
    // Week 3
    { day: 16, watts: 274, type: 'threshold' },
    { day: 19, watts: 183, type: 'endurance' },
    // Week 4
    { day: 23, watts: 196, type: 'endurance' },
    { day: 25, watts: 258, type: 'tempo' },
    { day: 26, watts: 169, type: 'endurance' },
    // Week 5
    { day: 30, watts: 281, type: 'threshold' },
    { day: 33, watts: 188, type: 'endurance' },
    // Week 6
    { day: 37, watts: 201, type: 'endurance' },
    { day: 39, watts: 267, type: 'threshold' },
    { day: 40, watts: 175, type: 'endurance' },
    // Week 7
    { day: 44, watts: 185, type: 'endurance' },
    { day: 47, watts: 279, type: 'threshold' },
    // Week 8
    { day: 51, watts: 194, type: 'endurance' },
    { day: 53, watts: 250, type: 'tempo' },
    { day: 54, watts: 168, type: 'endurance' },
    // Week 9
    { day: 58, watts: 285, type: 'threshold' },
    { day: 61, watts: 180, type: 'endurance' },
    // Week 10
    { day: 65, watts: 197, type: 'endurance' },
    { day: 67, watts: 271, type: 'threshold' },
    { day: 68, watts: 177, type: 'endurance' },
    // Week 11
    { day: 72, watts: 248, type: 'tempo' },
    { day: 75, watts: 192, type: 'endurance' },
    // Week 12
    { day: 79, watts: 289, type: 'threshold' },
    { day: 81, watts: 183, type: 'endurance' },
    // Week 13 (most recent)
    { day: 85, watts: 205, type: 'endurance' },
    { day: 88, watts: 276, type: 'threshold' },
    { day: 90, watts: 186, type: 'endurance' },
  ]

  const base = new Date('2025-12-20')
  return rides.map((r) => {
    const d = new Date(base)
    d.setDate(base.getDate() + r.day)
    const z = classifyZone(r.watts)
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      watts: r.watts,
      zone: z,
      color: zoneColor(z),
    }
  })
}

// Power curve — mean-maximal power profile
const POWER_CURVE = [
  { label: '1s',    duration: 1,    watts: 980  },
  { label: '5s',    duration: 5,    watts: 780  },
  { label: '30s',   duration: 30,   watts: 510  },
  { label: '1min',  duration: 60,   watts: 420  },
  { label: '5min',  duration: 300,  watts: 335  },
  { label: '20min', duration: 1200, watts: 302  },
  { label: '60min', duration: 3600, watts: 275  },
]

// Weekly TSS chart — 13 weeks
function buildWeeklyTSS() {
  const weeks = [
    { week: 'Dec 27', tss: 215 },
    { week: 'Jan 3',  tss: 248 },
    { week: 'Jan 10', tss: 182 },  // recovery
    { week: 'Jan 17', tss: 271 },
    { week: 'Jan 24', tss: 304 },
    { week: 'Jan 31', tss: 195 },  // recovery
    { week: 'Feb 7',  tss: 328 },
    { week: 'Feb 14', tss: 356 },
    { week: 'Feb 21', tss: 210 },  // recovery
    { week: 'Feb 28', tss: 381 },
    { week: 'Mar 7',  tss: 412 },
    { week: 'Mar 14', tss: 245 },  // recovery
    { week: 'Mar 19', tss: 338 },
  ]
  return weeks
}

// Zone distribution (sessions per zone)
const ZONE_DISTRIBUTION = [
  { zone: 1, name: 'Z1 Recovery',   sessions: 0  },
  { zone: 2, name: 'Z2 Endurance',  sessions: 19 },
  { zone: 3, name: 'Z3 Tempo',      sessions: 4  },
  { zone: 4, name: 'Z4 Threshold',  sessions: 8  },
  { zone: 5, name: 'Z5 VO₂ Max',   sessions: 1  },
  { zone: 6, name: 'Z6 Anaerobic',  sessions: 0  },
  { zone: 7, name: 'Z7 Sprint',     sessions: 0  },
]

// Recent rides (last 8)
interface Ride {
  date: string
  name: string
  durationMin: number
  avgWatts: number
  np: number       // Normalized Power
  tss: number      // Training Stress Score
  zone: number
}

const RECENT_RIDES: Ride[] = [
  { date: 'Mar 19', name: 'Morning Endurance',    durationMin: 65,  avgWatts: 186, np: 194, tss: 55  , zone: 2 },
  { date: 'Mar 17', name: 'Sweet Spot Intervals', durationMin: 72,  avgWatts: 255, np: 269, tss: 113 , zone: 4 },
  { date: 'Mar 14', name: 'Z2 Base Ride',          durationMin: 90,  avgWatts: 183, np: 191, tss: 73  , zone: 2 },
  { date: 'Mar 12', name: 'Threshold Blocks',      durationMin: 60,  avgWatts: 271, np: 278, tss: 103 , zone: 4 },
  { date: 'Mar 10', name: 'Endurance Ride',         durationMin: 75,  avgWatts: 192, np: 199, tss: 68  , zone: 2 },
  { date: 'Mar 7',  name: 'FTP Test Effort',        durationMin: 68,  avgWatts: 281, np: 289, tss: 121 , zone: 4 },
  { date: 'Mar 5',  name: 'Tempo Work',             durationMin: 55,  avgWatts: 248, np: 255, tss: 84  , zone: 3 },
  { date: 'Mar 3',  name: 'Recovery Spin',           durationMin: 45,  avgWatts: 177, np: 182, tss: 42  , zone: 2 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDuration(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function ifScore(np: number, ftp: number): string {
  return (np / ftp).toFixed(2)
}

const tooltipStyle = {
  background: '#1a1a1a',
  border: '1px solid #333',
  borderRadius: 8,
  fontSize: 12,
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ZoneBadge({ zone }: { zone: number }) {
  const z = ZONES[zone - 1]
  if (!z) return null
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${z.bgColor} ${z.textColor}`}
    >
      Z{zone}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CyclingPowerPage() {
  const trendData = buildTrendData()
  const weeklyTSS = buildWeeklyTSS()
  const totalSessions = ZONE_DISTRIBUTION.reduce((s, z) => s + z.sessions, 0)
  const weeklyTSSAvg = Math.round(weeklyTSS.reduce((s, w) => s + w.tss, 0) / weeklyTSS.length)
  const totalTSS = weeklyTSS.reduce((s, w) => s + w.tss, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/cycling"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to cycling"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Cycling Power</h1>
            <p className="text-sm text-text-secondary">Power meter analytics · Last 90 days</p>
          </div>
          <Zap className="w-5 h-5 text-yellow-400" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* ── Hero FTP Card ── */}
        <div className="bg-gradient-to-br from-yellow-500/20 via-amber-500/10 to-surface rounded-2xl border border-yellow-500/30 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-400 uppercase tracking-widest mb-1">
                Functional Threshold Power
              </p>
              <div className="flex items-end gap-3">
                <span className="text-6xl font-extrabold text-yellow-400 tabular-nums leading-none">
                  {FTP}
                </span>
                <span className="text-2xl font-semibold text-text-secondary mb-1">W</span>
              </div>
              <p className="text-lg font-bold text-amber-300 mt-1">
                {W_PER_KG} W/kg
              </p>
              <p className="text-xs text-text-secondary mt-0.5">at {WEIGHT_KG} kg body weight</p>
            </div>
            <div className="text-right space-y-3">
              <div className="bg-surface/60 rounded-xl px-4 py-3 border border-border">
                <p className="text-2xl font-bold text-text-primary">{totalSessions}</p>
                <p className="text-xs text-text-secondary">Rides (90d)</p>
              </div>
              <div className="bg-surface/60 rounded-xl px-4 py-3 border border-border">
                <p className="text-2xl font-bold text-text-primary">{weeklyTSSAvg}</p>
                <p className="text-xs text-text-secondary">Avg Weekly TSS</p>
              </div>
            </div>
          </div>

          {/* W/kg category */}
          <div className="mt-4 pt-4 border-t border-yellow-500/20">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-text-primary">
                Intermediate–Advanced cyclist
              </span>
              <span className="text-xs text-text-secondary">
                · Cat 4/3 racer range (3.5–4.0 W/kg)
              </span>
            </div>
          </div>
        </div>

        {/* ── Power Zones Table ── */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">Power Zones</h2>
            <p className="text-xs text-text-secondary mt-0.5">Based on FTP = {FTP} W</p>
          </div>
          <div className="divide-y divide-border">
            {ZONES.map((z) => (
              <div key={z.zone} className="px-4 py-3 flex items-center gap-3">
                {/* Zone label */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                  style={{ background: `${z.color}22`, color: z.color }}
                >
                  Z{z.zone}
                </div>
                {/* Name & desc */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary">{z.name}</span>
                    {z.zone === 4 && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-medium">
                        Sweet Spot 88–93%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary truncate">{z.description}</p>
                </div>
                {/* Watts */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold tabular-nums" style={{ color: z.color }}>
                    {zoneWatts(z)}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {z.pctHigh === null
                      ? `>${z.pctLow}%`
                      : z.pctLow === 0
                      ? `<${z.pctHigh}%`
                      : `${z.pctLow}–${z.pctHigh}%`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 90-Day Power Trend ── */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-0.5">90-Day Power Trend</h2>
          <p className="text-xs text-text-secondary mb-4">Average watts per session, color-coded by zone</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={trendData} margin={{ top: 8, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: '#888' }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#888' }}
                domain={[100, 320]}
                width={36}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, _name: string, props: { payload?: { zone?: number } }) => [
                  `${v} W (Z${props?.payload?.zone ?? '?'})`,
                  'Avg Power',
                ]}
              />
              <ReferenceLine
                y={FTP}
                stroke="#eab308"
                strokeDasharray="5 3"
                label={{ value: `FTP ${FTP}W`, position: 'insideTopRight', fontSize: 9, fill: '#eab308' }}
              />
              <Bar dataKey="watts" radius={[3, 3, 0, 0]}>
                {trendData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            {ZONES.slice(1, 5).map((z) => (
              <div key={z.zone} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: z.color }} />
                <span className="text-xs text-text-secondary">Z{z.zone} {z.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Power Curve ── */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-0.5">
            <Activity className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-text-primary">Power Curve</h2>
          </div>
          <p className="text-xs text-text-secondary mb-4">
            Mean-maximal power profile — best power for each duration
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={POWER_CURVE} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#888' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#888' }}
                domain={[200, 1050]}
                width={40}
                tickFormatter={(v) => `${v}W`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v} W`, 'Best Power']}
              />
              <ReferenceLine
                y={FTP}
                stroke="#eab308"
                strokeDasharray="4 3"
                label={{ value: 'FTP', position: 'insideTopRight', fontSize: 9, fill: '#eab308' }}
              />
              <Line
                type="monotone"
                dataKey="watts"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 5, fill: '#f59e0b', strokeWidth: 0 }}
                activeDot={{ r: 7, fill: '#fbbf24' }}
              />
            </LineChart>
          </ResponsiveContainer>
          {/* Key points */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[POWER_CURVE[3], POWER_CURVE[4], POWER_CURVE[5], POWER_CURVE[6]].map((p) => (
              <div key={p.label} className="text-center bg-surface-secondary rounded-lg p-2 border border-border">
                <p className="text-base font-bold text-amber-400 tabular-nums">{p.watts}W</p>
                <p className="text-xs text-text-secondary">{p.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Weekly TSS Chart ── */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-0.5">
            <h2 className="text-sm font-semibold text-text-primary">Weekly TSS</h2>
            <span className="text-xs text-text-secondary">{totalTSS.toLocaleString()} total</span>
          </div>
          <p className="text-xs text-text-secondary mb-4">Training Stress Score — 100 TSS = 1 hr at FTP</p>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={weeklyTSS} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 9, fill: '#888' }}
                axisLine={false}
                tickLine={false}
                interval={1}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#888' }}
                domain={[0, 500]}
                width={36}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v} TSS`, 'Weekly TSS']}
              />
              <ReferenceLine
                y={300}
                stroke="#eab308"
                strokeDasharray="4 3"
                label={{ value: 'CTL target', position: 'insideTopRight', fontSize: 9, fill: '#eab308' }}
              />
              <Bar dataKey="tss" radius={[3, 3, 0, 0]}>
                {weeklyTSS.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.tss < 230 ? '#6b7280' : entry.tss < 320 ? '#f59e0b' : '#f97316'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Zone Distribution ── */}
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-0.5">Zone Distribution</h2>
          <p className="text-xs text-text-secondary mb-4">Sessions by dominant power zone (90 days)</p>
          <div className="space-y-3">
            {ZONE_DISTRIBUTION.filter((z) => z.sessions > 0 || z.zone <= 5).map((zd) => {
              const z = ZONES[zd.zone - 1]
              const pct = totalSessions > 0 ? (zd.sessions / totalSessions) * 100 : 0
              return (
                <div key={zd.zone} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold w-3" style={{ color: z.color }}>
                        Z{zd.zone}
                      </span>
                      <span className="text-text-secondary">{z.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <span className="tabular-nums font-medium" style={{ color: zd.sessions > 0 ? z.color : undefined }}>
                        {zd.sessions} rides
                      </span>
                      <span className="w-8 text-right">{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: z.color,
                        opacity: zd.sessions === 0 ? 0.2 : 1,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          {/* Polarization note */}
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-xs text-text-secondary">
              <span className="text-blue-400 font-semibold">59% Z2 endurance</span>
              {' '}+{' '}
              <span className="text-yellow-400 font-semibold">25% Z4 threshold</span>
              {' '}— polarised training model with sweet-spot emphasis.
            </p>
          </div>
        </div>

        {/* ── Recent Rides Table ── */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-text-primary">Recent Rides</h2>
            <p className="text-xs text-text-secondary mt-0.5">Last 8 sessions</p>
          </div>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-secondary/50">
                  <th className="text-left px-4 py-2 font-medium text-text-secondary">Date</th>
                  <th className="text-left px-4 py-2 font-medium text-text-secondary">Ride</th>
                  <th className="text-right px-4 py-2 font-medium text-text-secondary">Duration</th>
                  <th className="text-right px-4 py-2 font-medium text-text-secondary">Avg W</th>
                  <th className="text-right px-4 py-2 font-medium text-text-secondary">NP</th>
                  <th className="text-right px-4 py-2 font-medium text-text-secondary">IF</th>
                  <th className="text-right px-4 py-2 font-medium text-text-secondary">TSS</th>
                  <th className="text-right px-4 py-2 font-medium text-text-secondary">Zone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {RECENT_RIDES.map((r, i) => (
                  <tr key={i} className="hover:bg-surface-secondary/30 transition-colors">
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{r.date}</td>
                    <td className="px-4 py-3 font-medium text-text-primary">{r.name}</td>
                    <td className="px-4 py-3 text-right text-text-secondary tabular-nums">{fmtDuration(r.durationMin)}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-amber-400">{r.avgWatts}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-text-primary">{r.np}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-text-secondary">{ifScore(r.np, FTP)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-text-primary">{r.tss}</td>
                    <td className="px-4 py-3 text-right">
                      <ZoneBadge zone={r.zone} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-border">
            {RECENT_RIDES.map((r, i) => (
              <div key={i} className="px-4 py-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-text-primary">{r.name}</p>
                  <ZoneBadge zone={r.zone} />
                </div>
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <span>{r.date} · {fmtDuration(r.durationMin)}</span>
                  <span className="font-bold text-amber-400">{r.avgWatts} W avg</span>
                </div>
                <div className="flex gap-3 text-xs text-text-secondary">
                  <span>NP <span className="text-text-primary font-medium">{r.np}W</span></span>
                  <span>IF <span className="text-text-primary font-medium">{ifScore(r.np, FTP)}</span></span>
                  <span>TSS <span className="text-text-primary font-semibold">{r.tss}</span></span>
                </div>
              </div>
            ))}
          </div>
          {/* Column explanations */}
          <div className="px-4 py-3 border-t border-border bg-surface-secondary/30">
            <p className="text-xs text-text-secondary">
              <span className="text-text-primary font-medium">NP</span> = Normalized Power ·{' '}
              <span className="text-text-primary font-medium">IF</span> = Intensity Factor (NP/FTP) ·{' '}
              <span className="text-text-primary font-medium">TSS</span> = Training Stress Score
            </p>
          </div>
        </div>

        {/* ── Science Card ── */}
        <div className="bg-surface rounded-xl border border-border p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            <h2 className="text-sm font-semibold text-text-primary">Power Meter Science</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                label: 'Gold Standard',
                color: 'text-yellow-400',
                border: 'border-yellow-500/30',
                bg: 'bg-yellow-500/5',
                body: 'Power responds instantly — no lag unlike heart rate, which can trail by 30–60 seconds. You know exactly how hard you\'re working in real time.',
                cite: 'Allen & Coggan, 2010',
              },
              {
                label: 'FTP Testing',
                color: 'text-blue-400',
                border: 'border-blue-500/30',
                bg: 'bg-blue-500/5',
                body: 'FTP ≈ 95% of best 20-min power, or your 60-min all-out average. Retest every 8–12 weeks as fitness improves to keep zones accurate.',
                cite: 'Coggan Protocol',
              },
              {
                label: 'TSS Model',
                color: 'text-orange-400',
                border: 'border-orange-500/30',
                bg: 'bg-orange-500/5',
                body: '100 TSS = 1 hour at exactly FTP. Sustainable chronic training load (CTL) build rate is 5–8 TSS/week. Rapid jumps risk overtraining.',
                cite: 'Bannister et al.',
              },
              {
                label: 'Sweet Spot',
                color: 'text-green-400',
                border: 'border-green-500/30',
                bg: 'bg-green-500/5',
                body: '88–93% FTP (high Zone 3 / low Zone 4) delivers the highest aerobic adaptation per hour of training. Most efficient gain zone for time-crunched cyclists.',
                cite: 'Frank & Coggan',
              },
            ].map((card) => (
              <div
                key={card.label}
                className={`rounded-lg p-3 border ${card.border} ${card.bg}`}
              >
                <p className={`text-xs font-bold uppercase tracking-wide mb-1.5 ${card.color}`}>
                  {card.label}
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">{card.body}</p>
                <p className="text-xs text-text-secondary/50 mt-1.5 italic">{card.cite}</p>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
