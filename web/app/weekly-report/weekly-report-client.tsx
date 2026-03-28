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
} from 'recharts'
import { TrendingUp, TrendingDown, Moon, Activity, Heart, Flame, Footprints } from 'lucide-react'

export interface DaySummary {
  date: string
  steps: number | null
  active_calories: number | null
  sleep_duration_minutes: number | null
  avg_hrv: number | null
  resting_heart_rate: number | null
  recovery_score: number | null
}

interface WeeklyMetrics {
  avgSteps: number | null
  avgSleepHours: number | null
  avgHRV: number | null
  avgRHR: number | null
  totalCalories: number
  avgHealthScore: number | null
}

interface PrevWeeklyMetrics {
  avgSteps: number | null
  avgSleepHours: number | null
  avgHRV: number | null
  avgRHR: number | null
  totalCalories: number | null
}

interface Highlights {
  bestStepDay: DaySummary | null
  worstSleepNight: DaySummary | null
  highestHRVDay: DaySummary | null
}

interface WeeklyReportClientProps {
  thisWeekDays: DaySummary[]
  metrics: WeeklyMetrics
  prevMetrics: PrevWeeklyMetrics
  highlights: Highlights
  weekRange: string
}

const TOOLTIP_STYLE = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
}

function pctChange(curr: number | null, prev: number | null): number | null {
  if (curr == null || prev == null || prev === 0) return null
  return Math.round(((curr - prev) / prev) * 100)
}

function DeltaBadge({
  change,
  higherIsBetter = true,
}: {
  change: number | null
  higherIsBetter?: boolean
}) {
  if (change == null) return null
  const improved = higherIsBetter ? change > 0 : change < 0
  const Icon = change > 0 ? TrendingUp : TrendingDown
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full ${
        improved ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
      }`}
    >
      <Icon className="w-3 h-3" />
      {change > 0 ? '+' : ''}
      {change}%
    </span>
  )
}

function HealthScoreRing({ score }: { score: number | null }) {
  if (score == null) return null

  const rounded = Math.round(score)
  const ringColor =
    rounded >= 75 ? '#4ade80' : rounded >= 50 ? '#facc15' : '#f87171'
  const textColor =
    rounded >= 75 ? 'text-green-400' : rounded >= 50 ? 'text-yellow-400' : 'text-red-400'
  const label =
    rounded >= 75 ? 'Great Week' : rounded >= 50 ? 'Decent Week' : 'Tough Week'

  const radius = 54
  const strokeWidth = 8
  const circumference = 2 * Math.PI * radius
  const dashoffset = circumference - (rounded / 100) * circumference

  return (
    <div className="rounded-2xl p-5 bg-surface border border-border flex flex-col items-center gap-2">
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
        Weekly Health Score
      </p>
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 144 144">
          <circle
            cx="72"
            cy="72"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx="72"
            cy="72"
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold leading-none ${textColor}`}>{rounded}</span>
          <span className="text-[11px] text-text-secondary mt-0.5">/ 100</span>
        </div>
      </div>
      <p className={`text-sm font-semibold ${textColor}`}>{label}</p>
      <p className="text-xs text-text-secondary">avg recovery score this week</p>
    </div>
  )
}

function MetricCard({
  icon,
  label,
  value,
  change,
  higherIsBetter = true,
}: {
  icon: React.ReactNode
  label: string
  value: string | null
  change: number | null
  higherIsBetter?: boolean
}) {
  return (
    <div className="rounded-2xl p-4 bg-surface border border-border">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-text-secondary leading-tight">{label}</span>
      </div>
      <p className="text-xl font-bold text-text-primary">{value ?? '—'}</p>
      {change != null && (
        <div className="mt-1.5">
          <DeltaBadge change={change} higherIsBetter={higherIsBetter} />
        </div>
      )}
    </div>
  )
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function WeeklyReportClient({
  thisWeekDays,
  metrics,
  prevMetrics,
  highlights,
}: WeeklyReportClientProps) {
  if (thisWeekDays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <span className="text-5xl">📅</span>
        <h2 className="text-lg font-semibold text-text-primary">No data this week</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync Apple Health data from the iOS app to see your weekly report.
        </p>
      </div>
    )
  }

  const stepData = thisWeekDays.map((d) => ({
    day: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
    steps: d.steps ?? 0,
    date: d.date,
  }))
  const maxSteps = Math.max(...stepData.map((d) => d.steps), 1)

  const stepsChange = pctChange(metrics.avgSteps, prevMetrics.avgSteps)
  const sleepChange = pctChange(metrics.avgSleepHours, prevMetrics.avgSleepHours)
  const hrvChange = pctChange(metrics.avgHRV, prevMetrics.avgHRV)
  const rhrChange = pctChange(metrics.avgRHR, prevMetrics.avgRHR)
  const calChange = pctChange(metrics.totalCalories, prevMetrics.totalCalories)

  const hasHighlights =
    highlights.bestStepDay || highlights.worstSleepNight || highlights.highestHRVDay

  return (
    <div className="space-y-5">
      {/* Health Score */}
      {metrics.avgHealthScore != null && (
        <HealthScoreRing score={metrics.avgHealthScore} />
      )}

      {/* Week at a Glance */}
      <section>
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Week at a Glance
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            icon={<Footprints className="w-4 h-4 text-green-400 shrink-0" />}
            label="Avg Daily Steps"
            value={
              metrics.avgSteps != null ? Math.round(metrics.avgSteps).toLocaleString() : null
            }
            change={stepsChange}
          />
          <MetricCard
            icon={<Moon className="w-4 h-4 text-indigo-400 shrink-0" />}
            label="Avg Sleep"
            value={metrics.avgSleepHours != null ? `${metrics.avgSleepHours.toFixed(1)}h` : null}
            change={sleepChange}
          />
          <MetricCard
            icon={<Activity className="w-4 h-4 text-purple-400 shrink-0" />}
            label="Avg HRV"
            value={metrics.avgHRV != null ? `${Math.round(metrics.avgHRV)} ms` : null}
            change={hrvChange}
          />
          <MetricCard
            icon={<Heart className="w-4 h-4 text-red-400 shrink-0" />}
            label="Avg Resting HR"
            value={metrics.avgRHR != null ? `${Math.round(metrics.avgRHR)} bpm` : null}
            change={rhrChange}
            higherIsBetter={false}
          />
        </div>
        <div className="mt-3">
          <MetricCard
            icon={<Flame className="w-4 h-4 text-orange-400 shrink-0" />}
            label="Total Active Calories"
            value={
              metrics.totalCalories > 0
                ? `${Math.round(metrics.totalCalories).toLocaleString()} kcal`
                : null
            }
            change={calChange}
          />
        </div>
      </section>

      {/* Daily Steps Bar Chart */}
      <section className="rounded-2xl p-4 bg-surface border border-border">
        <h2 className="text-sm font-semibold text-text-primary mb-1">Daily Steps</h2>
        <p className="text-xs text-text-secondary mb-4">
          Brightest bar = best day this week
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={stepData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #888)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`
              }
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: number) => [v.toLocaleString() + ' steps', '']}
            />
            <Bar dataKey="steps" radius={[4, 4, 0, 0]}>
              {stepData.map((d) => (
                <Cell
                  key={d.date}
                  fill={d.steps === maxSteps && d.steps > 0 ? '#4ade80' : 'var(--accent)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Highlights */}
      <section>
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Highlights
        </h2>
        {hasHighlights ? (
          <div className="space-y-3">
            {highlights.bestStepDay && (
              <div className="rounded-2xl p-4 bg-surface border border-border flex items-center gap-4">
                <span className="text-2xl shrink-0">🏆</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary">Best Day</p>
                  <p className="text-xs text-text-secondary">
                    {fmtDate(highlights.bestStepDay.date)} ·{' '}
                    {(highlights.bestStepDay.steps ?? 0).toLocaleString()} steps
                  </p>
                </div>
              </div>
            )}
            {highlights.worstSleepNight && (
              <div className="rounded-2xl p-4 bg-surface border border-border flex items-center gap-4">
                <span className="text-2xl shrink-0">😴</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary">Shortest Sleep Night</p>
                  <p className="text-xs text-text-secondary">
                    {fmtDate(highlights.worstSleepNight.date)} ·{' '}
                    {Math.floor((highlights.worstSleepNight.sleep_duration_minutes ?? 0) / 60)}h{' '}
                    {Math.round((highlights.worstSleepNight.sleep_duration_minutes ?? 0) % 60)}m
                  </p>
                </div>
              </div>
            )}
            {highlights.highestHRVDay && (
              <div className="rounded-2xl p-4 bg-surface border border-border flex items-center gap-4">
                <span className="text-2xl shrink-0">💜</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary">Peak HRV Day</p>
                  <p className="text-xs text-text-secondary">
                    {fmtDate(highlights.highestHRVDay.date)} ·{' '}
                    {Math.round(highlights.highestHRVDay.avg_hrv ?? 0)} ms
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-text-secondary text-center py-6">
            No highlights available yet — sync more health data to see them.
          </p>
        )}
      </section>
    </div>
  )
}
