'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import { Zap } from 'lucide-react'

interface DaySummary {
  date: string
  recovery_score?: number | null
  strain_score?: number | null
  avg_hrv?: number | null
  resting_heart_rate?: number | null
}

interface RecoveryClientProps {
  summaries: DaySummary[]
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function recoveryColor(score: number): string {
  if (score >= 67) return '#22c55e'
  if (score >= 34) return '#f59e0b'
  return '#ef4444'
}

function recoveryLabel(score: number): string {
  if (score >= 67) return 'Green'
  if (score >= 34) return 'Yellow'
  return 'Red'
}

export function RecoveryClient({ summaries }: RecoveryClientProps) {
  const withRecovery = summaries.filter((s) => s.recovery_score != null && s.recovery_score > 0)
  const withStrain = summaries.filter((s) => s.strain_score != null && s.strain_score > 0)

  if (withRecovery.length === 0 && withStrain.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Zap className="w-10 h-10 text-text-secondary mb-4" />
        <h2 className="text-lg font-semibold text-text-primary mb-2">No recovery data yet</h2>
        <p className="text-sm text-text-secondary">
          Sync your iPhone to import recovery and strain scores from Apple Health.
        </p>
      </div>
    )
  }

  const avgRecovery =
    withRecovery.length > 0
      ? Math.round(withRecovery.reduce((a, b) => a + b.recovery_score!, 0) / withRecovery.length)
      : null

  const avgStrain =
    withStrain.length > 0
      ? +(withStrain.reduce((a, b) => a + b.strain_score!, 0) / withStrain.length).toFixed(1)
      : null

  const latestRecovery = withRecovery[withRecovery.length - 1]?.recovery_score ?? null
  const latestStrain = withStrain[withStrain.length - 1]?.strain_score ?? null

  const router = useRouter()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleChartClick(data: any) {
    const date = data?.activePayload?.[0]?.payload?.rawDate
    if (date) router.push(`/day/${date}`)
  }

  const chartData = summaries.map((s) => ({
    date: fmtDate(s.date),
    rawDate: s.date,
    recovery: s.recovery_score ?? null,
    strain: s.strain_score ?? null,
  }))

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
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold" style={{ color: latestRecovery != null ? recoveryColor(latestRecovery) : undefined }}>
            {latestRecovery != null ? `${latestRecovery}%` : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Today Recovery</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold" style={{ color: avgRecovery != null ? recoveryColor(avgRecovery) : undefined }}>
            {avgRecovery != null ? `${avgRecovery}%` : '—'}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Recovery</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-orange-400">{latestStrain != null ? latestStrain.toString() : '—'}</p>
          <p className="text-xs text-text-secondary mt-0.5">Today Strain</p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-4 text-center">
          <p className="text-xl font-bold text-text-secondary">{avgStrain != null ? avgStrain.toString() : '—'}</p>
          <p className="text-xs text-text-secondary mt-0.5">Avg Strain</p>
        </div>
      </div>

      {/* Recovery chart */}
      {withRecovery.length > 1 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-3">Recovery Score (%)</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData.filter((d) => d.recovery != null)} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis hide domain={[0, 100]} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [`${value}%`, 'Recovery']}
              />
              <ReferenceLine y={67} stroke="rgba(34,197,94,0.3)" strokeDasharray="4 3" />
              <ReferenceLine y={34} stroke="rgba(245,158,11,0.3)" strokeDasharray="4 3" />
              <Bar dataKey="recovery" radius={[3, 3, 0, 0]}>
                {chartData
                  .filter((d) => d.recovery != null)
                  .map((entry, i) => (
                    <Cell key={i} fill={recoveryColor(entry.recovery!)} />
                  ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Green (≥ 67%)</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> Yellow (34–66%)</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Red ({'<'} 34%)</span>
          </div>
        </div>
      )}

      {/* Strain chart */}
      {withStrain.length > 1 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-3">Strain Score</h2>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData.filter((d) => d.strain != null)} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis hide domain={[0, 21]} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [value.toFixed(1), 'Strain']}
              />
              <Line
                type="monotone"
                dataKey="strain"
                stroke="#f97316"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Day list */}
      <div className="space-y-2">
        {[...summaries]
          .reverse()
          .filter((s) => s.recovery_score || s.strain_score)
          .map((s) => {
            const rec = s.recovery_score
            return (
              <Link
                key={s.date}
                href={`/day/${s.date}`}
                className="bg-surface rounded-xl border border-border px-4 py-3 flex items-center justify-between hover:bg-surface-secondary transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  {s.avg_hrv && s.avg_hrv > 0 && (
                    <p className="text-xs text-text-secondary">{Math.round(s.avg_hrv)} ms HRV</p>
                  )}
                </div>
                <div className="flex gap-3 items-center text-sm">
                  {rec != null && rec > 0 && (
                    <span className="font-semibold" style={{ color: recoveryColor(rec) }}>
                      {rec}% {recoveryLabel(rec)}
                    </span>
                  )}
                  {s.strain_score != null && s.strain_score > 0 && (
                    <span className="text-orange-400 font-medium">{s.strain_score.toFixed(1)} strain</span>
                  )}
                </div>
              </Link>
            )
          })}
      </div>
    </div>
  )
}
