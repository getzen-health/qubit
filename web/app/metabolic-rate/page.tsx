'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Flame, Scale, FlaskConical, Zap, Info } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'

// ─── Mock data ────────────────────────────────────────────────────────────────

const MIFFLIN_BMR = 1747   // 10×75 + 6.25×178 − 5×35 + 5
const WATCH_BMR_AVG = 1820 // Apple Watch 30-day average
const BODY_WEIGHT_KG = 75

/** Generate 30-day dataset: basal ~1820±50, active ~400±150 */
function generateDailyData() {
  const seed = [
    28, -12, 41, -33, 17, 53, -8, 36, -45, 22,
    -19, 44, 11, -37, 50, -26, 38, -15, 30, -42,
    25, -7, 47, -31, 19, 43, -22, 35, -11, 46,
  ]
  const activeSeed = [
    320, 480, 250, 510, 390, 430, 180, 560, 310, 420,
    490, 270, 540, 360, 410, 230, 580, 290, 450, 340,
    500, 210, 470, 380, 530, 260, 440, 370, 490, 320,
  ]

  const now = new Date(2026, 2, 19) // 2026-03-19
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now)
    d.setDate(now.getDate() - (29 - i))
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const basal = WATCH_BMR_AVG + seed[i]
    const active = activeSeed[i]
    return {
      date: label,
      bmr: basal,
      tdee: basal + active,
      mifflin: MIFFLIN_BMR,
    }
  })
}

const DAILY_DATA = generateDailyData()

// ─── Activity levels ──────────────────────────────────────────────────────────

interface ActivityLevel {
  id: string
  label: string
  description: string
  multiplier: number
}

const ACTIVITY_LEVELS: ActivityLevel[] = [
  { id: 'sedentary',   label: 'Sedentary',        description: 'Little or no exercise',           multiplier: 1.2   },
  { id: 'light',       label: 'Lightly Active',    description: 'Light exercise 1–3 days/week',    multiplier: 1.375 },
  { id: 'moderate',    label: 'Moderately Active', description: 'Moderate exercise 3–5 days/week', multiplier: 1.55  },
  { id: 'very',        label: 'Very Active',       description: 'Hard exercise 6–7 days/week',     multiplier: 1.725 },
  { id: 'extra',       label: 'Extra Active',      description: 'Very hard exercise + physical job',multiplier: 1.9   },
]

// ─── Tooltip ──────────────────────────────────────────────────────────────────

interface TooltipPayloadEntry {
  name: string
  value: number
  color: string
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 shadow-xl text-sm">
      <p className="text-gray-400 font-medium mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
          <span className="text-gray-300">{entry.name}:</span>
          <span className="font-semibold" style={{ color: entry.color }}>
            {entry.value.toLocaleString()} kcal
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  sub,
  color,
  glow,
}: {
  icon: React.ElementType
  label: string
  value: string
  unit: string
  sub: string
  color: string
  glow: string
}) {
  return (
    <div
      className="relative flex-1 min-w-0 rounded-2xl p-4 border border-gray-800 bg-gray-900 overflow-hidden"
      style={{ boxShadow: `0 0 24px -6px ${glow}` }}
    >
      {/* subtle corner glow */}
      <div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-20 blur-2xl pointer-events-none"
        style={{ background: glow }}
      />
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg" style={{ background: `${glow}22` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider leading-tight">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</span>
        <span className="text-sm text-gray-500 font-medium">{unit}</span>
      </div>
      <p className="text-xs text-gray-600 mt-1">{sub}</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MetabolicRatePage() {
  const [activeLevel, setActiveLevel] = useState<string>('moderate')

  const selectedLevel = ACTIVITY_LEVELS.find(l => l.id === activeLevel) ?? ACTIVITY_LEVELS[2]
  const tdeeCalc = Math.round(WATCH_BMR_AVG * selectedLevel.multiplier)
  const proteinG = Math.round((tdeeCalc * 0.30) / 4)
  const carbsG   = Math.round((tdeeCalc * 0.40) / 4)
  const fatG      = Math.round((tdeeCalc * 0.30) / 9)

  const delta = WATCH_BMR_AVG - MIFFLIN_BMR
  const deltaSign = delta >= 0 ? '+' : ''
  const deltaAbsPct = Math.abs(Math.round((delta / MIFFLIN_BMR) * 100))

  let interpretation: string
  if (Math.abs(delta) <= 100) {
    interpretation = 'Your Apple Watch BMR estimate closely matches the Mifflin-St Jeor formula (within 6%). This suggests the formula is a reliable predictor for your body composition.'
  } else if (delta > 0) {
    interpretation = `Your Apple Watch reads ${delta} kcal/day higher than the formula, possibly reflecting higher lean muscle mass or elevated thermogenesis. Consider a DEXA scan for precise body composition data.`
  } else {
    interpretation = `Your Apple Watch reads ${Math.abs(delta)} kcal/day lower than the formula. This can occur with lower muscle mass or if the Watch is calibrated conservatively. Activity tracker variability is typically ±10%.`
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-800/60">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/calories"
            className="p-2 rounded-xl hover:bg-gray-800 transition-colors"
            aria-label="Back to calories"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Basal Metabolic Rate</h1>
              {/* orange accent pill */}
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                BMR
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Apple Watch estimate vs. Mifflin-St Jeor formula</p>
          </div>
          <Flame className="w-5 h-5 text-orange-500 flex-shrink-0" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-5">

        {/* ── Hero gradient strip ────────────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden">
          <div
            className="absolute inset-0 opacity-90"
            style={{
              background: 'linear-gradient(135deg, #f97316 0%, #fb923c 35%, #fbbf24 75%, #f59e0b 100%)',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30" />
          <div className="relative px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white/80 text-xs font-semibold uppercase tracking-widest">30-Day Average</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white tabular-nums">1,820</span>
                  <span className="text-white/80 font-semibold">kcal/day</span>
                </div>
              </div>
              <div className="ml-auto text-right">
                <p className="text-white/70 text-xs">vs formula</p>
                <p className="text-white font-bold text-lg">+{delta} kcal</p>
                <p className="text-white/60 text-xs">{deltaAbsPct}% above</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4-stat row ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <StatCard
            icon={Flame}
            label="Apple Watch BMR"
            value="1,820"
            unit="kcal/day"
            sub="30-day avg · basal only"
            color="#f97316"
            glow="#f97316"
          />
          <StatCard
            icon={Zap}
            label="Avg TDEE"
            value="2,228"
            unit="kcal/day"
            sub="BMR + active energy"
            color="#eab308"
            glow="#eab308"
          />
          <StatCard
            icon={Scale}
            label="Body Weight"
            value="75"
            unit="kg"
            sub="Last logged"
            color="#34d399"
            glow="#34d399"
          />
          <StatCard
            icon={FlaskConical}
            label="Mifflin Formula"
            value="1,747"
            unit="kcal/day"
            sub="Age 35 · 178cm · male"
            color="#60a5fa"
            glow="#60a5fa"
          />
        </div>

        {/* ── 30-day Trend Chart ────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white">30-Day Trend</h2>
            <p className="text-xs text-gray-500 mt-0.5">Daily basal energy & TDEE with formula reference</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={DAILY_DATA} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="bmrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="tdeeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f97316" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: '#6b7280' }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                domain={[1400, 2800]}
                tick={{ fontSize: 10, fill: '#6b7280' }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                formatter={(value) => <span style={{ color: '#9ca3af' }}>{value}</span>}
              />
              <ReferenceLine
                y={MIFFLIN_BMR}
                stroke="#60a5fa"
                strokeDasharray="6 3"
                strokeWidth={1.5}
                label={{ value: 'Mifflin', position: 'right', fontSize: 10, fill: '#60a5fa' }}
              />
              <Area
                type="monotone"
                dataKey="bmr"
                name="Apple Watch BMR"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#bmrGrad)"
                dot={false}
                activeDot={{ r: 4, stroke: '#22c55e', strokeWidth: 2, fill: '#0a0a0a' }}
              />
              <Area
                type="monotone"
                dataKey="tdee"
                name="TDEE"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#tdeeGrad)"
                dot={false}
                activeDot={{ r: 4, stroke: '#f97316', strokeWidth: 2, fill: '#0a0a0a' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── Formula Comparison Card ───────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-gray-800">
            <h2 className="text-base font-semibold text-white">Formula Comparison</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-x divide-gray-800">
            {/* Apple Watch */}
            <div className="px-3 py-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Apple Watch</p>
              <p className="text-xl font-bold text-orange-400 tabular-nums">1,820</p>
              <p className="text-xs text-gray-600 mt-0.5">kcal/day</p>
            </div>
            {/* Delta */}
            <div className="px-3 py-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Difference</p>
              <p className={`text-xl font-bold tabular-nums ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {deltaSign}{delta}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">{deltaAbsPct}% {delta >= 0 ? 'above' : 'below'}</p>
            </div>
            {/* Mifflin */}
            <div className="px-3 py-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Mifflin–St Jeor</p>
              <p className="text-xl font-bold text-blue-400 tabular-nums">1,747</p>
              <p className="text-xs text-gray-600 mt-0.5">kcal/day</p>
            </div>
          </div>
          <div className="px-4 py-3 border-t border-gray-800 bg-gray-950/60">
            <p className="text-xs text-gray-400 leading-relaxed">{interpretation}</p>
          </div>
        </div>

        {/* ── TDEE Calculator ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-gray-800">
            <h2 className="text-base font-semibold text-white">TDEE Calculator</h2>
            <p className="text-xs text-gray-500 mt-0.5">Select your activity level to estimate daily energy needs</p>
          </div>

          {/* Activity selector */}
          <div className="px-4 pt-4 space-y-2">
            {ACTIVITY_LEVELS.map((level) => {
              const isSelected = activeLevel === level.id
              return (
                <button
                  key={level.id}
                  onClick={() => setActiveLevel(level.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-150 text-left ${
                    isSelected
                      ? 'border-orange-500/60 bg-orange-500/10'
                      : 'border-gray-800 bg-gray-800/40 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected ? 'border-orange-500' : 'border-gray-600'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${isSelected ? 'text-orange-400' : 'text-gray-300'}`}>
                        {level.label}
                      </p>
                      <p className="text-xs text-gray-500">{level.description}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-mono px-2 py-1 rounded-md ${
                    isSelected ? 'bg-orange-500/20 text-orange-300' : 'bg-gray-700 text-gray-400'
                  }`}>
                    ×{level.multiplier}
                  </span>
                </button>
              )
            })}
          </div>

          {/* TDEE result */}
          <div className="mx-4 mt-4 rounded-xl bg-gradient-to-br from-orange-500/15 to-yellow-500/10 border border-orange-500/25 p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Estimated TDEE</p>
              <p className="text-xs text-gray-500">
                1,820 × {selectedLevel.multiplier}
              </p>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-orange-400 tabular-nums">
                {tdeeCalc.toLocaleString()}
              </span>
              <span className="text-gray-500 font-medium">kcal/day</span>
            </div>
          </div>

          {/* Macro chips */}
          <div className="px-4 pt-3 pb-4">
            <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide">Macronutrient Targets</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-center">
                <p className="text-xs text-rose-400 font-semibold mb-1">Protein</p>
                <p className="text-xl font-bold text-rose-300 tabular-nums">{proteinG}g</p>
                <p className="text-xs text-gray-600 mt-0.5">30% · 4 kcal/g</p>
              </div>
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center">
                <p className="text-xs text-amber-400 font-semibold mb-1">Carbs</p>
                <p className="text-xl font-bold text-amber-300 tabular-nums">{carbsG}g</p>
                <p className="text-xs text-gray-600 mt-0.5">40% · 4 kcal/g</p>
              </div>
              <div className="rounded-xl bg-sky-500/10 border border-sky-500/20 p-3 text-center">
                <p className="text-xs text-sky-400 font-semibold mb-1">Fat</p>
                <p className="text-xl font-bold text-sky-300 tabular-nums">{fatG}g</p>
                <p className="text-xs text-gray-600 mt-0.5">30% · 9 kcal/g</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Science Card ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-800 bg-gray-950 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/25">
              <Info className="w-4 h-4 text-indigo-400" />
            </div>
            <h2 className="text-base font-semibold text-white">The Science</h2>
          </div>

          <div className="space-y-4 text-sm text-gray-400 leading-relaxed">
            <div>
              <h3 className="text-gray-300 font-semibold text-xs uppercase tracking-wider mb-1">What is BMR?</h3>
              <p>
                Basal Metabolic Rate is the energy your body expends at complete rest to sustain vital functions:
                breathing, circulation, cellular repair, and thermoregulation. It represents 60–75% of total daily
                energy expenditure for most people.
              </p>
            </div>

            <div>
              <h3 className="text-gray-300 font-semibold text-xs uppercase tracking-wider mb-1">How Apple Watch Estimates It</h3>
              <p>
                The Watch uses resting heart rate, heart rate variability, age, sex, height, and weight — combined
                with on-wrist accelerometer data — to model basal energy using a proprietary algorithm. It samples
                throughout the night and low-activity periods for the most accurate reading.
              </p>
            </div>

            <div>
              <h3 className="text-gray-300 font-semibold text-xs uppercase tracking-wider mb-1">Mifflin-St Jeor (1990) Accuracy</h3>
              <p>
                Published in the <em className="text-gray-300">Journal of the American Dietetic Association</em>, this
                formula predicts BMR within <strong className="text-gray-200">±10%</strong> for the majority of adults
                and is considered the gold standard for clinical dietetics — superior to the older Harris-Benedict
                equation.
              </p>
            </div>

            <div>
              <h3 className="text-gray-300 font-semibold text-xs uppercase tracking-wider mb-1">Muscle vs. Fat Tissue</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div className="rounded-xl bg-gray-900 border border-gray-800 p-3 text-center">
                  <p className="text-emerald-400 font-bold text-lg">13 kcal</p>
                  <p className="text-xs text-gray-500 mt-0.5">per kg of <span className="text-emerald-300">muscle</span> per day</p>
                </div>
                <div className="rounded-xl bg-gray-900 border border-gray-800 p-3 text-center">
                  <p className="text-yellow-400 font-bold text-lg">4.5 kcal</p>
                  <p className="text-xs text-gray-500 mt-0.5">per kg of <span className="text-yellow-300">fat</span> per day</p>
                </div>
              </div>
              <p className="mt-3">
                Muscle tissue burns nearly <strong className="text-gray-200">3× more calories</strong> at rest than fat. This
                is why resistance training sustainably raises BMR — even small gains in lean mass increase your
                daily caloric baseline without changing activity level.
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
