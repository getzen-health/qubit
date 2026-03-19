'use client'

import { useState } from 'react'

export interface HeatmapDay {
  date: string
  steps: number | null
  stepsNorm: number | null
  sleepMins: number | null
  sleepNorm: number | null
  hrv: number | null
  hrvNorm: number | null
  calories: number | null
  calNorm: number | null
  recovery: number | null
  recoveryNorm: number | null
  distKm: number | null
  distNorm: number | null
}

interface Metric {
  key: keyof HeatmapDay
  normKey: keyof HeatmapDay
  label: string
  color: string
  format: (v: number) => string
}

const METRICS: Metric[] = [
  { key: 'steps',    normKey: 'stepsNorm',    label: 'Steps',    color: '#4ade80', format: v => `${Math.round(v).toLocaleString()} steps` },
  { key: 'sleepMins',normKey: 'sleepNorm',    label: 'Sleep',    color: '#818cf8', format: v => { const h = Math.floor(v/60); const m = v%60; return `${h}h ${m}m` } },
  { key: 'hrv',      normKey: 'hrvNorm',      label: 'HRV',      color: '#c084fc', format: v => `${Math.round(v)} ms` },
  { key: 'calories', normKey: 'calNorm',      label: 'Calories', color: '#fb923c', format: v => `${Math.round(v)} kcal` },
  { key: 'recovery', normKey: 'recoveryNorm', label: 'Recovery', color: '#2dd4bf', format: v => `${Math.round(v)}%` },
  { key: 'distKm',   normKey: 'distNorm',     label: 'Distance', color: '#60a5fa', format: v => `${v.toFixed(1)} km` },
]

function cellBg(color: string, intensity: number | null): string {
  if (intensity === null) return 'rgba(255,255,255,0.04)'
  const alpha = 0.12 + intensity * 0.75
  // Parse hex color and apply alpha as rgba
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function shortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDate()
  // Show day number on 1st and 15th, otherwise abbreviated weekday for first of week
  if (day === 1 || day === 15) return String(day)
  if (d.getDay() === 0) return '' // show nothing for Sundays unless 1/15
  return ''
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

interface SelectedCell {
  dayIdx: number
  metricIdx: number
}

export function HealthHeatmapClient({ days }: { days: HeatmapDay[] }) {
  const [selected, setSelected] = useState<SelectedCell | null>(null)

  if (days.length < 7) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <span className="text-5xl">🗓️</span>
        <h2 className="text-lg font-semibold text-text-primary">Not Enough Data</h2>
        <p className="text-sm text-text-secondary max-w-xs">
          Sync at least 7 days of health data to see your heatmap.
        </p>
      </div>
    )
  }

  const selectedDay    = selected !== null ? days[selected.dayIdx] : null
  const selectedMetric = selected !== null ? METRICS[selected.metricIdx] : null
  const selectedValue  = selectedDay && selectedMetric ? (selectedDay[selectedMetric.key] as number | null) : null

  function handleCell(dayIdx: number, metricIdx: number) {
    if (selected?.dayIdx === dayIdx && selected?.metricIdx === metricIdx) {
      setSelected(null)
    } else {
      setSelected({ dayIdx, metricIdx })
    }
  }

  return (
    <div className="space-y-5">
      {/* Intro */}
      <p className="text-sm text-text-secondary opacity-70">
        Each column is a day; each row is a metric. Darker = better performance relative to your range. Tap a cell to see the exact value.
      </p>

      {/* Selected cell detail */}
      {selected !== null && selectedDay && selectedMetric && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl border border-border"
          style={{ background: cellBg(selectedMetric.color, 0.3) }}
        >
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: selectedMetric.color }}>
              {selectedMetric.label}
            </p>
            <p className="text-2xl font-bold text-text-primary">
              {selectedValue !== null ? selectedMetric.format(selectedValue) : '—'}
            </p>
            <p className="text-xs text-text-secondary mt-0.5">{formatDate(selectedDay.date)}</p>
          </div>
          <button
            onClick={() => setSelected(null)}
            className="text-text-secondary hover:text-text-primary transition-colors p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Heatmap grid */}
      <div className="bg-surface rounded-xl border border-border p-4 overflow-x-auto">
        <div className="min-w-max">
          {/* Date header */}
          <div className="flex mb-1">
            <div className="w-20 shrink-0" />
            <div className="flex gap-0.5">
              {days.map(d => (
                <div
                  key={d.date}
                  className="w-5 text-center text-text-secondary shrink-0"
                  style={{ fontSize: 8 }}
                >
                  {shortDate(d.date)}
                </div>
              ))}
            </div>
          </div>

          {/* Metric rows */}
          {METRICS.map((metric, mIdx) => (
            <div key={metric.key as string} className="flex items-center mb-0.5">
              {/* Row label */}
              <div className="w-20 shrink-0 flex items-center gap-1.5 pr-2">
                <span
                  className="w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ background: metric.color, opacity: 0.8 }}
                />
                <span className="text-xs text-text-secondary font-medium leading-none">{metric.label}</span>
              </div>

              {/* Cells */}
              <div className="flex gap-0.5">
                {days.map((day, dIdx) => {
                  const intensity = day[metric.normKey] as number | null
                  const isSelected = selected?.dayIdx === dIdx && selected?.metricIdx === mIdx
                  return (
                    <button
                      key={day.date}
                      onClick={() => handleCell(dIdx, mIdx)}
                      className="w-5 h-5 rounded-sm shrink-0 transition-all hover:opacity-90"
                      style={{
                        background: cellBg(metric.color, intensity),
                        outline: isSelected ? `2px solid ${metric.color}` : 'none',
                        outlineOffset: 0,
                      }}
                      title={`${metric.label} · ${formatDate(day.date)}`}
                    />
                  )
                })}
              </div>
            </div>
          ))}

          {/* Month labels at bottom */}
          <div className="flex mt-2">
            <div className="w-20 shrink-0" />
            <div className="flex gap-0.5">
              {days.map((d, i) => {
                const date = new Date(d.date + 'T12:00:00')
                const isFirstOfMonth = date.getDate() === 1
                return (
                  <div
                    key={d.date}
                    className="w-5 shrink-0 text-center"
                    style={{ fontSize: 8, color: isFirstOfMonth ? '#888' : 'transparent' }}
                  >
                    {isFirstOfMonth
                      ? date.toLocaleDateString('en-US', { month: 'short' })
                      : ''}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-xs font-semibold text-text-secondary mb-3">Legend</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {METRICS.map(m => (
            <div key={m.key as string} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: m.color, opacity: 0.7 }} />
              <span className="text-xs text-text-secondary">{m.label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-text-secondary">Low</span>
          <div className="flex-1 h-2 rounded-full" style={{
            background: 'linear-gradient(to right, rgba(74,222,128,0.12), rgba(74,222,128,0.87))',
          }} />
          <span className="text-xs text-text-secondary">High</span>
          <span className="w-4 h-4 rounded-sm ml-3 shrink-0" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <span className="text-xs text-text-secondary">No data</span>
        </div>
      </div>

      <p className="text-xs text-text-secondary text-center opacity-40 pb-2">
        Last 90 days · Intensity is relative to your own range, not absolute benchmarks
      </p>
    </div>
  )
}
