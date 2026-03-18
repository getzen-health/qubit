'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  ReferenceLine,
} from 'recharts'

interface DayMacros {
  date: string
  energy?: number
  protein?: number
  carbs?: number
  fat?: number
  fiber?: number
  water?: number
}

interface MacrosClientProps {
  days: DayMacros[]
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function avg(arr: (number | undefined)[]): number | null {
  const valid = arr.filter((v): v is number => v !== undefined && v > 0)
  if (!valid.length) return null
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length)
}

export function MacrosClient({ days }: MacrosClientProps) {
  if (days.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">🥗</span>
        <h2 className="text-lg font-semibold text-text-primary">No nutrition data from Apple Health</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Apps like MyFitnessPal, Cronometer, or Lose It! write macro data to Apple Health after logging meals. Sync your iPhone after using one of these apps.
        </p>
      </div>
    )
  }

  const avgEnergy = avg(days.map((d) => d.energy))
  const avgProtein = avg(days.map((d) => d.protein))
  const avgCarbs = avg(days.map((d) => d.carbs))
  const avgFat = avg(days.map((d) => d.fat))
  const avgFiber = avg(days.map((d) => d.fiber))

  // Macro calorie split (for days with all three macros)
  const daysWithAll = days.filter((d) => d.protein && d.carbs && d.fat)
  const proteinCal = avgProtein ? avgProtein * 4 : 0
  const carbCal = avgCarbs ? avgCarbs * 4 : 0
  const fatCal = avgFat ? avgFat * 9 : 0
  const totalMacroCal = proteinCal + carbCal + fatCal

  // Chart data
  const chartData = days.map((d) => ({
    date: fmtDate(d.date),
    energy: d.energy,
    protein: d.protein,
    carbs: d.carbs,
    fat: d.fat,
    fiber: d.fiber,
  }))

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {avgEnergy !== null && (
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-orange-400">{avgEnergy.toLocaleString()}</p>
            <p className="text-xs text-text-secondary mt-0.5">Avg kcal/day</p>
          </div>
        )}
        {avgProtein !== null && (
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{avgProtein}g</p>
            <p className="text-xs text-text-secondary mt-0.5">Avg protein</p>
          </div>
        )}
        {avgCarbs !== null && (
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{avgCarbs}g</p>
            <p className="text-xs text-text-secondary mt-0.5">Avg carbs</p>
          </div>
        )}
        {avgFat !== null && (
          <div className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{avgFat}g</p>
            <p className="text-xs text-text-secondary mt-0.5">Avg fat</p>
          </div>
        )}
      </div>

      {/* Macro split visual */}
      {totalMacroCal > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Average Macro Split</h3>
          <div className="flex h-6 rounded-full overflow-hidden gap-0.5 mb-3">
            <div className="h-full bg-blue-500" style={{ width: `${(proteinCal / totalMacroCal) * 100}%` }} title={`Protein ${Math.round((proteinCal / totalMacroCal) * 100)}%`} />
            <div className="h-full bg-yellow-500" style={{ width: `${(carbCal / totalMacroCal) * 100}%` }} title={`Carbs ${Math.round((carbCal / totalMacroCal) * 100)}%`} />
            <div className="h-full bg-red-400" style={{ width: `${(fatCal / totalMacroCal) * 100}%` }} title={`Fat ${Math.round((fatCal / totalMacroCal) * 100)}%`} />
          </div>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
              <span className="text-text-secondary">Protein</span>
              <span className="font-semibold text-blue-400">{Math.round((proteinCal / totalMacroCal) * 100)}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-yellow-500" />
              <span className="text-text-secondary">Carbs</span>
              <span className="font-semibold text-yellow-400">{Math.round((carbCal / totalMacroCal) * 100)}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-red-400" />
              <span className="text-text-secondary">Fat</span>
              <span className="font-semibold text-red-400">{Math.round((fatCal / totalMacroCal) * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Calories trend */}
      {days.some((d) => d.energy) && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Daily Calories (kcal)</h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} width={36} tickFormatter={(v) => `${v}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} kcal`, 'Calories']} />
              {avgEnergy && <ReferenceLine y={avgEnergy} stroke="rgba(251,146,60,0.4)" strokeDasharray="4 3" />}
              <Bar dataKey="energy" fill="#f97316" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Protein trend */}
      {days.some((d) => d.protein) && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Daily Protein (g)</h3>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} width={32} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}g`, 'Protein']} />
              <ReferenceLine y={150} stroke="rgba(96,165,250,0.3)" strokeDasharray="4 3"
                label={{ value: '150g', position: 'insideTopRight', fontSize: 9, fill: 'rgba(96,165,250,0.4)' }} />
              <Line type="monotone" dataKey="protein" stroke="#60a5fa" strokeWidth={2} dot={{ r: 2 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Carbs + Fat stacked */}
      {days.some((d) => d.carbs || d.fat) && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Carbs & Fat (g/day)</h3>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} width={32} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="carbs" name="Carbs (g)" fill="#eab308" radius={[2, 2, 0, 0]} />
              <Bar dataKey="fat" name="Fat (g)" fill="#ef4444" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-text-secondary">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-yellow-500" /> Carbs</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-red-400" /> Fat</div>
          </div>
        </div>
      )}

      {/* Fiber */}
      {avgFiber !== null && days.some((d) => d.fiber) && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Daily Fiber (g)</h3>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} width={24} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}g`, 'Fiber']} />
              <ReferenceLine y={25} stroke="rgba(74,222,128,0.3)" strokeDasharray="4 3"
                label={{ value: '25g goal', position: 'insideTopRight', fontSize: 9, fill: 'rgba(74,222,128,0.4)' }} />
              <Line type="monotone" dataKey="fiber" stroke="#4ade80" strokeWidth={2} dot={{ r: 2 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Macro guide */}
      <div className="bg-surface rounded-xl border border-border p-4 text-xs text-text-secondary space-y-3">
        <p className="font-medium text-text-primary text-sm">Macro targets (general guidelines)</p>
        <div className="space-y-2">
          {[
            { macro: 'Protein', target: '1.6–2.2g per kg body weight', color: 'text-blue-400', detail: 'Critical for muscle repair and satiety. Higher end for athletes and strength trainers.' },
            { macro: 'Carbohydrates', target: '45–65% of calories', color: 'text-yellow-400', detail: 'Primary fuel for the brain and high-intensity exercise. Whole grains and vegetables preferred.' },
            { macro: 'Fat', target: '20–35% of calories', color: 'text-red-400', detail: 'Essential for hormone production and fat-soluble vitamins. Favor unsaturated fats.' },
            { macro: 'Fiber', target: '25–38g/day', color: 'text-green-400', detail: 'Supports gut health, satiety, and blood sugar regulation. Most people get half the recommended amount.' },
          ].map(({ macro, target, color, detail }) => (
            <div key={macro}>
              <p className="font-medium text-text-primary">
                <span className={color}>{macro}</span> — <span className="font-mono">{target}</span>
              </p>
              <p className="opacity-70 mt-0.5">{detail}</p>
            </div>
          ))}
        </div>
        <p className="opacity-50 pt-1 border-t border-border">
          Data sourced from apps that write to Apple Health (e.g., MyFitnessPal, Cronometer, Lose It!, Noom). Manual entries in this app are not included here.
        </p>
      </div>
    </div>
  )
}
