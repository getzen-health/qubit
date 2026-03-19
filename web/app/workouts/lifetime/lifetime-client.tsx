'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { LifetimeData, YearStat } from './page'

interface Props {
  data: LifetimeData
}

function fmt0(n: number): string {
  return Math.round(n).toLocaleString()
}

// Milestone definitions: [label, condition]
interface Milestone {
  emoji: string
  label: string
  color: string
}

function computeMilestones(data: LifetimeData): Milestone[] {
  const milestones: Milestone[] = []

  // Running milestones
  if (data.runKm >= 1000) {
    milestones.push({ emoji: '🏃', label: 'Marathoner', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' })
  } else if (data.runKm >= 500) {
    milestones.push({ emoji: '🏃', label: 'Century Runner', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' })
  } else if (data.runKm >= 100) {
    milestones.push({ emoji: '🏃', label: 'Runner', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' })
  }

  // Cycling milestones
  if (data.cycleKm >= 1000) {
    milestones.push({ emoji: '🚴', label: 'Ultra Cyclist', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' })
  } else if (data.cycleKm >= 200) {
    milestones.push({ emoji: '🚴', label: 'Cyclist', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' })
  }

  // Swimming milestones
  if (data.swimKm >= 200) {
    milestones.push({ emoji: '🏊', label: 'Open Water Swimmer', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' })
  } else if (data.swimKm >= 50) {
    milestones.push({ emoji: '🏊', label: 'Swimmer', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' })
  }

  // General milestones
  if (data.totalSessions >= 500) {
    milestones.push({ emoji: '💪', label: 'Iron Athlete', color: 'bg-red-500/20 text-red-400 border-red-500/30' })
  }

  if (data.totalWorkoutDays >= 365) {
    milestones.push({ emoji: '📅', label: 'Consistent', color: 'bg-green-500/20 text-green-400 border-green-500/30' })
  }

  return milestones
}

function formatFirstDate(isoDate: string | null): string {
  if (!isoDate) return '—'
  const d = new Date(isoDate)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

// Custom tooltip for the year bar chart
function YearTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-primary border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-text-primary mb-1">{label}</p>
      <p className="text-text-secondary tabular-nums">{payload[0].value} sessions</p>
    </div>
  )
}

export function LifetimeClient({ data }: Props) {
  const {
    totalSessions,
    totalHours,
    totalKm,
    totalCalories,
    totalWorkoutDays,
    firstWorkoutDate,
    sportStats,
    yearStats,
    bestYear,
    bestYearSessions,
    runKm,
    cycleKm,
    swimKm,
  } = data

  const milestones = computeMilestones(data)

  // Most active sport by sessions
  const mostActiveSport = sportStats.length > 0 ? sportStats[0].sport : null

  // Chart data with highlighted best year
  const chartData = yearStats.map((ys: YearStat) => ({
    year: String(ys.year),
    sessions: ys.sessions,
    isBest: ys.year === bestYear,
  }))

  const marathons = runKm > 0 ? (runKm / 42.195).toFixed(1) : null

  return (
    <div className="space-y-6">
      {/* Hero stats — 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-surface-primary to-surface-secondary rounded-2xl p-5 text-center border border-border">
          <div className="text-3xl mb-1">🏃</div>
          <div className="text-3xl font-bold text-text-primary tabular-nums">{fmt0(totalSessions)}</div>
          <div className="text-sm text-text-secondary mt-1">Sessions</div>
        </div>

        <div className="bg-gradient-to-br from-surface-primary to-surface-secondary rounded-2xl p-5 text-center border border-border">
          <div className="text-3xl mb-1">⏱️</div>
          <div className="text-3xl font-bold text-text-primary tabular-nums">{fmt0(totalHours)}h</div>
          <div className="text-sm text-text-secondary mt-1">Hours trained</div>
        </div>

        {totalKm > 0 && (
          <div className="bg-gradient-to-br from-surface-primary to-surface-secondary rounded-2xl p-5 text-center border border-border">
            <div className="text-3xl mb-1">📍</div>
            <div className="text-3xl font-bold text-text-primary tabular-nums">{fmt0(totalKm)} km</div>
            <div className="text-sm text-text-secondary mt-1">Distance covered</div>
          </div>
        )}

        <div className="bg-gradient-to-br from-surface-primary to-surface-secondary rounded-2xl p-5 text-center border border-border">
          <div className="text-3xl mb-1">🔥</div>
          <div className="text-3xl font-bold text-text-primary tabular-nums">
            {(totalCalories / 1000).toFixed(1)}k kcal
          </div>
          <div className="text-sm text-text-secondary mt-1">Calories burned</div>
        </div>
      </div>

      {/* Milestones */}
      <div className="bg-surface-primary rounded-xl p-4 border border-border">
        <h2 className="font-semibold text-text-primary mb-3">Milestones</h2>
        {milestones.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {milestones.map((m) => (
              <span
                key={m.label}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium ${m.color}`}
              >
                <span>{m.emoji}</span>
                <span>{m.label}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-secondary">Keep training to unlock milestones!</p>
        )}
      </div>

      {/* Sport breakdown */}
      {sportStats.length > 0 && (
        <div className="bg-surface-primary rounded-xl p-4 border border-border">
          <h2 className="font-semibold text-text-primary mb-3">Sport Breakdown (All-Time)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-secondary text-xs border-b border-border">
                  <th className="text-left pb-2">Sport</th>
                  <th className="text-right pb-2">Sessions</th>
                  <th className="text-right pb-2">Hours</th>
                  <th className="text-right pb-2">Distance</th>
                  <th className="text-right pb-2">Share</th>
                </tr>
              </thead>
              <tbody>
                {sportStats.map((s, i) => {
                  const pct = totalSessions > 0 ? (s.sessions / totalSessions) * 100 : 0
                  return (
                    <tr key={s.sport} className={i % 2 === 0 ? '' : 'bg-surface-secondary'}>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: s.color }}
                          />
                          <span className="text-text-primary">{s.sport}</span>
                        </div>
                      </td>
                      <td className="py-2 text-right tabular-nums text-text-primary">{fmt0(s.sessions)}</td>
                      <td className="py-2 text-right tabular-nums text-text-secondary">{s.hours.toFixed(0)}h</td>
                      <td className="py-2 text-right tabular-nums text-text-secondary">
                        {s.km !== null ? `${s.km.toFixed(0)} km` : '—'}
                      </td>
                      <td className="py-2 text-right tabular-nums text-text-secondary">{pct.toFixed(0)}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Year-over-year bar chart */}
      {yearStats.length > 0 && (
        <div className="bg-surface-primary rounded-xl p-4 border border-border">
          <h2 className="font-semibold text-text-primary mb-1">Sessions Per Year</h2>
          {bestYear && (
            <p className="text-xs text-text-secondary mb-4">
              Best year: {bestYear} with {bestYearSessions} sessions
            </p>
          )}
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ left: -20, bottom: 0 }} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip content={<YearTooltip />} />
              <Bar
                dataKey="sessions"
                radius={[4, 4, 0, 0]}
                fill="#f97316"
                // Custom cell colors: highlight best year
                label={false}
              />
            </BarChart>
          </ResponsiveContainer>
          {bestYear && (
            <p className="text-xs text-text-secondary mt-2 text-center">
              Orange bars — best year ({bestYear}) is your peak
            </p>
          )}
        </div>
      )}

      {/* Fun facts */}
      <div className="bg-surface-primary rounded-xl p-4 border border-border">
        <h2 className="font-semibold text-text-primary mb-3">Fun Facts</h2>
        <ul className="space-y-2 text-sm text-text-secondary">
          {firstWorkoutDate && (
            <li className="flex items-start gap-2">
              <span className="text-base">📅</span>
              <span>Since {formatFirstDate(firstWorkoutDate)}</span>
            </li>
          )}
          <li className="flex items-start gap-2">
            <span className="text-base">🗓️</span>
            <span>Across {fmt0(totalWorkoutDays)} unique training days</span>
          </li>
          {mostActiveSport && (
            <li className="flex items-start gap-2">
              <span className="text-base">🥇</span>
              <span>Most active sport: {mostActiveSport}</span>
            </li>
          )}
          {runKm > 0 && marathons && (
            <li className="flex items-start gap-2">
              <span className="text-base">🏃</span>
              <span>
                Total running: {runKm.toFixed(0)} km (~{marathons} marathons)
              </span>
            </li>
          )}
          {cycleKm > 0 && (
            <li className="flex items-start gap-2">
              <span className="text-base">🚴</span>
              <span>Total cycling: {cycleKm.toFixed(0)} km</span>
            </li>
          )}
          {swimKm > 0 && (
            <li className="flex items-start gap-2">
              <span className="text-base">🏊</span>
              <span>Total swimming: {swimKm.toFixed(0)} km</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
