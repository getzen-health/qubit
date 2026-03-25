'use client'

import dynamic from 'next/dynamic'
import {
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import { Scale } from 'lucide-react'

const LineChart = dynamic(() => import('recharts').then((m) => ({ default: m.LineChart })), { ssr: false })
const AreaChart = dynamic(() => import('recharts').then((m) => ({ default: m.AreaChart })), { ssr: false })

interface DaySummary {
  date: string
  weight_kg: number
  body_fat_percent?: number | null
}

function computeLeanMass(weightKg: number, bodyFatPercent: number) {
  const fatMass = weightKg * (bodyFatPercent / 100)
  const leanMass = weightKg - fatMass
  return { fatMass: +fatMass.toFixed(1), leanMass: +leanMass.toFixed(1) }
}

interface BodyClientProps {
  summaries: DaySummary[]
  heightCm?: number | null
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function BodyClient({ summaries, heightCm }: BodyClientProps) {
  if (summaries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Scale className="w-10 h-10 text-text-secondary mb-4" />
        <h2 className="text-lg font-semibold text-text-primary mb-2">No weight data yet</h2>
        <p className="text-sm text-text-secondary">
          Sync your iPhone to import body weight from Apple Health.
        </p>
      </div>
    )
  }

  const weights = summaries.map((s) => s.weight_kg)
  const latest = weights[weights.length - 1]
  const earliest = weights[0]
  const minWeight = Math.min(...weights)
  const maxWeight = Math.max(...weights)
  const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length
  const change = latest - earliest
  const changeSign = change >= 0 ? '+' : ''

  // 30-day delta helpers
  const thirtyDaysAgo = summaries.length > 30 ? summaries[summaries.length - 31] : summaries[0]
  const weight30Delta = +(latest - thirtyDaysAgo.weight_kg).toFixed(1)
  const weight30Sign = weight30Delta >= 0 ? '+' : ''

  // BMI data (requires height)
  const heightM = heightCm ? heightCm / 100 : null
  const bmiData = heightM
    ? summaries.map((s) => ({
        date: fmtDate(s.date),
        bmi: +(s.weight_kg / (heightM * heightM)).toFixed(1),
      }))
    : []
  const latestBmi = bmiData.length > 0 ? bmiData[bmiData.length - 1].bmi : null
  const earliestBmi30 = bmiData.length > 30 ? bmiData[bmiData.length - 31].bmi : bmiData[0]?.bmi ?? null
  const bmi30Delta = latestBmi != null && earliestBmi30 != null ? +(latestBmi - earliestBmi30).toFixed(1) : null

  const chartData = summaries.map((s, i) => {
    const slice = summaries.slice(Math.max(0, i - 29), i + 1)
    const avg = slice.reduce((a, b) => a + b.weight_kg, 0) / slice.length
    return {
      date: fmtDate(s.date),
      weight: +s.weight_kg.toFixed(1),
      avg: +avg.toFixed(1),
    }
  })

  const tooltipStyle = {
    background: 'var(--color-surface, #1a1a1a)',
    border: '1px solid var(--color-border, #333)',
    borderRadius: 8,
    fontSize: 12,
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Current', value: `${latest.toFixed(1)} kg`, color: 'text-text-primary' },
          { label: '30-day change', value: `${weight30Sign}${weight30Delta} kg`, color: weight30Delta <= 0 ? 'text-green-400' : 'text-red-400' },
          { label: 'Average', value: `${avgWeight.toFixed(1)} kg`, color: 'text-blue-400' },
          { label: 'Range', value: `${minWeight.toFixed(1)}–${maxWeight.toFixed(1)}`, color: 'text-text-secondary' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Weight chart */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-medium text-text-secondary mb-3">Weight (kg)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number, name: string) => [
                `${value} kg`,
                name === 'weight' ? 'Weight' : '30d avg',
              ]}
            />
            <ReferenceLine
              y={avgWeight}
              stroke="rgba(255,255,255,0.15)"
              strokeDasharray="4 3"
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#60a5fa"
              strokeWidth={1.5}
              dot={{ r: 2, fill: '#60a5fa' }}
              activeDot={{ r: 4 }}
            />
            {summaries.length > 14 && (
              <Line
                type="monotone"
                dataKey="avg"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
        {summaries.length > 14 && (
          <div className="flex gap-4 mt-2 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-400 inline-block" /> Daily
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-orange-400 inline-block" /> 30d avg
            </span>
          </div>
        )}
      </div>

      {/* BMI chart (if height available) */}
      {bmiData.length > 0 && (() => {
        const bmiChartData = bmiData.map((d, i) => {
          const slice = bmiData.slice(Math.max(0, i - 29), i + 1)
          const avg = slice.reduce((a, b) => a + b.bmi, 0) / slice.length
          return { ...d, avg: +avg.toFixed(1) }
        })
        const latestBmi = bmiChartData[bmiChartData.length - 1].bmi
        const avgBmi = bmiChartData.reduce((a, b) => a + b.bmi, 0) / bmiChartData.length
        return (
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-medium text-text-secondary">BMI</h2>
              <div className="flex items-center gap-2">
                {bmi30Delta != null && (
                  <span className={`text-xs font-medium ${bmi30Delta <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {bmi30Delta >= 0 ? '+' : ''}{bmi30Delta} (30d)
                  </span>
                )}
                {latestBmi && <span className="text-sm font-semibold text-text-primary">{latestBmi}</span>}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={bmiChartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}`, 'BMI']} />
                <ReferenceLine y={avgBmi} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 3" />
                <Line type="monotone" dataKey="bmi" stroke="#6366f1" strokeWidth={1.5} dot={{ r: 2, fill: '#6366f1' }} activeDot={{ r: 4 }} />
                {bmiChartData.length > 14 && (
                  <Line type="monotone" dataKey="avg" stroke="#f97316" strokeWidth={2} dot={false} />
                )}
              </LineChart>
            </ResponsiveContainer>
            {bmiChartData.length > 14 && (
              <div className="flex gap-4 mt-2 text-xs text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-indigo-400 inline-block" /> Daily
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-orange-400 inline-block" /> 30d avg
                </span>
              </div>
            )}
          </div>
        )
      })()}

      {/* Body fat chart (if data available) */}
      {summaries.some((s) => (s.body_fat_percent ?? 0) > 0) && (() => {
        const bfData = summaries
          .filter((s) => (s.body_fat_percent ?? 0) > 0)
          .map((s) => ({ date: fmtDate(s.date), bf: +((s.body_fat_percent ?? 0).toFixed(1)) }))
        const latestBf = bfData[bfData.length - 1]?.bf
        const bf30Delta = bfData.length > 30
          ? +(latestBf - bfData[bfData.length - 31].bf).toFixed(1)
          : bfData.length > 1 ? +(latestBf - bfData[0].bf).toFixed(1) : null
        const bf30Sign = bf30Delta != null && bf30Delta >= 0 ? '+' : ''
        return (
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-medium text-text-secondary">Body Fat %</h2>
              <div className="flex items-center gap-2">
                {bf30Delta != null && (
                  <span className={`text-xs font-medium ${bf30Delta <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {bf30Sign}{bf30Delta}% (30d)
                  </span>
                )}
                {latestBf && <span className="text-sm font-semibold text-text-primary">{latestBf}%</span>}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={bfData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="bfGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, 'Body Fat']} />
                <Area type="monotone" dataKey="bf" stroke="#a78bfa" strokeWidth={1.5} fill="url(#bfGradient)" dot={{ r: 2, fill: '#a78bfa' }} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )
      })()}

      {/* Lean Mass Composition (if body fat data available) */}
      {summaries.some((s) => (s.body_fat_percent ?? 0) > 0) && (() => {
        const compositionData = summaries
          .filter((s) => (s.body_fat_percent ?? 0) > 0)
          .map((s) => {
            const { fatMass, leanMass } = computeLeanMass(s.weight_kg, s.body_fat_percent!)
            return { date: fmtDate(s.date), lean: leanMass, fat: fatMass }
          })
        const latest = compositionData[compositionData.length - 1]
        const earliest = compositionData[0]
        const leanChange = latest && earliest ? +(latest.lean - earliest.lean).toFixed(1) : null
        const leanChangeSign = leanChange !== null && leanChange >= 0 ? '+' : ''
        return (
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-medium text-text-secondary">Body Composition</h2>
              {leanChange !== null && (
                <span className={`text-xs font-medium ${leanChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  Lean mass {leanChangeSign}{leanChange} kg
                </span>
              )}
            </div>
            {latest && (
              <div className="flex gap-4 mb-3">
                <div>
                  <p className="text-lg font-bold text-green-400">{latest.lean} kg</p>
                  <p className="text-xs text-text-secondary">Lean Mass</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-purple-400">{latest.fat} kg</p>
                  <p className="text-xs text-text-secondary">Fat Mass</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-text-secondary">Formula: Katch-McArdle</p>
                  <p className="text-xs text-text-secondary">lean = weight × (1 − bf%)</p>
                </div>
              </div>
            )}
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={compositionData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number, name: string) => [`${v} kg`, name === 'lean' ? 'Lean Mass' : 'Fat Mass']} />
                <Line type="monotone" dataKey="lean" stroke="#4ade80" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="fat" stroke="#a78bfa" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 text-xs text-text-secondary">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-green-400 inline-block" /> Lean</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-purple-400 inline-block" /> Fat</span>
            </div>
          </div>
        )
      })()}

      {/* Measurement list */}
      <div className="space-y-2">
        {[...summaries].reverse().map((s) => (
          <div
            key={s.date}
            className="bg-surface rounded-xl border border-border px-4 py-3 flex items-center justify-between"
          >
            <p className="text-sm font-medium text-text-primary">
              {new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <div className="text-right">
              <p className="text-blue-400 font-semibold">{s.weight_kg.toFixed(1)} kg</p>
              {(s.body_fat_percent ?? 0) > 0 && (() => {
                const { leanMass, fatMass } = computeLeanMass(s.weight_kg, s.body_fat_percent!)
                return (
                  <>
                    <p className="text-xs text-green-400">{leanMass} kg lean</p>
                    <p className="text-xs text-purple-400">{fatMass} kg fat ({s.body_fat_percent!.toFixed(1)}%)</p>
                  </>
                )
              })()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
