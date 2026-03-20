'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Waves, Bike, PersonStanding, ArrowRight, FlaskConical } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

// ─── Colors ───────────────────────────────────────────────────────────────────

const SWIM_COLOR = '#22d3ee'   // cyan-400
const BIKE_COLOR = '#3b82f6'   // blue-500
const RUN_COLOR  = '#fb923c'   // orange-400

// ─── Mock Data ────────────────────────────────────────────────────────────────

const DISCIPLINE_SUMMARY = {
  swim: { hours: 18.5, sessions: 14, pct: 25 },
  bike: { hours: 28.5, sessions: 12, pct: 38 },
  run:  { hours: 28.0, sessions: 22, pct: 37 },
}

const WEEKLY_DATA = [
  { week: 'W1',  swim: 72,  bike: 150, run: 115 },
  { week: 'W2',  swim: 60,  bike: 135, run: 100 },
  { week: 'W3',  swim: 90,  bike: 165, run: 130 },
  { week: 'W4',  swim: 45,  bike: 120, run:  90 },  // recovery
  { week: 'W5',  swim: 80,  bike: 175, run: 125 },
  { week: 'W6',  swim: 95,  bike: 190, run: 145 },
  { week: 'W7',  swim: 75,  bike: 160, run: 120 },
  { week: 'W8',  swim: 50,  bike: 130, run:  95 },  // recovery
  { week: 'W9',  swim: 100, bike: 200, run: 155 },
  { week: 'W10', swim: 90,  bike: 185, run: 140 },
  { week: 'W11', swim: 85,  bike: 170, run: 130 },
  { week: 'W12', swim: 40,  bike:  90, run:  65 },  // taper
]

const RACE_TARGETS = {
  Sprint:  { swim: 20, bike: 40, run: 40 },
  Olympic: { swim: 22, bike: 38, run: 40 },
  '70.3':  { swim: 18, bike: 45, run: 37 },
  Ironman: { swim: 15, bike: 50, run: 35 },
} as const

type RaceType = keyof typeof RACE_TARGETS

const ACTUAL_PCT = { swim: 25, bike: 38, run: 37 }

const BRICK_WORKOUTS = [
  { id: 1, date: 'Mar 10', type: 'Bike → Run', first: '1h 45m bike', second: '28m run', total: '2h 13m', gap: '8 min' },
  { id: 2, date: 'Feb 24', type: 'Swim → Bike', first: '42m swim', second: '1h 20m bike', total: '2h 02m', gap: '12 min' },
  { id: 3, date: 'Feb 15', type: 'Bike → Run', first: '2h 05m bike', second: '35m run', total: '2h 40m', gap: '6 min' },
  { id: 4, date: 'Feb 03', type: 'Bike → Run', first: '1h 30m bike', second: '22m run', total: '1h 52m', gap: '10 min' },
  { id: 5, date: 'Jan 22', type: 'Swim → Bike', first: '38m swim', second: '1h 10m bike', total: '1h 48m', gap: '14 min' },
]

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const tooltipStyle = {
  background: 'rgba(10,15,30,0.95)',
  border: '1px solid rgba(59,130,246,0.3)',
  borderRadius: 8,
  fontSize: 12,
  color: '#e2e8f0',
}

function fmtHours(mins: number) {
  return `${(mins / 60).toFixed(1)}h`
}

// ─── Components ───────────────────────────────────────────────────────────────

function DisciplineCard({
  label,
  icon: Icon,
  hours,
  sessions,
  pct,
  color,
  gradFrom,
  gradTo,
}: {
  label: string
  icon: React.ElementType
  hours: number
  sessions: number
  pct: number
  color: string
  gradFrom: string
  gradTo: string
}) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden border p-5 flex flex-col gap-3"
      style={{ borderColor: color + '33', background: `linear-gradient(135deg, ${gradFrom}, ${gradTo})` }}
    >
      {/* Glow dot */}
      <div
        className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20 blur-2xl"
        style={{ backgroundColor: color }}
      />
      <div className="flex items-center justify-between">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: color + '22', border: `1px solid ${color}44` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <span
          className="text-xs font-bold tracking-widest uppercase px-2 py-0.5 rounded-full"
          style={{ color, backgroundColor: color + '18', border: `1px solid ${color}33` }}
        >
          {pct}%
        </span>
      </div>
      <div>
        <p className="text-2xl font-black tracking-tight" style={{ color }}>
          {hours}h
        </p>
        <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mt-0.5">{label}</p>
      </div>
      <p className="text-xs text-slate-400">{sessions} sessions</p>

      {/* Mini bar */}
      <div className="h-1 rounded-full bg-white/10 overflow-hidden mt-auto">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function RaceCompareBar({
  label,
  actual,
  target,
  color,
}: {
  label: string
  actual: number
  target: number
  color: string
}) {
  const delta = actual - target
  const sign  = delta >= 0 ? '+' : ''

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-300 font-medium">{label}</span>
        <span className="flex items-center gap-2">
          <span className="text-slate-400">{actual}% actual</span>
          <span
            className="font-bold px-1.5 py-0.5 rounded"
            style={{
              color: Math.abs(delta) <= 2 ? '#4ade80' : Math.abs(delta) <= 5 ? '#facc15' : '#f87171',
              backgroundColor:
                (Math.abs(delta) <= 2 ? '#4ade8022' : Math.abs(delta) <= 5 ? '#facc1522' : '#f8717122'),
            }}
          >
            {sign}{delta}%
          </span>
        </span>
      </div>

      {/* Target track */}
      <div className="relative h-3 rounded-full bg-white/8 overflow-hidden">
        {/* Target ghost bar */}
        <div
          className="absolute inset-y-0 left-0 rounded-full opacity-20"
          style={{ width: `${target}%`, backgroundColor: color }}
        />
        {/* Actual bar */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{ width: `${actual}%`, backgroundColor: color }}
        />
        {/* Target marker */}
        <div
          className="absolute inset-y-0 w-0.5 bg-white/60"
          style={{ left: `${target}%` }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-slate-500">
        <span>0%</span>
        <span>Target {target}%</span>
        <span>100%</span>
      </div>
    </div>
  )
}

// ─── Custom Stacked Tooltip ────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null
  const swim = payload.find((p: any) => p.dataKey === 'swim')?.value ?? 0
  const bike = payload.find((p: any) => p.dataKey === 'bike')?.value ?? 0
  const run  = payload.find((p: any) => p.dataKey === 'run')?.value  ?? 0
  return (
    <div className="rounded-xl p-3 space-y-1.5 text-xs" style={tooltipStyle}>
      <p className="font-bold text-slate-200 mb-2">{label}</p>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SWIM_COLOR }} />
        <span className="text-slate-300">Swim</span>
        <span className="ml-auto font-medium text-slate-200">{fmtHours(swim)}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: BIKE_COLOR }} />
        <span className="text-slate-300">Bike</span>
        <span className="ml-auto font-medium text-slate-200">{fmtHours(bike)}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: RUN_COLOR }} />
        <span className="text-slate-300">Run</span>
        <span className="ml-auto font-medium text-slate-200">{fmtHours(run)}</span>
      </div>
      <div className="border-t border-white/10 pt-1.5 mt-1.5 flex justify-between">
        <span className="text-slate-400">Total</span>
        <span className="font-bold text-slate-200">{fmtHours(swim + bike + run)}</span>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TriathlonPage() {
  const [selectedRace, setSelectedRace] = useState<RaceType>('Olympic')
  const targets = RACE_TARGETS[selectedRace]

  const totalHours = DISCIPLINE_SUMMARY.swim.hours + DISCIPLINE_SUMMARY.bike.hours + DISCIPLINE_SUMMARY.run.hours

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #050b1a 0%, #0a1628 40%, #050b1a 100%)' }}>

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50 backdrop-blur-md border-b"
        style={{ borderColor: 'rgba(59,130,246,0.15)', backgroundColor: 'rgba(5,11,26,0.85)' }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/workouts"
            className="p-2 rounded-xl transition-colors"
            style={{ backgroundColor: 'rgba(59,130,246,0.08)' }}
            aria-label="Back to workouts"
          >
            <ArrowLeft className="w-5 h-5 text-blue-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-black tracking-tight text-slate-100">Triathlon</h1>
            <p className="text-xs text-slate-400">Multi-sport training analytics · swim, bike, run</p>
          </div>
          {/* Discipline pips */}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SWIM_COLOR }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: BIKE_COLOR }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RUN_COLOR }} />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">

        {/* ── Hero Banner ── */}
        <div
          className="relative rounded-2xl overflow-hidden p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(59,130,246,0.18) 50%, rgba(251,146,60,0.08) 100%)',
            border: '1px solid rgba(59,130,246,0.2)',
          }}
        >
          {/* Abstract tri-sport shape */}
          <div className="absolute right-0 top-0 h-full w-48 opacity-10 pointer-events-none overflow-hidden">
            <div
              className="absolute top-1/2 right-[-40px] w-48 h-48 -translate-y-1/2 rounded-full"
              style={{ background: `conic-gradient(${SWIM_COLOR} 0deg 90deg, ${BIKE_COLOR} 90deg 226.8deg, ${RUN_COLOR} 226.8deg 360deg)` }}
            />
          </div>
          <div className="relative">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-cyan-400 mb-1">12-Week Block</p>
            <h2 className="text-3xl font-black text-slate-100 mb-1">{totalHours.toFixed(1)}h</h2>
            <p className="text-sm text-slate-400">Total training volume · {DISCIPLINE_SUMMARY.swim.sessions + DISCIPLINE_SUMMARY.bike.sessions + DISCIPLINE_SUMMARY.run.sessions} sessions</p>
            <div className="flex gap-4 mt-4 text-xs text-slate-300">
              <span><span className="font-bold" style={{ color: SWIM_COLOR }}>●</span> Swim {DISCIPLINE_SUMMARY.swim.pct}%</span>
              <span><span className="font-bold" style={{ color: BIKE_COLOR }}>●</span> Bike {DISCIPLINE_SUMMARY.bike.pct}%</span>
              <span><span className="font-bold" style={{ color: RUN_COLOR }}>●</span> Run {DISCIPLINE_SUMMARY.run.pct}%</span>
            </div>
          </div>
        </div>

        {/* ── Discipline Summary Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <DisciplineCard
            label="Swim"
            icon={Waves}
            hours={DISCIPLINE_SUMMARY.swim.hours}
            sessions={DISCIPLINE_SUMMARY.swim.sessions}
            pct={DISCIPLINE_SUMMARY.swim.pct}
            color={SWIM_COLOR}
            gradFrom="rgba(6,182,212,0.08)"
            gradTo="rgba(6,182,212,0.03)"
          />
          <DisciplineCard
            label="Bike"
            icon={Bike}
            hours={DISCIPLINE_SUMMARY.bike.hours}
            sessions={DISCIPLINE_SUMMARY.bike.sessions}
            pct={DISCIPLINE_SUMMARY.bike.pct}
            color={BIKE_COLOR}
            gradFrom="rgba(59,130,246,0.08)"
            gradTo="rgba(59,130,246,0.03)"
          />
          <DisciplineCard
            label="Run"
            icon={PersonStanding}
            hours={DISCIPLINE_SUMMARY.run.hours}
            sessions={DISCIPLINE_SUMMARY.run.sessions}
            pct={DISCIPLINE_SUMMARY.run.pct}
            color={RUN_COLOR}
            gradFrom="rgba(251,146,60,0.08)"
            gradTo="rgba(251,146,60,0.03)"
          />
        </div>

        {/* ── Training Distribution Bar ── */}
        <div
          className="rounded-2xl p-5 border"
          style={{ borderColor: 'rgba(59,130,246,0.15)', backgroundColor: 'rgba(15,23,42,0.7)' }}
        >
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 mb-4">Training Distribution</h3>
          <div className="flex h-8 rounded-xl overflow-hidden gap-0.5">
            <div
              className="flex items-center justify-center text-xs font-bold text-black/70 transition-all duration-500"
              style={{ width: `${DISCIPLINE_SUMMARY.swim.pct}%`, backgroundColor: SWIM_COLOR }}
            >
              {DISCIPLINE_SUMMARY.swim.pct}%
            </div>
            <div
              className="flex items-center justify-center text-xs font-bold text-black/70 transition-all duration-500"
              style={{ width: `${DISCIPLINE_SUMMARY.bike.pct}%`, backgroundColor: BIKE_COLOR }}
            >
              {DISCIPLINE_SUMMARY.bike.pct}%
            </div>
            <div
              className="flex items-center justify-center text-xs font-bold text-black/70 transition-all duration-500"
              style={{ width: `${DISCIPLINE_SUMMARY.run.pct}%`, backgroundColor: RUN_COLOR }}
            >
              {DISCIPLINE_SUMMARY.run.pct}%
            </div>
          </div>
          <div className="flex justify-between mt-3 text-xs text-slate-500">
            <span style={{ color: SWIM_COLOR }}>● Swim · {DISCIPLINE_SUMMARY.swim.hours}h</span>
            <span style={{ color: BIKE_COLOR }}>● Bike · {DISCIPLINE_SUMMARY.bike.hours}h</span>
            <span style={{ color: RUN_COLOR }}>● Run · {DISCIPLINE_SUMMARY.run.hours}h</span>
          </div>
        </div>

        {/* ── Weekly Volume Chart ── */}
        <div
          className="rounded-2xl p-5 border"
          style={{ borderColor: 'rgba(59,130,246,0.15)', backgroundColor: 'rgba(15,23,42,0.7)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Weekly Volume</h3>
            <div className="flex items-center gap-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: SWIM_COLOR }} />Swim</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: BIKE_COLOR }} />Bike</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: RUN_COLOR }} />Run</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={WEEKLY_DATA} margin={{ top: 4, right: 4, left: -12, bottom: 0 }} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `${(v / 60).toFixed(1)}h`}
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="swim" stackId="a" fill={SWIM_COLOR} radius={[0, 0, 0, 0]} />
              <Bar dataKey="bike" stackId="a" fill={BIKE_COLOR} radius={[0, 0, 0, 0]} />
              <Bar dataKey="run"  stackId="a" fill={RUN_COLOR}  radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ── Race Type Distribution Target ── */}
        <div
          className="rounded-2xl p-5 border"
          style={{ borderColor: 'rgba(59,130,246,0.15)', backgroundColor: 'rgba(15,23,42,0.7)' }}
        >
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 mb-4">Race Target Distribution</h3>

          {/* Race selector tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {(Object.keys(RACE_TARGETS) as RaceType[]).map((race) => (
              <button
                key={race}
                onClick={() => setSelectedRace(race)}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200"
                style={
                  selectedRace === race
                    ? { backgroundColor: '#3b82f6', color: '#fff', boxShadow: '0 0 12px rgba(59,130,246,0.4)' }
                    : { backgroundColor: 'rgba(59,130,246,0.08)', color: '#64748b', border: '1px solid rgba(59,130,246,0.15)' }
                }
              >
                {race}
              </button>
            ))}
          </div>

          <div className="space-y-5">
            <RaceCompareBar
              label="Swim"
              actual={ACTUAL_PCT.swim}
              target={targets.swim}
              color={SWIM_COLOR}
            />
            <RaceCompareBar
              label="Bike"
              actual={ACTUAL_PCT.bike}
              target={targets.bike}
              color={BIKE_COLOR}
            />
            <RaceCompareBar
              label="Run"
              actual={ACTUAL_PCT.run}
              target={targets.run}
              color={RUN_COLOR}
            />
          </div>

          <p className="text-[11px] text-slate-500 mt-4">
            White marker = target for <span className="text-blue-400 font-medium">{selectedRace}</span>. Solid bar = your actual split. Delta shows percentage point difference.
          </p>
        </div>

        {/* ── Brick Workouts ── */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: 'rgba(59,130,246,0.15)', backgroundColor: 'rgba(15,23,42,0.7)' }}
        >
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(59,130,246,0.12)' }}>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Brick Workouts</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Consecutive disciplines within 60 min</p>
            </div>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)' }}
            >
              {BRICK_WORKOUTS.length} detected
            </span>
          </div>

          <div className="divide-y" style={{ borderColor: 'rgba(59,130,246,0.08)' }}>
            {BRICK_WORKOUTS.map((brick) => {
              const isBikeRun = brick.type === 'Bike → Run'
              const firstColor  = isBikeRun ? BIKE_COLOR : SWIM_COLOR
              const secondColor = isBikeRun ? RUN_COLOR  : BIKE_COLOR
              return (
                <div
                  key={brick.id}
                  className="px-5 py-3.5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Date */}
                  <div className="text-xs text-slate-500 w-14 shrink-0">{brick.date}</div>

                  {/* Type badge */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-semibold" style={{ color: firstColor }}>
                      {brick.type.split(' → ')[0]}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                    <span className="text-xs font-semibold" style={{ color: secondColor }}>
                      {brick.type.split(' → ')[1]}
                    </span>
                  </div>

                  {/* Gap indicator */}
                  <div
                    className="text-[10px] px-2 py-0.5 rounded-full shrink-0"
                    style={{ backgroundColor: 'rgba(250,204,21,0.1)', color: '#facc15', border: '1px solid rgba(250,204,21,0.2)' }}
                  >
                    T2: {brick.gap}
                  </div>

                  {/* Segments */}
                  <div className="flex-1 text-right text-xs text-slate-400 hidden sm:block">
                    {brick.first} · {brick.second}
                  </div>

                  {/* Total */}
                  <div className="text-xs font-bold text-slate-200 shrink-0">{brick.total}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Science Card ── */}
        <div
          className="rounded-2xl p-5 relative overflow-hidden border"
          style={{ borderColor: 'rgba(34,211,238,0.2)', backgroundColor: 'rgba(6,182,212,0.04)' }}
        >
          {/* Background gradient */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at top right, rgba(34,211,238,0.07) 0%, transparent 60%)',
          }} />

          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.25)' }}
              >
                <FlaskConical className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">Research Insights</span>
            </div>

            <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
              <p>
                <span className="font-semibold text-slate-200">Brick workouts (Millet & Vleck, 2000):</span>{' '}
                The bike-to-run transition produces a distinct "running discomfort" caused by altered neuromuscular recruitment. Practicing T2 transitions regularly reduces performance loss by up to 20% in the run leg.
              </p>
              <p>
                <span className="font-semibold text-slate-200">Age-grouper training distribution:</span>{' '}
                Research suggests age-group triathletes perform optimally with 25–30% swim, 40–45% bike, and 30–35% run volume — weighted toward the longest discipline. Swim efficiency often delivers disproportionate race-day gains per training hour invested.
              </p>
              <p>
                <span className="font-semibold text-slate-200">Polarized periodization:</span>{' '}
                Studies on elite triathletes show 80% low-intensity / 20% high-intensity training maximizes adaptation while minimizing injury risk across all three disciplines.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {['Millet & Vleck 2000', 'Polarized Training', 'Age-Group Research'].map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: 'rgba(34,211,238,0.08)', color: '#67e8f9', border: '1px solid rgba(34,211,238,0.15)' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
