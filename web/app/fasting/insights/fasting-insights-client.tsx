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
  ComposedChart,
} from 'recharts'

interface ProtocolStat {
  name: string
  count: number
  completed: number
  completionRate: number
  avgHours: number
  pct: number
}

interface DowStat {
  label: string
  count: number
}

interface TimePeriod {
  label: string
  count: number
}

interface MonthStat {
  label: string
  total: number
  completed: number
  completionRate: number
}

interface DurBucket {
  label: string
  min: number
  max: number
  count: number
  pct: number
}

export interface FastingInsightData {
  totalFasts: number
  completedFasts: number
  completionRate: number
  avgActualHours: number
  currentStreak: number
  longestStreak: number
  longestFastHours: number | null
  longestFastDate: string | null
  protocols: ProtocolStat[]
  dowData: DowStat[]
  timePeriods: TimePeriod[]
  monthTrend: MonthStat[]
  durBuckets: DurBucket[]
}

function fmtHours(h: number): string {
  const hrs = Math.floor(h)
  const mins = Math.round((h - hrs) * 60)
  if (mins === 0) return `${hrs}h`
  return `${hrs}h ${mins}m`
}

function fmtDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const PROTOCOL_COLORS: Record<string, string> = {
  '16:8': '#3b82f6',
  '18:6': '#8b5cf6',
  '20:4': '#f59e0b',
  'OMAD': '#ef4444',
}

function protocolColor(name: string): string {
  return PROTOCOL_COLORS[name] ?? '#6b7280'
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number; name: string }[]
  label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 text-sm shadow">
      <p className="font-medium text-text-primary mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-text-secondary">
          {p.name}: {typeof p.value === 'number' && p.value % 1 !== 0 ? p.value.toFixed(1) : p.value}
          {p.name === 'Completion' ? '%' : ''}
        </p>
      ))}
    </div>
  )
}

export function FastingInsightsClient({ data }: { data: FastingInsightData }) {
  const {
    totalFasts,
    completedFasts,
    completionRate,
    avgActualHours,
    currentStreak,
    longestStreak,
    longestFastHours,
    longestFastDate,
    protocols,
    dowData,
    timePeriods,
    monthTrend,
    durBuckets,
  } = data

  const bestDow = dowData.reduce((best, d) => (d.count > best.count ? d : best), dowData[0])
  const maxDowCount = Math.max(...dowData.map((d) => d.count), 1)

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Fasts', value: totalFasts.toString(), sub: `${completedFasts} completed`, color: '#3b82f6' },
          { label: 'Completion Rate', value: `${completionRate}%`, sub: `${completedFasts}/${totalFasts} fasts`, color: completionRate >= 80 ? '#22c55e' : completionRate >= 60 ? '#f59e0b' : '#ef4444' },
          { label: 'Avg Duration', value: fmtHours(avgActualHours), sub: 'Completed fasts', color: '#8b5cf6' },
          { label: 'Longest Streak', value: `${longestStreak}d`, sub: `Current: ${currentStreak}d`, color: '#f59e0b' },
        ].map((s) => (
          <div key={s.label} className="bg-surface rounded-xl border border-border p-4">
            <p className="text-xs text-text-secondary mb-1">{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-text-secondary mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Best fast */}
      {longestFastHours !== null && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-4">
          <span className="text-3xl">🏆</span>
          <div>
            <p className="text-sm font-semibold text-amber-400">Personal Best Fast</p>
            <p className="text-2xl font-bold text-text-primary">{fmtHours(longestFastHours)}</p>
            {longestFastDate && (
              <p className="text-xs text-text-secondary">{fmtDate(longestFastDate)}</p>
            )}
          </div>
        </div>
      )}

      {/* Protocol breakdown */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-1">Protocol Breakdown</h2>
        <p className="text-xs text-text-secondary mb-4">Which fasting protocols you use most</p>
        <div className="space-y-3">
          {protocols.map((p) => (
            <div key={p.name}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ background: protocolColor(p.name) }}
                  />
                  <span className="text-sm font-medium text-text-primary">{p.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-secondary">
                  <span>{p.count} fasts</span>
                  <span>{p.pct}%</span>
                  <span className={p.completionRate >= 80 ? 'text-green-400' : p.completionRate >= 60 ? 'text-amber-400' : 'text-red-400'}>
                    {p.completionRate}% done
                  </span>
                  {p.avgHours > 0 && <span>avg {fmtHours(p.avgHours)}</span>}
                </div>
              </div>
              <div className="w-full bg-surface-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${p.pct}%`, background: protocolColor(p.name), opacity: 0.8 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Duration distribution */}
      {durBuckets.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Duration Distribution</h2>
          <p className="text-xs text-text-secondary mb-4">How long your completed fasts actually run</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={durBuckets} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} allowDecimals={false} />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="bg-surface border border-border rounded-lg px-3 py-2 text-sm shadow">
                      <p className="font-medium text-text-primary">{label}</p>
                      <p className="text-text-secondary">{payload[0].value} fasts ({durBuckets.find((b) => b.label === label)?.pct ?? 0}%)</p>
                    </div>
                  ) : null
                }
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {durBuckets.map((b) => (
                  <Cell
                    key={b.label}
                    fill={b.min >= 16 ? '#22c55e' : b.min >= 12 ? '#f59e0b' : '#6b7280'}
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Day of week */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-1">By Day of Week</h2>
        <p className="text-xs text-text-secondary mb-4">
          Which days you complete fasts most often
          {bestDow.count > 0 && ` · ${bestDow.label} is your strongest`}
        </p>
        <div className="space-y-2">
          {dowData.map((d) => (
            <div key={d.label} className="flex items-center gap-3">
              <span className="text-xs text-text-secondary w-8 shrink-0">{d.label}</span>
              <div className="flex-1 bg-surface-secondary rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${maxDowCount > 0 ? (d.count / maxDowCount) * 100 : 0}%`,
                    background: d.count === maxDowCount ? '#22c55e' : '#3b82f6',
                    opacity: 0.8,
                  }}
                />
              </div>
              <span className="text-xs text-text-primary w-6 text-right">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Start time periods */}
      {timePeriods.some((t) => t.count > 0) && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-3">When You Start Fasting</h2>
          <div className="grid grid-cols-2 gap-3">
            {timePeriods.filter((t) => t.count > 0).map((t) => (
              <div key={t.label} className="bg-surface-secondary rounded-lg p-3">
                <p className="text-xs text-text-secondary">{t.label}</p>
                <p className="text-lg font-bold text-text-primary">{t.count}</p>
                <p className="text-xs text-text-secondary">fasts</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly trend */}
      {monthTrend.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary mb-1">Monthly Trend</h2>
          <p className="text-xs text-text-secondary mb-4">Fasting frequency and completion rate by month</p>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={monthTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                allowDecimals={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar yAxisId="left" dataKey="total" name="Fasts" fill="#3b82f6" fillOpacity={0.6} radius={[2, 2, 0, 0]} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="completionRate"
                name="Completion"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 3, fill: '#22c55e' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-blue-500 opacity-60" />
              <span className="text-xs text-text-secondary">Total fasts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-green-400" />
              <span className="text-xs text-text-secondary">Completion %</span>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
        <p className="text-sm font-semibold text-purple-400 mb-2">Fasting Tips</p>
        <ul className="space-y-1.5 text-xs text-text-secondary">
          <li>• Starting your fast in the evening makes the overnight hours count toward your window</li>
          <li>• HRV typically improves 1–2 days after successful longer fasts as inflammation reduces</li>
          <li>• Staying well-hydrated (water, black coffee, plain tea) helps sustain the fast</li>
          <li>• Consistency matters more than duration — frequent 16:8 beats occasional 24h fasts</li>
        </ul>
      </div>
    </div>
  )
}
