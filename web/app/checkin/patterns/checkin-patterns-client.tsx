'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Legend, Cell,
} from 'recharts'

export interface DowStat {
  label: string
  count: number
  avgEnergy: number
  avgMood: number
  avgStress: number
}

export interface MonthStat {
  label: string
  count: number
  avgEnergy: number
  avgMood: number
  avgStress: number
}

export interface ScoreDist {
  score: number
  count: number
  pct: number
}

export interface CheckinPatternData {
  totalDays: number
  overallEnergy: number
  overallMood: number
  overallStress: number
  dowData: DowStat[]
  monthData: MonthStat[]
  energyDist: ScoreDist[]
  moodDist: ScoreDist[]
  stressDist: ScoreDist[]
  weekdayAvgEnergy: number | null
  weekendAvgEnergy: number | null
  weekdayAvgMood: number | null
  weekendAvgMood: number | null
  weekdayAvgStress: number | null
  weekendAvgStress: number | null
  bestMoodDow: string | null
  worstMoodDow: string | null
  highStressDow: string | null
}

const ENERGY_EMOJIS = ['', '😴', '😑', '😐', '🙂', '😄']
const MOOD_EMOJIS   = ['', '😞', '😕', '😐', '🙂', '😁']
const STRESS_EMOJIS = ['', '😌', '🙂', '😐', '😟', '😰']

const ENERGY_COLOR = '#f59e0b'
const MOOD_COLOR   = '#8b5cf6'
const STRESS_COLOR = '#ef4444'

// Map score 1–5 to a color (green=good, red=bad for energy/mood; inverted for stress)
function scoreColor(score: number, isStress = false): string {
  if (isStress) {
    const s = 5 - score + 1
    return scoreColor(s, false)
  }
  if (score >= 4.5) return '#22c55e'
  if (score >= 3.5) return '#86efac'
  if (score >= 2.5) return '#fbbf24'
  if (score >= 1.5) return '#f97316'
  return '#ef4444'
}

function scoreLabel(score: number): string {
  if (score >= 4.5) return 'Great'
  if (score >= 3.5) return 'Good'
  if (score >= 2.5) return 'Okay'
  if (score >= 1.5) return 'Low'
  return 'Poor'
}

function fmt1(n: number) {
  return n.toFixed(1)
}

function StatCard({ label, value, emoji, color }: { label: string; value: number; emoji: string; color: string }) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4 flex items-center gap-3">
      <div className="text-2xl">{emoji}</div>
      <div>
        <p className="text-xs text-text-secondary mb-0.5">{label}</p>
        <p className="text-2xl font-bold" style={{ color }}>{fmt1(value)}</p>
        <p className="text-xs text-text-secondary">{scoreLabel(value)}</p>
      </div>
    </div>
  )
}

function DistBar({ dist, isStress = false }: { dist: ScoreDist[]; isStress?: boolean }) {
  const emojis = isStress ? STRESS_EMOJIS : MOOD_EMOJIS
  return (
    <div className="space-y-1.5">
      {dist.map((d) => (
        <div key={d.score} className="flex items-center gap-2">
          <span className="text-sm w-5 text-center">{emojis[d.score]}</span>
          <div className="flex-1 bg-surface-secondary rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${d.pct}%`, backgroundColor: scoreColor(d.score, isStress) }}
            />
          </div>
          <span className="text-xs text-text-secondary w-10 text-right">{d.pct}%</span>
        </div>
      ))}
    </div>
  )
}

export function CheckinPatternsClient({ data }: { data: CheckinPatternData }) {
  const {
    totalDays, overallEnergy, overallMood, overallStress,
    dowData, monthData, energyDist, moodDist, stressDist,
    weekdayAvgEnergy, weekendAvgEnergy, weekdayAvgMood, weekendAvgMood,
    weekdayAvgStress, weekendAvgStress,
    bestMoodDow, worstMoodDow, highStressDow,
  } = data

  const hasDowData = dowData.some((d) => d.count > 0)
  const hasMonthData = monthData.length >= 2

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Avg Energy" value={overallEnergy} emoji="⚡" color={ENERGY_COLOR} />
        <StatCard label="Avg Mood" value={overallMood} emoji="😊" color={MOOD_COLOR} />
        <StatCard label="Avg Stress" value={overallStress} emoji="😤" color={STRESS_COLOR} />
      </div>

      {/* Highlights */}
      {(bestMoodDow || highStressDow) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {bestMoodDow && (
            <div className="bg-surface rounded-xl border border-border p-3 text-center">
              <p className="text-xs text-text-secondary mb-1">Best mood day</p>
              <p className="text-lg font-bold text-purple-500">{bestMoodDow}</p>
              <p className="text-lg">😁</p>
            </div>
          )}
          {worstMoodDow && worstMoodDow !== bestMoodDow && (
            <div className="bg-surface rounded-xl border border-border p-3 text-center">
              <p className="text-xs text-text-secondary mb-1">Lowest mood day</p>
              <p className="text-lg font-bold text-orange-500">{worstMoodDow}</p>
              <p className="text-lg">😕</p>
            </div>
          )}
          {highStressDow && (
            <div className="bg-surface rounded-xl border border-border p-3 text-center">
              <p className="text-xs text-text-secondary mb-1">Most stressful</p>
              <p className="text-lg font-bold text-red-500">{highStressDow}</p>
              <p className="text-lg">😰</p>
            </div>
          )}
        </div>
      )}

      {/* DOW bar charts */}
      {hasDowData && (
        <>
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-sm font-semibold text-text-primary mb-4">Energy & Mood by Day of Week</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dowData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} tickCount={6} />
                <Tooltip
                  formatter={(val: number, name: string) => [fmt1(val), name]}
                  contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="avgEnergy" name="Energy" fill={ENERGY_COLOR} radius={[3, 3, 0, 0]} />
                <Bar dataKey="avgMood" name="Mood" fill={MOOD_COLOR} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Stress by DOW */}
          <div className="bg-surface rounded-xl border border-border p-4">
            <p className="text-sm font-semibold text-text-primary mb-1">Stress by Day of Week</p>
            <p className="text-xs text-text-secondary mb-4">Higher = more stressed</p>
            <div className="space-y-2">
              {dowData.map((d) => {
                const pct = d.avgStress > 0 ? (d.avgStress / 5) * 100 : 0
                return (
                  <div key={d.label} className="flex items-center gap-3">
                    <span className="text-xs text-text-secondary w-8">{d.label}</span>
                    <div className="flex-1 bg-surface-secondary rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: scoreColor(d.avgStress, true) }}
                      />
                    </div>
                    <span className="text-xs font-medium text-text-primary w-8 text-right">
                      {d.avgStress > 0 ? fmt1(d.avgStress) : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Monthly trend */}
      {hasMonthData && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Monthly Wellness Trend</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={monthData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={[1, 5]} tick={{ fontSize: 10 }} tickCount={5} />
              <Tooltip
                formatter={(val: number, name: string) => [fmt1(val), name]}
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="avgEnergy" name="Energy" stroke={ENERGY_COLOR} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="avgMood" name="Mood" stroke={MOOD_COLOR} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="avgStress" name="Stress" stroke={STRESS_COLOR} strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Weekday vs Weekend */}
      {weekdayAvgMood !== null && weekendAvgMood !== null && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-4">Weekday vs Weekend</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-text-secondary text-center mb-2">Energy</p>
              <div className="flex gap-2">
                <div className="flex-1 text-center">
                  <p className="text-xs text-text-secondary">Weekday</p>
                  <p className="text-lg font-bold" style={{ color: ENERGY_COLOR }}>
                    {weekdayAvgEnergy !== null ? fmt1(weekdayAvgEnergy) : '—'}
                  </p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-xs text-text-secondary">Weekend</p>
                  <p className="text-lg font-bold" style={{ color: ENERGY_COLOR }}>
                    {weekendAvgEnergy !== null ? fmt1(weekendAvgEnergy) : '—'}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs text-text-secondary text-center mb-2">Mood</p>
              <div className="flex gap-2">
                <div className="flex-1 text-center">
                  <p className="text-xs text-text-secondary">Weekday</p>
                  <p className="text-lg font-bold" style={{ color: MOOD_COLOR }}>
                    {weekdayAvgMood !== null ? fmt1(weekdayAvgMood) : '—'}
                  </p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-xs text-text-secondary">Weekend</p>
                  <p className="text-lg font-bold" style={{ color: MOOD_COLOR }}>
                    {weekendAvgMood !== null ? fmt1(weekendAvgMood) : '—'}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs text-text-secondary text-center mb-2">Stress</p>
              <div className="flex gap-2">
                <div className="flex-1 text-center">
                  <p className="text-xs text-text-secondary">Weekday</p>
                  <p className="text-lg font-bold" style={{ color: STRESS_COLOR }}>
                    {weekdayAvgStress !== null ? fmt1(weekdayAvgStress) : '—'}
                  </p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-xs text-text-secondary">Weekend</p>
                  <p className="text-lg font-bold" style={{ color: STRESS_COLOR }}>
                    {weekendAvgStress !== null ? fmt1(weekendAvgStress) : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Score distributions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-3">Energy Distribution</p>
          <DistBar dist={energyDist} />
        </div>
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-3">Mood Distribution</p>
          <DistBar dist={moodDist} />
        </div>
        <div className="bg-surface rounded-xl border border-border p-4">
          <p className="text-sm font-semibold text-text-primary mb-3">Stress Distribution</p>
          <DistBar dist={stressDist} isStress />
        </div>
      </div>

      {/* Consistency */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-2">Logging Consistency</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-text-primary">{totalDays}</span>
          <span className="text-sm text-text-secondary">days logged in the past year</span>
        </div>
        <div className="mt-3 bg-surface-secondary rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-purple-500"
            style={{ width: `${Math.min((totalDays / 365) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-text-secondary mt-1">{Math.round((totalDays / 365) * 100)}% of days this year</p>
      </div>
    </div>
  )
}
