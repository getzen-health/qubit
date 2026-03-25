'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { Share2 } from 'lucide-react'
import Link from 'next/link'
import {
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import { ShareCard } from '@/components/ShareCard'

const BarChart = dynamic(() => import('recharts').then((m) => ({ default: m.BarChart })), { ssr: false })

interface SleepRecord {
  id: string
  start_time: string
  end_time: string
  duration_minutes: number
  awake_minutes?: number
  rem_minutes?: number
  core_minutes?: number
  deep_minutes?: number
  sleep_quality_score?: number
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

function stageWidth(minutes: number, total: number) {
  return `${Math.round((minutes / Math.max(total, 1)) * 100)}%`
}

function sleepQualityScore(record: SleepRecord, goalMinutes: number): { score: number; grade: string; color: string } | null {
  const total = record.duration_minutes
  if (total <= 0) return null

  // Duration: up to 40 pts — full points at goal, partial below
  const durPts = Math.min(40, Math.round((total / Math.max(goalMinutes, 1)) * 40))

  // Only score stages if we have stage data
  const hasS = (record.deep_minutes ?? 0) + (record.rem_minutes ?? 0) + (record.core_minutes ?? 0) > 0
  if (!hasS) {
    // Score only on duration when no stage data
    const score = Math.round((durPts / 40) * 100)
    return scoreToGrade(score)
  }

  // Deep: 25 pts — ideal is 15–20% of total
  const deepPct = (record.deep_minutes ?? 0) / total
  const deepPts = deepPct >= 0.15 ? 25 : Math.round((deepPct / 0.15) * 25)

  // REM: 25 pts — ideal is 20–25% of total
  const remPct = (record.rem_minutes ?? 0) / total
  const remPts = remPct >= 0.20 ? 25 : Math.round((remPct / 0.20) * 25)

  // Awake: 10 pts — ideal < 5% awake
  const awakePct = (record.awake_minutes ?? 0) / (total + (record.awake_minutes ?? 0))
  const awakePts = awakePct <= 0.05 ? 10 : awakePct >= 0.20 ? 0 : Math.round(10 - ((awakePct - 0.05) / 0.15) * 10)

  const score = Math.min(100, durPts + deepPts + remPts + awakePts)
  return scoreToGrade(score)
}

function scoreToGrade(score: number): { score: number; grade: string; color: string } {
  if (score >= 85) return { score, grade: 'A', color: 'text-green-400 bg-green-500/10 border-green-500/20' }
  if (score >= 70) return { score, grade: 'B', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' }
  if (score >= 55) return { score, grade: 'C', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' }
  if (score >= 40) return { score, grade: 'D', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' }
  return { score, grade: 'F', color: 'text-red-400 bg-red-500/10 border-red-500/20' }
}

interface SleepPageClientProps {
  records: SleepRecord[]
  sleepGoalHours?: number
  elevatedBreathingNights?: number
  breathingByDate?: Record<string, number>
}

export function SleepPageClient({ records, sleepGoalHours = 8, elevatedBreathingNights = 0, breathingByDate = {} }: SleepPageClientProps) {
  const [shareRecord, setShareRecord] = useState<SleepRecord | null>(null)

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-5xl mb-4">🌙</span>
        <h2 className="text-lg font-semibold text-text-primary mb-2">No sleep data yet</h2>
        <p className="text-sm text-text-secondary">
          Sync your iPhone to import sleep data from Apple Health.
        </p>
      </div>
    )
  }

  // Chart data: oldest → newest
  const chartData = [...records].reverse().map((r) => ({
    date: new Date(r.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    hours: +(r.duration_minutes / 60).toFixed(1),
    deep: +((r.deep_minutes ?? 0) / 60).toFixed(2),
    rem: +((r.rem_minutes ?? 0) / 60).toFixed(2),
    core: +((r.core_minutes ?? 0) / 60).toFixed(2),
    awake: +((r.awake_minutes ?? 0) / 60).toFixed(2),
  }))

  // 7-day averages (first 7 records are most recent)
  const recent7 = records.slice(0, 7)
  const avgTotal = Math.round(recent7.reduce((s, r) => s + r.duration_minutes, 0) / Math.max(recent7.length, 1))
  const avgDeep = Math.round(recent7.reduce((s, r) => s + (r.deep_minutes ?? 0), 0) / Math.max(recent7.length, 1))
  const avgRem = Math.round(recent7.reduce((s, r) => s + (r.rem_minutes ?? 0), 0) / Math.max(recent7.length, 1))

  // Sleep debt: 7-day accumulated deficit vs goal (minutes)
  const goalMin = sleepGoalHours * 60
  const sleepDebtMin = recent7.reduce((debt, r) => debt + Math.max(0, goalMin - r.duration_minutes), 0)
  const sleepSurplusMin = recent7.reduce((s, r) => s + Math.max(0, r.duration_minutes - goalMin), 0)
  const netDebtMin = sleepDebtMin - sleepSurplusMin // negative = surplus

  const hasStages = records.some((r) => (r.deep_minutes ?? 0) > 0 || (r.rem_minutes ?? 0) > 0)

  // Sleep schedule consistency (from all records)
  const bedtimeHours = records.map((r) => {
    const t = new Date(r.start_time)
    let h = t.getHours() + t.getMinutes() / 60
    if (h < 12) h += 24 // wrap midnight: 0:30 → 24.5
    return h
  })
  const waketimeHours = records.map((r) => {
    const t = new Date(r.end_time)
    return t.getHours() + t.getMinutes() / 60
  })
  function avgHours(arr: number[]) { return arr.reduce((a, b) => a + b, 0) / arr.length }
  function stdDev(arr: number[], mean: number) {
    return Math.sqrt(arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length)
  }
  function fmtHourDecimal(h: number) {
    const norm = h % 24
    const hh = Math.floor(norm)
    const mm = Math.round((norm - hh) * 60)
    const period = hh >= 12 ? 'PM' : 'AM'
    const displayH = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh
    return `${displayH}:${mm.toString().padStart(2, '0')} ${period}`
  }
  const avgBed = avgHours(bedtimeHours)
  const avgWake = avgHours(waketimeHours)
  const bedSD = stdDev(bedtimeHours, avgBed) * 60 // in minutes
  const wakeSD = stdDev(waketimeHours, avgWake) * 60
  const consistencyLabel = bedSD < 30 ? 'Very consistent' : bedSD < 60 ? 'Consistent' : bedSD < 90 ? 'Moderate' : 'Variable'
  const consistencyColor = bedSD < 30 ? 'text-green-400' : bedSD < 60 ? 'text-blue-400' : bedSD < 90 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="space-y-6">
      {/* Bar chart */}
      <div role="img" aria-label="Sleep duration chart for the last 30 days" className="bg-surface rounded-xl border border-border p-4">
        <h2 className="text-sm font-medium text-text-secondary mb-1">
          {hasStages ? 'Sleep Stages (hours)' : 'Sleep Duration (hours)'}
        </h2>
        <p className="sr-only">Your average nightly sleep over the last 7 days is {(avgTotal / 60).toFixed(1)} hours, with a goal of {sleepGoalHours} hours.</p>
        {hasStages && (
          <div className="flex gap-3 mb-3 text-xs text-text-secondary">
            <span><span className="text-blue-500">●</span> Deep</span>
            <span><span className="text-purple-500">●</span> REM</span>
            <span><span className="text-blue-300">●</span> Light</span>
            <span><span className="text-orange-400">●</span> Awake</span>
          </div>
        )}
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'var(--color-text-secondary, #888)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis hide domain={[0, 10]} />
            <Tooltip
              contentStyle={{
                background: 'var(--color-surface, #1a1a1a)',
                border: '1px solid var(--color-border, #333)',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = { deep: 'Deep', rem: 'REM', core: 'Light', awake: 'Awake', hours: 'Total' }
                return [`${value}h`, labels[name] ?? name]
              }}
            />
            <ReferenceLine
              y={sleepGoalHours}
              stroke="rgba(255,255,255,0.25)"
              strokeDasharray="4 3"
              label={{ value: `${sleepGoalHours}h goal`, position: 'insideTopRight', fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
            />
            {hasStages ? (
              <>
                <Bar dataKey="deep" stackId="s" fill="#3b82f6" />
                <Bar dataKey="rem" stackId="s" fill="#a855f7" />
                <Bar dataKey="core" stackId="s" fill="#93c5fd" />
                <Bar dataKey="awake" stackId="s" fill="#fb923c" radius={[3, 3, 0, 0]} />
              </>
            ) : (
              <Bar dataKey="hours" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 7-day averages */}
      {recent7.length >= 3 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-3">7-Day Average</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Total', value: formatDuration(avgTotal) },
              ...(hasStages ? [
                { label: 'Deep', value: formatDuration(avgDeep) },
                { label: 'REM', value: formatDuration(avgRem) },
              ] : []),
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-lg font-bold text-text-primary">{value}</p>
                <p className="text-xs text-text-secondary">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sleep debt */}
      {recent7.length >= 3 && (
        <div className={`rounded-xl border p-4 ${netDebtMin > 60 ? 'bg-red-500/5 border-red-500/20' : netDebtMin < -30 ? 'bg-green-500/5 border-green-500/20' : 'bg-surface border-border'}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-text-secondary">7-Day Sleep Debt</h2>
            {netDebtMin > 0 ? (
              <span className="text-red-400 font-bold text-sm">
                -{Math.floor(netDebtMin / 60)}h {netDebtMin % 60}m owed
              </span>
            ) : (
              <span className="text-green-400 font-bold text-sm">
                +{Math.floor(Math.abs(netDebtMin) / 60)}h {Math.abs(netDebtMin) % 60}m surplus
              </span>
            )}
          </div>
          <div className="mt-2 h-2 bg-surface-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${netDebtMin > 0 ? 'bg-red-400' : 'bg-green-400'}`}
              style={{ width: `${Math.min(100, (Math.abs(netDebtMin) / (goalMin * 7)) * 100 * 3)}%` }}
            />
          </div>
          <p className="text-xs text-text-secondary mt-1.5">
            {netDebtMin > 60
              ? `To recover: add ~${Math.ceil(netDebtMin / 7 / 60)}h to tonight's sleep`
              : netDebtMin > 0
              ? 'Slightly behind — close to balanced'
              : 'You\'re ahead of your sleep goal this week'}
          </p>
        </div>
      )}

      {/* Sleep schedule */}
      {records.length >= 5 && (
        <div className="bg-surface rounded-xl border border-border p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-3">Sleep Schedule</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-text-primary">{fmtHourDecimal(avgBed)}</p>
              <p className="text-xs text-text-secondary">Avg Bedtime</p>
              {bedSD > 0 && <p className="text-xs text-text-secondary opacity-60">±{Math.round(bedSD)}m</p>}
            </div>
            <div>
              <p className="text-lg font-bold text-text-primary">{fmtHourDecimal(avgWake)}</p>
              <p className="text-xs text-text-secondary">Avg Wake</p>
              {wakeSD > 0 && <p className="text-xs text-text-secondary opacity-60">±{Math.round(wakeSD)}m</p>}
            </div>
            <div>
              <p className={`text-lg font-bold ${consistencyColor}`}>{consistencyLabel}</p>
              <p className="text-xs text-text-secondary">Consistency</p>
            </div>
          </div>
        </div>
      )}

      {/* Breathing disturbances */}
      {Object.keys(breathingByDate).length > 0 && (
        <div className={`rounded-xl border p-4 ${elevatedBreathingNights > 0 ? 'bg-orange-500/5 border-orange-500/20' : 'bg-surface border-border'}`}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-medium text-text-secondary">Sleep Breathing</h2>
            <span className={`text-sm font-bold ${elevatedBreathingNights > 5 ? 'text-orange-400' : elevatedBreathingNights > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
              {elevatedBreathingNights} elevated night{elevatedBreathingNights !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-xs text-text-secondary">
            {elevatedBreathingNights === 0
              ? 'No elevated breathing disturbances detected in the last 30 nights.'
              : elevatedBreathingNights > 5
              ? 'Frequent elevated breathing detected. Consider discussing with a doctor.'
              : 'Some elevated breathing detected. Apple Watch monitors for sleep apnea patterns.'}
          </p>
        </div>
      )}

      {/* Night list */}
      <div className="space-y-3">
        {records.map((record) => {
          const night = new Date(record.start_time)
          const dayDate = night.toISOString().slice(0, 10)
          const totalWithAwake = record.duration_minutes + (record.awake_minutes ?? 0)
          const showStages = hasStages && ((record.deep_minutes ?? 0) + (record.rem_minutes ?? 0) + (record.core_minutes ?? 0)) > 0
          const quality = sleepQualityScore(record, sleepGoalHours * 60)
          const breathingValue = breathingByDate[dayDate]
          const breathingElevated = breathingValue === 1

          return (
            <Link key={record.id} href={`/day/${dayDate}`} className="bg-surface rounded-xl border border-border p-4 space-y-3 block hover:bg-surface-secondary transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-text-primary">
                    {night.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {new Date(record.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    {' – '}
                    {new Date(record.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {breathingElevated && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full border bg-orange-500/10 text-orange-400 border-orange-500/20" title="Elevated breathing disturbances detected">
                      🌬️
                    </span>
                  )}
                  {quality && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${quality.color}`} title={`Sleep score: ${quality.score}/100`}>
                      {quality.grade}
                    </span>
                  )}
                  <p className="text-xl font-bold text-blue-400">
                    {formatDuration(record.duration_minutes)}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShareRecord(record) }}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-text-secondary hover:text-text-primary transition-colors"
                    title="Share this night"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {showStages && (
                <>
                  {/* Stages bar */}
                  <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                    {(record.deep_minutes ?? 0) > 0 && (
                      <div
                        className="bg-blue-500 rounded-l-full"
                        style={{ width: stageWidth(record.deep_minutes!, totalWithAwake) }}
                      />
                    )}
                    {(record.rem_minutes ?? 0) > 0 && (
                      <div
                        className="bg-purple-500"
                        style={{ width: stageWidth(record.rem_minutes!, totalWithAwake) }}
                      />
                    )}
                    {(record.core_minutes ?? 0) > 0 && (
                      <div
                        className="bg-blue-300"
                        style={{ width: stageWidth(record.core_minutes!, totalWithAwake) }}
                      />
                    )}
                    {(record.awake_minutes ?? 0) > 0 && (
                      <div
                        className="bg-orange-400 rounded-r-full"
                        style={{ width: stageWidth(record.awake_minutes!, totalWithAwake) }}
                      />
                    )}
                  </div>

                  {/* Stage labels */}
                  <div className="flex gap-3 text-xs text-text-secondary">
                    {(record.deep_minutes ?? 0) > 0 && (
                      <span><span className="text-blue-400">●</span> Deep {formatDuration(record.deep_minutes!)}</span>
                    )}
                    {(record.rem_minutes ?? 0) > 0 && (
                      <span><span className="text-purple-400">●</span> REM {formatDuration(record.rem_minutes!)}</span>
                    )}
                    {(record.core_minutes ?? 0) > 0 && (
                      <span><span className="text-blue-300">●</span> Light {formatDuration(record.core_minutes!)}</span>
                    )}
                    {(record.awake_minutes ?? 0) > 0 && (
                      <span><span className="text-orange-400">●</span> Awake {formatDuration(record.awake_minutes!)}</span>
                    )}
                  </div>
                </>
              )}
            </Link>
          )
        })}
      </div>

      {shareRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShareRecord(null)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <ShareCard
              metrics={{
                steps: 0,
                sleepHours: shareRecord.duration_minutes / 60,
                date: shareRecord.start_time.slice(0, 10),
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
