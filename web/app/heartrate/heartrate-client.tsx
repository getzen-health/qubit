'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import { Heart } from 'lucide-react'

interface DaySummary {
  date: string
  resting_heart_rate?: number | null
  avg_hrv?: number | null
}

interface HeartRateClientProps {
  summaries: DaySummary[]
}

function fmt(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function HeartRateClient({ summaries }: HeartRateClientProps) {
  const rhrData = summaries.filter((s) => s.resting_heart_rate && s.resting_heart_rate > 0).map((s) => ({
    date: fmt(s.date),
    rhr: s.resting_heart_rate!,
  }))

  const hrvData = summaries.filter((s) => s.avg_hrv && s.avg_hrv > 0).map((s) => ({
    date: fmt(s.date),
    hrv: Math.round(s.avg_hrv!),
  }))

  const avgRhr =
    rhrData.length > 0
      ? Math.round(rhrData.reduce((s, d) => s + d.rhr, 0) / rhrData.length)
      : null

  const avgHrv =
    hrvData.length > 0
      ? Math.round(hrvData.reduce((s, d) => s + d.hrv, 0) / hrvData.length)
      : null

  const minRhr = rhrData.length > 0 ? Math.min(...rhrData.map((d) => d.rhr)) : null
  const maxHrv = hrvData.length > 0 ? Math.max(...hrvData.map((d) => d.hrv)) : null

  if (rhrData.length === 0 && hrvData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Heart className="w-10 h-10 text-text-secondary mb-4" />
        <h2 className="text-lg font-semibold text-text-primary mb-2">No heart rate data yet</h2>
        <p className="text-sm text-text-secondary">
          Sync your iPhone to import heart rate data from Apple Health.
        </p>
      </div>
    )
  }

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
          { label: 'Avg RHR', value: avgRhr ? `${avgRhr} bpm` : '—', color: 'text-red-400' },
          { label: 'Lowest RHR', value: minRhr ? `${minRhr} bpm` : '—', color: 'text-green-400' },
          { label: 'Avg HRV', value: avgHrv ? `${avgHrv} ms` : '—', color: 'text-purple-400' },
          { label: 'Best HRV', value: maxHrv ? `${maxHrv} ms` : '—', color: 'text-blue-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-border p-4 text-center">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* RHR chart */}
      {rhrData.length > 1 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-3">Resting Heart Rate (bpm)</h2>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={rhrData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [`${value} bpm`, 'RHR']}
              />
              <ReferenceLine
                y={avgRhr ?? 60}
                stroke="rgba(255,255,255,0.2)"
                strokeDasharray="4 3"
                label={{ value: 'avg', position: 'insideTopRight', fontSize: 10, fill: 'rgba(255,255,255,0.35)' }}
              />
              <Line
                type="monotone"
                dataKey="rhr"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* HRV chart */}
      {hrvData.length > 1 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-3">Heart Rate Variability (ms)</h2>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={hrvData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [`${value} ms`, 'HRV']}
              />
              <ReferenceLine
                y={avgHrv ?? 40}
                stroke="rgba(255,255,255,0.2)"
                strokeDasharray="4 3"
                label={{ value: 'avg', position: 'insideTopRight', fontSize: 10, fill: 'rgba(255,255,255,0.35)' }}
              />
              <Line
                type="monotone"
                dataKey="hrv"
                stroke="#a855f7"
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
        {[...summaries].reverse().filter((s) => s.resting_heart_rate || s.avg_hrv).map((s) => (
          <div key={s.date} className="bg-surface rounded-xl border border-border px-4 py-3 flex items-center justify-between">
            <p className="text-sm font-medium text-text-primary">
              {new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </p>
            <div className="flex gap-4 text-sm">
              {s.resting_heart_rate && s.resting_heart_rate > 0 && (
                <span className="text-red-400 font-medium">{s.resting_heart_rate} bpm</span>
              )}
              {s.avg_hrv && s.avg_hrv > 0 && (
                <span className="text-purple-400 font-medium">{Math.round(s.avg_hrv)} ms HRV</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
