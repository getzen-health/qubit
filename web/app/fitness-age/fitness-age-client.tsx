'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { BottomNav } from '@/components/bottom-nav'
import type { FitnessAgeData, ChartPoint } from './page'

interface FitnessAgeClientProps {
  data: FitnessAgeData
}

// ACSM full norm table for display
const NORM_TABLE = [
  { ageGroup: '20s', malePoor: 38.1, maleAvg: 44.2, maleExcellent: 50.2, femalePoor: 32.3, femaleAvg: 38.1, femaleExcellent: 43.9 },
  { ageGroup: '30s', malePoor: 36.7, maleAvg: 42.5, maleExcellent: 48.5, femalePoor: 30.9, femaleAvg: 36.7, femaleExcellent: 42.3 },
  { ageGroup: '40s', malePoor: 33.8, maleAvg: 39.9, maleExcellent: 46.4, femalePoor: 28.6, femaleAvg: 34.6, femaleExcellent: 39.7 },
  { ageGroup: '50s', malePoor: 30.2, maleAvg: 36.4, maleExcellent: 42.5, femalePoor: 25.8, femaleAvg: 31.9, femaleExcellent: 37.4 },
  { ageGroup: '60s', malePoor: 26.1, maleAvg: 32.3, maleExcellent: 38.1, femalePoor: 22.3, femaleAvg: 28.4, femaleExcellent: 33.6 },
  { ageGroup: '70+', malePoor: 21.7, maleAvg: 27.0, maleExcellent: 32.2, femalePoor: 19.4, femaleAvg: 23.9, femaleExcellent: 28.5 },
]

function getFitnessAgeColor(diff: number | null): string {
  if (diff === null) return '#14b8a6'
  if (diff >= 10) return '#22c55e'
  if (diff >= 0) return '#14b8a6'
  if (diff >= -5) return '#f97316'
  return '#ef4444'
}

function getBarColor(point: ChartPoint): string {
  if (point.isFitnessAge) return '#14b8a6'
  if (point.isChronologicalAge) return '#93c5fd'
  return '#374151'
}

function getInterpretation(diff: number | null, fitnessAge: number | null, chronoAge: number | null): string {
  if (fitnessAge === null) {
    return 'Sync your Apple Watch data to calculate your fitness age. VO₂ max is recorded automatically during outdoor walks, runs, and hikes.'
  }
  if (diff === null || chronoAge === null) {
    return `Your VO₂ max puts your cardiovascular fitness at the level typical of a ${fitnessAge}-year-old. Add your date of birth in Settings to see a personalised comparison.`
  }
  if (diff >= 10) {
    return `Outstanding! Your cardiovascular fitness is ${diff} years younger than your actual age. You are in the top tier for your age group — keep up the excellent aerobic training.`
  }
  if (diff >= 5) {
    return `Great result. Your fitness is ${diff} years ahead of your chronological age, reflecting consistent aerobic conditioning. Maintain your current routine to preserve this advantage.`
  }
  if (diff >= 0) {
    return `Your fitness age is on par with — or slightly better than — your chronological age. A solid baseline. Increasing Zone 2 cardio sessions (running, cycling, swimming) can push it lower.`
  }
  if (diff >= -5) {
    return `Your fitness age is slightly older than your chronological age. This is common and very improvable — aim for 150 minutes of moderate-intensity cardio per week to raise your VO₂ max.`
  }
  return `Your fitness age is ${Math.abs(diff)} years older than your chronological age. Consistent aerobic exercise — even 30-minute brisk walks — meaningfully improves VO₂ max over weeks to months.`
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #333)',
  borderRadius: 8,
  fontSize: 12,
  color: 'var(--color-text-primary, #fff)',
}

export default function FitnessAgeClient({ data }: FitnessAgeClientProps) {
  const { latestVO2Max, fitnessAge, fitnessAgeGroup, chronologicalAge, biologicalSex, percentileLabel, chartPoints } = data

  // Null VO2 max — empty state
  if (latestVO2Max === null) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-surface-secondary border border-border flex items-center justify-center mb-5">
            <span className="text-4xl">🫁</span>
          </div>
          <h2 className="text-lg font-semibold text-text-primary mb-2">No VO₂ Max data available</h2>
          <p className="text-sm text-text-secondary max-w-xs leading-relaxed">
            Apple Watch estimates VO₂ max during outdoor walks, runs, and hikes. Sync your iPhone after an outdoor workout to calculate your fitness age.
          </p>
        </div>
        <BottomNav />
      </>
    )
  }

  const diff = fitnessAge !== null && chronologicalAge !== null ? chronologicalAge - fitnessAge : null
  const heroColor = getFitnessAgeColor(diff)
  const interpretation = getInterpretation(diff, fitnessAge, chronologicalAge)

  const yMin = Math.floor(Math.min(...chartPoints.map((p) => p.vo2Avg)) - 4)
  const yMax = Math.ceil(Math.max(...chartPoints.map((p) => p.vo2Avg)) + 4)

  return (
    <div className="space-y-4">
      {/* ── Hero card ────────────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-6">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-3">
          Your Fitness Age
        </p>

        {fitnessAge !== null ? (
          <div className="flex items-end gap-4 mb-4">
            <div>
              <span className="text-7xl font-bold tabular-nums leading-none" style={{ color: heroColor }}>
                {fitnessAge}
              </span>
              <span className="text-xl font-medium text-text-secondary ml-1.5">yrs</span>
            </div>
            {chronologicalAge !== null && diff !== null && (
              <div className="mb-1.5">
                <p className="text-sm font-medium" style={{ color: heroColor }}>
                  {Math.abs(diff)} year{Math.abs(diff) !== 1 ? 's' : ''}{' '}
                  {diff >= 0 ? 'younger than' : 'older than'} your actual age
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  Chronological age: {chronologicalAge}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-text-secondary text-sm mb-4">Unable to compute fitness age.</p>
        )}

        {/* Stat pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-secondary rounded-full text-xs font-medium text-text-primary">
            <span className="text-cyan-400">VO₂</span>
            {latestVO2Max.toFixed(1)} mL/kg/min
          </span>
          {chronologicalAge !== null && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-secondary rounded-full text-xs font-medium text-text-primary">
              <span className="text-blue-400">Age</span>
              {chronologicalAge}
            </span>
          )}
          {biologicalSex !== 'unknown' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-secondary rounded-full text-xs font-medium text-text-primary capitalize">
              {biologicalSex}
            </span>
          )}
        </div>

        {/* Percentile label */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: heroColor }} />
          <p className="text-sm font-medium" style={{ color: heroColor }}>
            {percentileLabel}
          </p>
        </div>
      </div>

      {/* ── Comparison bar chart ──────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-1">VO₂ Max by Age Group</h2>
        <p className="text-xs text-text-secondary mb-4">
          50th percentile norms (ACSM) · {biologicalSex === 'female' ? 'Female' : biologicalSex === 'male' ? 'Male' : 'Male (default)'}
        </p>

        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartPoints} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="ageGroup"
              tick={{ fontSize: 11, fill: 'var(--color-text-secondary, #888)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              axisLine={false}
              tickLine={false}
              domain={[yMin, yMax]}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [`${v.toFixed(1)} mL/kg/min`, '50th percentile']}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            />
            {latestVO2Max !== null && (
              <ReferenceLine
                y={latestVO2Max}
                stroke="#f97316"
                strokeDasharray="5 3"
                strokeWidth={1.5}
                label={{
                  value: `Your VO₂ max: ${latestVO2Max.toFixed(1)}`,
                  position: 'insideTopRight',
                  fontSize: 10,
                  fill: '#f97316',
                  dy: -4,
                }}
              />
            )}
            <Bar dataKey="vo2Avg" radius={[4, 4, 0, 0]}>
              {chartPoints.map((point) => (
                <Cell key={point.ageGroup} fill={getBarColor(point)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#14b8a6]" />
            <span className="text-xs text-text-secondary">Your fitness age group</span>
          </div>
          {chronologicalAge !== null && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#93c5fd]" />
              <span className="text-xs text-text-secondary">Your chronological age group</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <div className="w-8 border-t-2 border-dashed border-orange-400" />
            <span className="text-xs text-text-secondary">Your VO₂ max</span>
          </div>
        </div>
      </div>

      {/* ── Interpretation card ───────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-2">What This Means</h2>
        <p className="text-sm text-text-secondary leading-relaxed">{interpretation}</p>
      </div>

      {/* ── VO2 max norm table ────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-1">ACSM Norms by Age Group</h2>
        <p className="text-xs text-text-secondary mb-4">
          mL/kg/min · {biologicalSex === 'female' ? 'Female' : 'Male (default)'}
        </p>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-xs min-w-[320px]">
            <thead>
              <tr className="text-text-secondary">
                <th className="text-left font-medium pb-2 pr-3">Age</th>
                <th className="text-right font-medium pb-2 px-2">Below avg</th>
                <th className="text-right font-medium pb-2 px-2">Average</th>
                <th className="text-right font-medium pb-2 pl-2">Excellent</th>
              </tr>
            </thead>
            <tbody>
              {NORM_TABLE.map((row) => {
                const isHighlighted = row.ageGroup === fitnessAgeGroup
                const poor = biologicalSex === 'female' ? row.femalePoor : row.malePoor
                const avg = biologicalSex === 'female' ? row.femaleAvg : row.maleAvg
                const excellent = biologicalSex === 'female' ? row.femaleExcellent : row.maleExcellent
                return (
                  <tr
                    key={row.ageGroup}
                    className={`border-t border-border transition-colors ${
                      isHighlighted ? 'bg-teal-500/10' : ''
                    }`}
                  >
                    <td className={`py-2 pr-3 font-medium ${isHighlighted ? 'text-teal-400' : 'text-text-primary'}`}>
                      {row.ageGroup}
                      {isHighlighted && (
                        <span className="ml-1.5 text-[10px] text-teal-400 font-semibold">YOU</span>
                      )}
                    </td>
                    <td className={`py-2 px-2 text-right tabular-nums ${isHighlighted ? 'text-teal-300' : 'text-text-secondary'}`}>
                      &lt;{poor.toFixed(1)}
                    </td>
                    <td className={`py-2 px-2 text-right tabular-nums font-medium ${isHighlighted ? 'text-teal-300' : 'text-text-primary'}`}>
                      {avg.toFixed(1)}
                    </td>
                    <td className={`py-2 pl-2 text-right tabular-nums ${isHighlighted ? 'text-teal-300' : 'text-text-secondary'}`}>
                      &gt;{excellent.toFixed(1)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Science card ─────────────────────────────────────────────────────── */}
      <div className="bg-surface rounded-2xl border border-border p-5 text-xs text-text-secondary space-y-2">
        <p className="font-semibold text-text-primary text-sm">The Science</p>
        <p>
          VO₂ max (maximal oxygen uptake) is the highest rate at which your body can consume oxygen during sustained exercise. It is the gold standard measure of cardiorespiratory fitness and a strong predictor of long-term health outcomes.
        </p>
        <p>
          Fitness age is calculated by finding the ACSM age group whose 50th-percentile VO₂ max norm best matches your own measured value. A fitness age lower than your chronological age indicates above-average aerobic capacity for your demographic.
        </p>
        <p>
          Norms are sourced from the American College of Sports Medicine (ACSM) Guidelines for Exercise Testing and Prescription. Apple Watch estimates VO₂ max automatically during outdoor running and walking.
        </p>
      </div>
    </div>
  )
}
