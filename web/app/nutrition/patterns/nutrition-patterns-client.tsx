'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  LineChart,
  Line,
  ReferenceLine,
  Legend,
} from 'recharts'

interface DowStat {
  label: string
  count: number
  avgCals: number
  avgProtein: number
  avgCarbs: number
  avgFat: number
  hitRate: number
}

interface MonthStat {
  label: string
  count: number
  avgCals: number
  avgProtein: number
  avgCarbs: number
  avgFat: number
}

interface CalBucket {
  label: string
  min: number
  max: number
  count: number
  pct: number
}

export interface NutritionPatternData {
  totalDays: number
  calTarget: number
  protTarget: number
  carbTarget: number
  fatTarget: number
  overallCals: number
  overallProtein: number
  overallCarbs: number
  overallFat: number
  overallFiber: number
  dowData: DowStat[]
  monthData: MonthStat[]
  calBuckets: CalBucket[]
  weekdayAvgCals: number | null
  weekendAvgCals: number | null
}

const MACRO_COLORS = {
  protein: '#3b82f6',
  carbs: '#f59e0b',
  fat: '#ef4444',
  fiber: '#22c55e',
  cals: '#8b5cf6',
}

function calColor(cals: number, target: number): string {
  const ratio = cals / target
  if (ratio >= 0.85 && ratio <= 1.15) return '#22c55e'
  if (ratio >= 0.7 && ratio <= 1.3) return '#f59e0b'
  return '#ef4444'
}

export function NutritionPatternsClient({ data }: { data: NutritionPatternData }) {
  const {
    totalDays,
    calTarget,
    protTarget,
    carbTarget,
    fatTarget,
    overallCals,
    overallProtein,
    overallCarbs,
    overallFat,
    overallFiber,
    dowData,
    monthData,
    calBuckets,
    weekdayAvgCals,
    weekendAvgCals,
  } = data

  const highestCalsDay = [...dowData].sort((a, b) => b.avgCals - a.avgCals)[0]
  const lowestCalsDay = dowData.filter((d) => d.count > 0).sort((a, b) => a.avgCals - b.avgCals)[0]
  const maxMonthCals = Math.max(...monthData.map((m) => m.avgCals), calTarget)

  // Macro split %
  const totalMacroKcal = overallProtein * 4 + overallCarbs * 4 + overallFat * 9
  const protPct = totalMacroKcal > 0 ? Math.round(overallProtein * 4 / totalMacroKcal * 100) : 0
  const carbPct = totalMacroKcal > 0 ? Math.round(overallCarbs * 4 / totalMacroKcal * 100) : 0
  const fatPct = totalMacroKcal > 0 ? Math.round(overallFat * 9 / totalMacroKcal * 100) : 0

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Avg Calories', value: `${overallCals}`, unit: 'kcal', color: calColor(overallCals, calTarget), sub: `Target: ${calTarget}` },
          { label: 'Avg Protein', value: `${overallProtein}`, unit: 'g', color: MACRO_COLORS.protein, sub: `Target: ${protTarget}g` },
          { label: 'Avg Carbs', value: `${overallCarbs}`, unit: 'g', color: MACRO_COLORS.carbs, sub: `Target: ${carbTarget}g` },
          { label: 'Avg Fat', value: `${overallFat}`, unit: 'g', color: MACRO_COLORS.fat, sub: `Target: ${fatTarget}g` },
        ].map((s) => (
          <div key={s.label} className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-secondary mb-1">{s.label}</p>
            <p className="text-2xl font-bold leading-tight" style={{ color: s.color }}>
              {s.value}<span className="text-sm font-normal text-text-secondary ml-1">{s.unit}</span>
            </p>
            <p className="text-xs text-text-secondary mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Macro split */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Macro Split</h2>
        <div className="space-y-3">
          {[
            { label: 'Protein', pct: protPct, grams: overallProtein, target: protTarget, color: MACRO_COLORS.protein, kcal: overallProtein * 4 },
            { label: 'Carbohydrates', pct: carbPct, grams: overallCarbs, target: carbTarget, color: MACRO_COLORS.carbs, kcal: overallCarbs * 4 },
            { label: 'Fat', pct: fatPct, grams: overallFat, target: fatTarget, color: MACRO_COLORS.fat, kcal: overallFat * 9 },
          ].map((m) => (
            <div key={m.label}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />
                  <span className="text-sm text-text-primary">{m.label}</span>
                </div>
                <div className="text-xs text-text-secondary flex gap-3">
                  <span>{m.grams}g</span>
                  <span>{m.pct}% of cals</span>
                  <span className={m.grams >= m.target * 0.85 ? 'text-green-400' : 'text-amber-400'}>
                    {Math.round(m.grams / m.target * 100)}% of target
                  </span>
                </div>
              </div>
              <div className="w-full bg-surface-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${m.pct}%`, background: m.color, opacity: 0.8 }}
                />
              </div>
            </div>
          ))}
        </div>
        {overallFiber > 0 && (
          <p className="text-xs text-text-secondary mt-3 pt-3 border-t border-border">
            Avg fiber: {overallFiber}g/day · Recommended: 25–35g
          </p>
        )}
      </div>

      {/* DOW calorie chart */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-1">Calories by Day of Week</h2>
        <p className="text-xs text-text-secondary mb-4">Average daily calorie intake per weekday</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dowData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} domain={[0, maxMonthCals * 1.1]} />
            <Tooltip
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <div className="bg-surface border border-border rounded-lg px-3 py-2 text-sm shadow">
                    <p className="font-medium text-text-primary">{label}</p>
                    <p className="text-text-secondary">{payload[0].value} kcal</p>
                    <p className="text-xs" style={{ color: calColor(payload[0].value as number, calTarget) }}>
                      {Math.round((payload[0].value as number) / calTarget * 100)}% of target
                    </p>
                  </div>
                ) : null
              }
            />
            <ReferenceLine y={calTarget} stroke="#22c55e" strokeDasharray="4 4" label={{ value: 'Target', position: 'right', fontSize: 10, fill: '#22c55e' }} />
            <Bar dataKey="avgCals" radius={[4, 4, 0, 0]}>
              {dowData.map((d) => (
                <Cell key={d.label} fill={calColor(d.avgCals, calTarget)} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {highestCalsDay && lowestCalsDay && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/20">
              <p className="text-xs text-text-secondary">Most calories</p>
              <p className="font-semibold text-orange-400">{highestCalsDay.label}</p>
              <p className="text-xs text-text-secondary">{highestCalsDay.avgCals} kcal avg</p>
            </div>
            <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
              <p className="text-xs text-text-secondary">Fewest calories</p>
              <p className="font-semibold text-blue-400">{lowestCalsDay.label}</p>
              <p className="text-xs text-text-secondary">{lowestCalsDay.avgCals} kcal avg</p>
            </div>
          </div>
        )}
      </div>

      {/* DOW macro breakdown */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-1">Protein by Day of Week</h2>
        <p className="text-xs text-text-secondary mb-4">Which days you eat the most protein</p>
        <div className="space-y-2">
          {dowData.filter((d) => d.count > 0).map((d) => {
            const maxProt = Math.max(...dowData.map((dd) => dd.avgProtein), 1)
            return (
              <div key={d.label} className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-8 shrink-0">{d.label}</span>
                <div className="flex-1 bg-surface-secondary rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(d.avgProtein / maxProt) * 100}%`,
                      background: d.avgProtein >= protTarget * 0.85 ? '#22c55e' : '#3b82f6',
                      opacity: 0.8,
                    }}
                  />
                </div>
                <span className="text-xs text-text-primary w-12 text-right">{d.avgProtein}g</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Weekday vs weekend */}
      {weekdayAvgCals !== null && weekendAvgCals !== null && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-3">Weekday vs Weekend</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Weekdays', value: weekdayAvgCals, emoji: '💼' },
              { label: 'Weekends', value: weekendAvgCals, emoji: '🎉' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className="text-2xl mb-1">{item.emoji}</p>
                <p className="text-lg font-bold text-text-primary">{item.value}</p>
                <p className="text-xs text-text-secondary">{item.label} · kcal avg</p>
                <p className="text-xs mt-1" style={{ color: calColor(item.value, calTarget) }}>
                  {Math.round(item.value / calTarget * 100)}% of target
                </p>
              </div>
            ))}
          </div>
          {Math.abs(weekendAvgCals - weekdayAvgCals) > 50 && (
            <p className="text-xs text-text-secondary text-center mt-3 pt-3 border-t border-border">
              You eat {Math.abs(weekendAvgCals - weekdayAvgCals)} kcal {weekendAvgCals > weekdayAvgCals ? 'more on weekends' : 'more on weekdays'}
            </p>
          )}
        </div>
      )}

      {/* Monthly trend */}
      {monthData.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Monthly Trend</h2>
          <p className="text-xs text-text-secondary mb-4">Average daily calories and macros by month</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} />
              <Tooltip
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 11 }}
              />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={calTarget} stroke="#22c55e" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="avgCals" name="Calories" stroke={MACRO_COLORS.cals} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="avgProtein" name="Protein (g)" stroke={MACRO_COLORS.protein} strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="avgCarbs" name="Carbs (g)" stroke={MACRO_COLORS.carbs} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Calorie distribution */}
      {calBuckets.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Calorie Distribution</h2>
          <p className="text-xs text-text-secondary mb-4">How your daily calorie intake is spread</p>
          <div className="space-y-2">
            {calBuckets.map((b) => {
              const isTarget = b.min <= calTarget && b.max > calTarget
              return (
                <div key={b.label} className="flex items-center gap-3">
                  <span className={`text-xs w-16 shrink-0 ${isTarget ? 'text-green-400 font-medium' : 'text-text-secondary'}`}>
                    {b.label}
                  </span>
                  <div className="flex-1 bg-surface-secondary rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${b.pct}%`,
                        background: isTarget ? '#22c55e' : b.min < calTarget * 0.5 ? '#6b7280' : b.min < calTarget ? '#f59e0b' : '#ef4444',
                        opacity: 0.8,
                      }}
                    />
                  </div>
                  <span className="text-xs text-text-secondary w-8 text-right">{b.pct}%</span>
                  <span className="text-xs text-text-secondary w-6 text-right">{b.count}d</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
        <p className="text-sm font-semibold text-green-400 mb-2">Nutrition Insights</p>
        <ul className="space-y-1.5 text-xs text-text-secondary">
          <li>• Protein at {Math.round(overallProtein / (70 * 0.75) * 100)}% of 0.75g/kg/day minimum (based on 70kg) — aim for 1.6–2.2g/kg for active people</li>
          {overallFiber > 0 && (
            <li>• Fiber intake of {overallFiber}g/day is {overallFiber >= 25 ? 'within' : 'below'} the 25–35g recommended range</li>
          )}
          {weekdayAvgCals !== null && weekendAvgCals !== null && Math.abs(weekendAvgCals - weekdayAvgCals) > 200 && (
            <li>• Large weekend/weekday difference ({Math.abs(weekendAvgCals - weekdayAvgCals)} kcal) — weekend eating habits affect weekly average</li>
          )}
          <li>• Calorie consistency helps metabolism and body composition more than occasional restriction</li>
        </ul>
      </div>
    </div>
  )
}
