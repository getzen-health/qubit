'use client'

import Link from 'next/link'
import { ArrowLeft, Flame, Zap, FlaskConical, TrendingUp, Info } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Session {
  id: number
  date: string
  label: string
  type: string
  durationMin: number
  kcalPerMin: number
  fatPct: number
  carbPct: number
  fatG: number
  carbG: number
  rer: number
  zone: IntensityZone
}

type IntensityZone = 'light' | 'moderate' | 'vigorous' | 'maximal'

interface ZoneProfile {
  label: string
  kcalRange: string
  rerRange: string
  fatPct: number
  carbPct: number
  color: string
  accent: string
  description: string
}

// ─── Static zone profiles ────────────────────────────────────────────────────

const ZONE_PROFILES: Record<IntensityZone, ZoneProfile> = {
  light: {
    label: 'Light',
    kcalRange: '<5 kcal/min',
    rerRange: '~0.72',
    fatPct: 70,
    carbPct: 30,
    color: '#f97316',
    accent: '#fed7aa',
    description: 'Easy walk, Zone 1 — fatty acid oxidation dominant',
  },
  moderate: {
    label: 'Moderate',
    kcalRange: '5–10 kcal/min',
    rerRange: '~0.85',
    fatPct: 45,
    carbPct: 55,
    color: '#fb923c',
    accent: '#fdba74',
    description: 'Zone 2 run, tempo ride — crossover zone',
  },
  vigorous: {
    label: 'Vigorous',
    kcalRange: '10–15 kcal/min',
    rerRange: '~0.95',
    fatPct: 15,
    carbPct: 85,
    color: '#ea580c',
    accent: '#c2410c',
    description: 'Threshold, HIIT — glycolytic shift',
  },
  maximal: {
    label: 'Maximal',
    kcalRange: '>15 kcal/min',
    rerRange: '≥1.0',
    fatPct: 2,
    carbPct: 98,
    color: '#9a3412',
    accent: '#7c2d12',
    description: 'Sprints, max intervals — nearly pure carbohydrate',
  },
}

// ─── Mock data — triathlete mixing Zone 2 and HIIT ───────────────────────────

function classifyZone(kcalPerMin: number): IntensityZone {
  if (kcalPerMin < 5) return 'light'
  if (kcalPerMin < 10) return 'moderate'
  if (kcalPerMin < 15) return 'vigorous'
  return 'maximal'
}

function deriveSubstrate(zone: IntensityZone) {
  const p = ZONE_PROFILES[zone]
  return { fatPct: p.fatPct, carbPct: p.carbPct, rer: parseFloat(p.rerRange.replace('~', '').replace('≥', '')) }
}

function buildSession(
  id: number,
  dateOffset: number,
  label: string,
  type: string,
  durationMin: number,
  kcalPerMin: number
): Session {
  const d = new Date('2026-03-20')
  d.setDate(d.getDate() - dateOffset)
  const zone = classifyZone(kcalPerMin)
  const { fatPct, carbPct, rer } = deriveSubstrate(zone)
  const totalKcal = kcalPerMin * durationMin
  // 1 g fat = 9 kcal; 1 g carb = 4 kcal
  const fatKcal = totalKcal * (fatPct / 100)
  const carbKcal = totalKcal * (carbPct / 100)
  return {
    id,
    date: d.toISOString().split('T')[0],
    label,
    type,
    durationMin,
    kcalPerMin,
    fatPct,
    carbPct,
    fatG: Math.round(fatKcal / 9),
    carbG: Math.round(carbKcal / 4),
    rer,
    zone,
  }
}

const SESSIONS: Session[] = [
  buildSession(1,  1,  'Tue AM Run',     'Zone 2 Run',     65,  7.2),
  buildSession(2,  2,  'Mon Swim',       'Easy Swim',      50,  6.8),
  buildSession(3,  4,  'Sat Long Ride',  'Endurance Ride', 120, 8.1),
  buildSession(4,  5,  'Fri HIIT',       'Interval Run',   35,  13.4),
  buildSession(5,  7,  'Wed Run',        'Zone 2 Run',     60,  7.5),
  buildSession(6,  8,  'Tue Swim',       'Easy Swim',      45,  6.2),
  buildSession(7,  9,  'Mon Brick',      'Bike + Run',     90,  9.3),
  buildSession(8,  11, 'Sat Sprint Tri', 'Race',           72,  15.8),
  buildSession(9,  12, 'Fri Run',        'Zone 2 Run',     70,  7.0),
  buildSession(10, 14, 'Wed HIIT Bike',  'HIIT Ride',      40,  12.7),
  buildSession(11, 15, 'Tue Swim',       'Moderate Swim',  55,  6.5),
  buildSession(12, 16, 'Mon Easy Jog',   'Recovery Run',   40,  4.8),
]

// Chart data (sessions in chronological order for chart)
const chartData = [...SESSIONS]
  .sort((a, b) => a.date.localeCompare(b.date))
  .map((s) => ({
    name: s.label,
    fat: s.fatPct,
    carb: s.carbPct,
    zone: s.zone,
    rer: s.rer,
  }))

// ─── Summary stats ────────────────────────────────────────────────────────────

const totalFatG = SESSIONS.reduce((s, r) => s + r.fatG, 0)
const totalFatKcal = SESSIONS.reduce((s, r) => s + r.fatG * 9, 0)
const totalKcal = SESSIONS.reduce((s, r) => s + r.kcalPerMin * r.durationMin, 0)
const avgFatPct = Math.round(totalFatKcal / totalKcal * 100)
const avgRER = (SESSIONS.reduce((s, r) => s + r.rer, 0) / SESSIONS.length).toFixed(2)
const fatBurningSessionCount = SESSIONS.filter((s) => s.zone === 'light' || s.zone === 'moderate').length
const fatBurningPct = Math.round((fatBurningSessionCount / SESSIONS.length) * 100)

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function FuelTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  const fat = payload.find((p) => p.name === 'fat')?.value ?? 0
  const carb = payload.find((p) => p.name === 'carb')?.value ?? 0
  return (
    <div
      style={{
        background: 'hsl(0 0% 10% / 0.96)',
        border: '1px solid hsl(0 0% 20%)',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 12,
        lineHeight: 1.6,
      }}
    >
      <p style={{ color: '#f97316', fontWeight: 700, marginBottom: 4 }}>{label}</p>
      <p style={{ color: '#fed7aa' }}>Fat: {fat}%</p>
      <p style={{ color: '#64748b' }}>Carb: {carb}%</p>
    </div>
  )
}

// ─── RER gauge strip ──────────────────────────────────────────────────────────

function RERGauge({ value }: { value: number }) {
  // Map RER 0.70–1.05 → 0–100%
  const min = 0.70, max = 1.05
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
  return (
    <div className="relative h-3 rounded-full overflow-hidden" style={{ background: 'hsl(0 0% 18%)' }}>
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, #f97316 0%, #ea580c 50%, #9a3412 100%)`,
        }}
      />
      {/* Crossover marker at 0.85 ≈ 43% */}
      <div
        className="absolute top-0 bottom-0 w-px"
        style={{ left: '43%', background: 'rgba(255,255,255,0.3)' }}
      />
    </div>
  )
}

// ─── Fuel bar component ───────────────────────────────────────────────────────

function FuelBar({ fatPct, carbPct }: { fatPct: number; carbPct: number }) {
  return (
    <div className="flex h-2.5 rounded-full overflow-hidden w-full" style={{ background: 'hsl(0 0% 18%)' }}>
      <div
        className="h-full transition-all duration-500"
        style={{ width: `${fatPct}%`, background: '#f97316' }}
      />
      <div
        className="h-full transition-all duration-500"
        style={{ width: `${carbPct}%`, background: '#334155' }}
      />
    </div>
  )
}

// ─── Zone badge ───────────────────────────────────────────────────────────────

function ZoneBadge({ zone }: { zone: IntensityZone }) {
  const colors: Record<IntensityZone, string> = {
    light:    'bg-orange-900/40 text-orange-300 border-orange-800/50',
    moderate: 'bg-orange-800/40 text-orange-200 border-orange-700/50',
    vigorous: 'bg-red-900/40 text-red-300 border-red-800/50',
    maximal:  'bg-red-950/60 text-red-200 border-red-900/50',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border tracking-wide uppercase ${colors[zone]}`}>
      {ZONE_PROFILES[zone].label}
    </span>
  )
}

// ─── Summary stat card ────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  unit,
  sub,
  icon,
}: {
  label: string
  value: string | number
  unit?: string
  sub?: string
  icon: React.ReactNode
}) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2"
      style={{
        background: 'hsl(0 0% 10%)',
        border: '1px solid hsl(0 0% 18%)',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-orange-400">{icon}</span>
        <span className="text-xs text-gray-400 font-medium tracking-wide uppercase">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-white">{value}</span>
        {unit && <span className="text-sm text-gray-400">{unit}</span>}
      </div>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  )
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function SubstrateMetabolismPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: 'hsl(0 0% 6%)' }}
    >
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50 backdrop-blur-md border-b"
        style={{
          background: 'hsl(0 0% 6% / 0.85)',
          borderColor: 'hsl(0 0% 16%)',
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/explore"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-orange-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Explore
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-orange-500" />
            <div>
              <h1 className="text-base font-bold text-white leading-none">Substrate Metabolism</h1>
              <p className="text-xs text-gray-500 leading-none mt-0.5">Fat vs Carbohydrate Fuel Mix</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-24">

        {/* ── Summary strip ── */}
        <section
          className="rounded-2xl p-5"
          style={{
            background: 'linear-gradient(135deg, hsl(20 70% 10%) 0%, hsl(0 0% 9%) 60%, hsl(0 0% 8%) 100%)',
            border: '1px solid hsl(25 50% 20%)',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-semibold text-orange-400 tracking-widest uppercase">12-Session Summary</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="Total Fat Burned"
              value={totalFatG}
              unit="g"
              sub={`${Math.round(totalFatG * 9 / 1000 * 10) / 10} MJ from fat`}
              icon={<Flame className="w-4 h-4" />}
            />
            <StatCard
              label="Avg Fat Mix"
              value={avgFatPct}
              unit="%"
              sub="of total energy from fat"
              icon={<FlaskConical className="w-4 h-4" />}
            />
            <StatCard
              label="Avg RER"
              value={avgRER}
              sub="0.72 = pure fat · 1.0 = carb"
              icon={<Zap className="w-4 h-4" />}
            />
            <StatCard
              label="Fat-Burning Sessions"
              value={`${fatBurningPct}%`}
              sub={`${fatBurningSessionCount} of ${SESSIONS.length} in fat zone`}
              icon={<TrendingUp className="w-4 h-4" />}
            />
          </div>
        </section>

        {/* ── Stacked bar chart ── */}
        <section
          className="rounded-2xl p-5"
          style={{
            background: 'hsl(0 0% 9%)',
            border: '1px solid hsl(0 0% 17%)',
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-white">Fuel Mix per Session</h2>
            <span className="text-xs text-gray-500">Last 12 workouts · chronological</span>
          </div>
          <p className="text-xs text-gray-500 mb-5">
            Each bar = % of energy from fat (orange) vs carbohydrate (slate)
          </p>

          {/* Legend */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: '#f97316' }} />
              <span className="text-xs text-gray-400">Fat</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: '#334155' }} />
              <span className="text-xs text-gray-400">Carbohydrate</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -28, bottom: 60 }}>
              <CartesianGrid vertical={false} stroke="hsl(0 0% 16%)" strokeDasharray="4 4" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#6b7280', fontSize: 9 }}
                angle={-40}
                textAnchor="end"
                interval={0}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 10 }}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<FuelTooltip />} cursor={{ fill: 'hsl(0 0% 13%)' }} />
              <Bar dataKey="fat" name="fat" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} />
              <Bar dataKey="carb" name="carb" stackId="a" fill="#334155" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* ── Intensity zones table ── */}
        <section
          className="rounded-2xl p-5"
          style={{
            background: 'hsl(0 0% 9%)',
            border: '1px solid hsl(0 0% 17%)',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-white">Intensity → Fuel Substrate</h2>
          </div>
          <p className="text-xs text-gray-500 mb-5">
            Romijn et al. (1993) · Brooks & Mercier crossover concept
          </p>

          <div className="space-y-4">
            {(Object.entries(ZONE_PROFILES) as [IntensityZone, ZoneProfile][]).map(([key, z]) => {
              const rerNum = parseFloat(z.rerRange.replace('~', '').replace('≥', ''))
              return (
                <div
                  key={key}
                  className="rounded-xl p-4"
                  style={{ background: 'hsl(0 0% 12%)', border: '1px solid hsl(0 0% 19%)' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <ZoneBadge zone={key} />
                        <span className="text-xs text-gray-400 font-mono">{z.kcalRange}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{z.description}</p>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <p className="text-lg font-bold text-white font-mono">{z.rerRange}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide">RER</p>
                    </div>
                  </div>

                  {/* Fuel breakdown bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-orange-400 font-semibold">{z.fatPct}% fat</span>
                      <span className="text-slate-400 font-semibold">{z.carbPct}% carb</span>
                    </div>
                    <FuelBar fatPct={z.fatPct} carbPct={z.carbPct} />
                  </div>

                  {/* RER gauge */}
                  <div className="mt-2.5 space-y-1">
                    <div className="flex justify-between text-[10px] text-gray-600">
                      <span>0.72 fat</span>
                      <span>0.85 mixed</span>
                      <span>1.0 carb</span>
                    </div>
                    <RERGauge value={rerNum} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Recent sessions list ── */}
        <section
          className="rounded-2xl p-5"
          style={{
            background: 'hsl(0 0% 9%)',
            border: '1px solid hsl(0 0% 17%)',
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-white">Recent Sessions</h2>
          </div>
          <p className="text-xs text-gray-500 mb-5">Fat g · Carb g · RER per workout</p>

          <div className="space-y-2">
            {SESSIONS.map((s) => (
              <div
                key={s.id}
                className="rounded-xl px-4 py-3 flex items-center gap-3"
                style={{ background: 'hsl(0 0% 12%)', border: '1px solid hsl(0 0% 18%)' }}
              >
                {/* Date + label */}
                <div className="w-20 shrink-0">
                  <p className="text-[10px] text-gray-500 font-mono">{s.date.slice(5)}</p>
                  <p className="text-xs text-gray-300 font-medium leading-tight truncate">{s.label}</p>
                </div>

                {/* Zone badge */}
                <div className="w-20 shrink-0">
                  <ZoneBadge zone={s.zone} />
                </div>

                {/* Fuel bar + values */}
                <div className="flex-1 min-w-0">
                  <FuelBar fatPct={s.fatPct} carbPct={s.carbPct} />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span className="text-orange-400">{s.fatG}g fat</span>
                    <span className="text-slate-400">{s.carbG}g carb</span>
                  </div>
                </div>

                {/* RER */}
                <div className="text-right shrink-0 w-12">
                  <p className="text-sm font-bold text-white font-mono">{s.rer.toFixed(2)}</p>
                  <p className="text-[10px] text-gray-600">RER</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Science card ── */}
        <section
          className="rounded-2xl p-5"
          style={{
            background: 'linear-gradient(135deg, hsl(20 40% 9%) 0%, hsl(0 0% 8%) 100%)',
            border: '1px solid hsl(25 30% 18%)',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-white">The Science</h2>
          </div>

          <div className="space-y-4 text-xs text-gray-400 leading-relaxed">
            <div>
              <p className="text-orange-400 font-semibold mb-1">Crossover Concept</p>
              <p>
                Brooks & Mercier (1994, <em>J Appl Physiol</em>) established that as exercise intensity rises, the body crosses
                over from preferring fat to preferring carbohydrate. The crossover point — typically around 50–60% VO₂max —
                shifts rightward with aerobic training, meaning trained athletes burn more fat at any given intensity.
              </p>
            </div>
            <div>
              <p className="text-orange-400 font-semibold mb-1">Peak Fat Oxidation in Zone 2</p>
              <p>
                Achten & Jeukendrup (2004, <em>Sports Med</em>) showed peak fat oxidation occurs at ~40–65% VO₂max. Trained
                endurance athletes can oxidise 0.5–1.0 g of fat per minute at their peak. This is the physiological basis
                for Zone 2 training.
              </p>
            </div>
            <div>
              <p className="text-orange-400 font-semibold mb-1">Intensity Partitioning</p>
              <p>
                Romijn et al. (1993, <em>Am J Physiol</em>) quantified fuel use directly: light exercise relies ~70% on fat;
                moderate drops to ~45% fat; vigorous exercise only ~15%; maximal effort approximates 2% fat — essentially
                pure glycolytic metabolism.
              </p>
            </div>
            <div>
              <p className="text-orange-400 font-semibold mb-1">Mitochondrial Adaptations</p>
              <p>
                Holloszy (1975, <em>J Biol Chem</em>) demonstrated that Zone 2 training increases mitochondrial density and
                the oxidative enzymes responsible for fatty acid metabolism, providing the cellular basis for improved fat
                oxidation capacity in trained athletes.
              </p>
            </div>
            <div className="pt-2 border-t" style={{ borderColor: 'hsl(0 0% 18%)' }}>
              <p className="text-gray-600">
                <strong className="text-gray-500">RER</strong> (Respiratory Exchange Ratio) = CO₂ produced / O₂ consumed.
                A value of 0.72 indicates pure fat oxidation; 1.0 indicates pure carbohydrate oxidation. Values above 1.0
                indicate anaerobic contributions (excess CO₂ buffering lactic acid).
              </p>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}
