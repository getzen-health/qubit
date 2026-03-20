'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  LabelList,
} from 'recharts'
import { Wind, Footprints, Heart, Activity, Moon, Info, BookOpen, AlertTriangle } from 'lucide-react'

// ─── Mock data ────────────────────────────────────────────────────────────────

const US_AVERAGE_LIFE_EXPECTANCY = 79.1
const NET_YEARS = 3.5
const PROJECTED_YEARS = US_AVERAGE_LIFE_EXPECTANCY + NET_YEARS // 82.6

interface Biomarker {
  id: string
  name: string
  value: string
  unit: string
  yearsImpact: number
  status: string
  populationComparison: string
  color: string
  icon: React.ElementType
  citation: string
  scienceSummary: string
}

const biomarkers: Biomarker[] = [
  {
    id: 'vo2max',
    name: 'VO\u2082 Max',
    value: '48.2',
    unit: 'ml/kg/min',
    yearsImpact: 3.0,
    status: 'Above Average',
    populationComparison: 'Top 30% for your age group',
    color: '#7c3aed', // purple-700
    icon: Wind,
    citation: 'Myers et al., NEJM 2002',
    scienceSummary:
      'Top 20% fitness vs bottom quintile = 5.9yr survival advantage. Each 1 MET increase \u2192 12% lower mortality.',
  },
  {
    id: 'steps',
    name: 'Daily Steps',
    value: '6,800',
    unit: 'steps/day',
    yearsImpact: 2.0,
    status: 'Moderately Active',
    populationComparison: 'Above US median of ~4,500 steps',
    color: '#16a34a', // green-700
    icon: Footprints,
    citation: 'Paluch et al., JAMA Network Open 2021',
    scienceSummary:
      '7,000\u20139,000 steps/day \u2192 50\u201370% lower all-cause mortality. Each additional 1,000 steps \u2192 ~10\u201315% lower risk.',
  },
  {
    id: 'rhr',
    name: 'Resting HR',
    value: '63',
    unit: 'bpm',
    yearsImpact: 1.5,
    status: 'Good',
    populationComparison: 'Below average RHR of ~72 bpm',
    color: '#dc2626', // red-600
    icon: Heart,
    citation: 'Jouven et al., NEJM 2005',
    scienceSummary:
      'RHR <55 vs >75 bpm = 3.8\u00d7 mortality difference. Each 10 bpm increase \u2192 ~16% higher mortality risk.',
  },
  {
    id: 'hrv',
    name: 'HRV',
    value: '42',
    unit: 'ms SDNN',
    yearsImpact: 0.0,
    status: 'Average',
    populationComparison: 'Near population median for age',
    color: '#2563eb', // blue-600
    icon: Activity,
    citation: 'Dekker et al., Circulation 1997; Kleiger 1987',
    scienceSummary:
      'Low HRV is a strong independent predictor of all-cause mortality. SDNN <50ms associated with 5.3\u00d7 mortality risk vs >100ms.',
  },
  {
    id: 'sleep',
    name: 'Sleep Duration',
    value: '6.2',
    unit: 'hrs/night',
    yearsImpact: -3.0,
    status: 'Slightly Short',
    populationComparison: 'Below optimal 7\u20138.5h range',
    color: '#4f46e5', // indigo-600
    icon: Moon,
    citation: 'Gallicchio & Kalesan, J Sleep Res 2009',
    scienceSummary:
      'Optimal duration: 7\u20138.5h. Short sleep <6h \u2192 +10\u201313% mortality risk. Long sleep >9h \u2192 +17\u201334% risk.',
  },
]

// Chart data with start position for waterfall effect
const chartData = biomarkers.map((b) => ({
  name: b.name,
  impact: b.yearsImpact,
  color: b.color,
}))

// ─── Custom tooltip ────────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: { name: string; impact: number } }>
}) {
  if (!active || !payload?.length) return null
  const { name, impact } = payload[0].payload
  const isPositive = impact >= 0
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{name}</p>
      <p className={isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}>
        {isPositive ? '+' : ''}{impact.toFixed(1)} years
      </p>
    </div>
  )
}

// ─── Custom bar label ──────────────────────────────────────────────────────────

interface LabelProps {
  x?: number
  y?: number
  width?: number
  height?: number
  value?: number
}

function ImpactLabel(props: LabelProps) {
  const { x = 0, y = 0, width = 0, height = 0, value = 0 } = props
  const isPositive = value >= 0
  const labelX = isPositive ? x + width + 6 : x + width - 6
  const anchor = isPositive ? 'start' : 'end'
  const labelY = y + height / 2 + 5

  return (
    <text
      x={labelX}
      y={labelY}
      fill={isPositive ? '#16a34a' : '#dc2626'}
      fontSize={13}
      fontWeight={600}
      textAnchor={anchor}
    >
      {isPositive ? '+' : ''}{value.toFixed(1)}y
    </text>
  )
}

// ─── Impact badge ──────────────────────────────────────────────────────────────

function ImpactBadge({ years }: { years: number }) {
  if (years === 0) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
        ±0.0 yrs
      </span>
    )
  }
  const isPositive = years > 0
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        isPositive
          ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
          : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
      }`}
    >
      {isPositive ? '+' : ''}{years.toFixed(1)} yrs
    </span>
  )
}

// ─── Main client component ────────────────────────────────────────────────────

export function LifeExpectancyClient() {
  return (
    <div className="space-y-6">
      {/* ── Summary card ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col items-center text-center shadow-sm">
        {/* Circular display */}
        <div className="relative mb-4">
          <svg width={160} height={160} viewBox="0 0 160 160" className="drop-shadow-md">
            {/* Background ring */}
            <circle
              cx={80}
              cy={80}
              r={68}
              fill="none"
              stroke="currentColor"
              strokeWidth={8}
              className="text-gray-100 dark:text-gray-800"
            />
            {/* Progress arc — full circle for simplicity; visual weight via color */}
            <circle
              cx={80}
              cy={80}
              r={68}
              fill="none"
              stroke="#16a34a"
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={`${(PROJECTED_YEARS / 100) * 2 * Math.PI * 68} ${2 * Math.PI * 68}`}
              transform="rotate(-90 80 80)"
              opacity={0.25}
            />
            {/* Inner fill */}
            <circle cx={80} cy={80} r={58} fill="#f0fdf4" className="dark:hidden" />
            <circle cx={80} cy={80} r={58} fill="#052e16" className="hidden dark:block" />
            {/* Projected years */}
            <text x={80} y={72} textAnchor="middle" fontSize={34} fontWeight={700} fill="#16a34a">
              {PROJECTED_YEARS.toFixed(1)}
            </text>
            <text x={80} y={90} textAnchor="middle" fontSize={11} fill="#6b7280" fontWeight={500}>
              projected years
            </text>
          </svg>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
              +{NET_YEARS.toFixed(1)} years vs average
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            US average: {US_AVERAGE_LIFE_EXPECTANCY} years
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Based on current biomarkers</p>
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <div className="flex items-start gap-2 px-1">
        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <span className="font-semibold text-amber-600 dark:text-amber-400">Estimate only</span> —
          population-level associations, not individual prediction. Many unmeasured factors affect longevity.
        </p>
      </div>

      {/* ── Waterfall bar chart ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Years Gained / Lost per Biomarker
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Compared to population average — peer-reviewed estimates
          </p>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 60, left: 12, bottom: 4 }}
            barCategoryGap="28%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="#e5e7eb"
              className="dark:stroke-gray-700"
            />
            <XAxis
              type="number"
              domain={[-5, 6]}
              tickCount={12}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (v > 0 ? `+${v}` : `${v}`)}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={88}
              tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(156,163,175,0.08)' }} />
            <ReferenceLine x={0} stroke="#9ca3af" strokeWidth={1.5} />
            <Bar dataKey="impact" radius={[0, 4, 4, 0]} maxBarSize={32}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.impact >= 0 ? '#16a34a' : '#ef4444'}
                  fillOpacity={0.85}
                />
              ))}
              <LabelList dataKey="impact" content={<ImpactLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-2 justify-center">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-green-600 inline-block" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Years gained</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Years lost</span>
          </div>
        </div>
      </div>

      {/* ── Metric cards ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 px-1">
          Biomarker Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {biomarkers.map((b) => {
            const Icon = b.icon
            return (
              <div
                key={b.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="p-1.5 rounded-lg"
                      style={{ backgroundColor: b.color + '18' }}
                    >
                      <Icon className="w-4 h-4" style={{ color: b.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{b.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{b.status}</p>
                    </div>
                  </div>
                  <ImpactBadge years={b.yearsImpact} />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold text-gray-900 dark:text-gray-100">{b.value}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{b.unit}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{b.populationComparison}</p>
                  <p className="text-xs text-gray-300 dark:text-gray-600 italic">{b.citation}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Limitations card ── */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
          <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300">Understanding This Estimate</h3>
        </div>
        <ul className="space-y-1.5 text-xs text-blue-700 dark:text-blue-300/80 list-disc list-inside">
          <li>
            Figures are derived from <span className="font-medium">population-level associations</span>, not
            individual predictions. Your actual lifespan depends on genetics, environment, and unmeasured
            factors.
          </li>
          <li>
            Year estimates assume <span className="font-medium">independent contributions</span>; in reality,
            biomarkers are correlated and effects partially overlap.
          </li>
          <li>
            Studies use different populations, time horizons, and control variables — direct comparisons are
            approximate.
          </li>
          <li>
            Improving a single biomarker (e.g., sleep) may also improve others (e.g., HRV, resting HR),
            creating compounding benefits not captured here.
          </li>
        </ul>
      </div>

      {/* ── Science card ── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Science References</h3>
        </div>
        <ol className="space-y-2 text-xs text-gray-500 dark:text-gray-400 list-decimal list-inside">
          <li>
            <span className="font-medium text-gray-700 dark:text-gray-300">Myers J et al.</span>{' '}
            Exercise capacity and mortality among men referred for exercise testing.{' '}
            <span className="italic">New England Journal of Medicine</span>, 2002; 346:793–801.
          </li>
          <li>
            <span className="font-medium text-gray-700 dark:text-gray-300">Paluch AE et al.</span>{' '}
            Daily steps and all-cause mortality: a meta-analysis of 15 international cohorts.{' '}
            <span className="italic">JAMA Network Open</span>, 2021; 4(9):e2124516.
          </li>
          <li>
            <span className="font-medium text-gray-700 dark:text-gray-300">Jouven X et al.</span>{' '}
            Heart-rate profile during exercise as a predictor of sudden death.{' '}
            <span className="italic">New England Journal of Medicine</span>, 2005; 352:1951–1958.
          </li>
          <li>
            <span className="font-medium text-gray-700 dark:text-gray-300">Dekker JM et al.</span>{' '}
            Heart rate variability from short electrocardiographic recordings predicts mortality from all causes.{' '}
            <span className="italic">Circulation</span>, 1997; 95(5):1076–1081.{' '}
            <span className="text-gray-400 dark:text-gray-600">See also: Kleiger RE et al., Am J Cardiol 1987.</span>
          </li>
          <li>
            <span className="font-medium text-gray-700 dark:text-gray-300">Gallicchio L & Kalesan B.</span>{' '}
            Sleep duration and mortality: a systematic review and meta-analysis.{' '}
            <span className="italic">Journal of Sleep Research</span>, 2009; 18(2):148–158.
          </li>
        </ol>
      </div>
    </div>
  )
}
