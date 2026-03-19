'use client'

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export interface DimensionScore {
  name: string
  shortName: string
  score: number        // 0–100
  prevScore: number    // last month
  value: string        // e.g. "72 ms", "8,432 steps"
  label: string        // description of what the score represents
  color: string        // tailwind color class
  icon: string         // emoji
}

export interface FitnessProfileData {
  dimensions: DimensionScore[]
  overallScore: number
  prevOverallScore: number
  strengths: string[]
  improvements: string[]
}

const tooltipStyle = {
  background: 'var(--color-surface, #1a1a1a)',
  border: '1px solid var(--color-border, #2a2a2a)',
  borderRadius: 8,
  color: 'var(--color-text-primary, #fff)',
  fontSize: 12,
}

function ScoreBadge({ score, prev }: { score: number; prev: number }) {
  const delta = score - prev
  const abs = Math.abs(Math.round(delta))
  if (Math.abs(delta) < 2) return <span className="text-text-secondary text-xs">→ stable</span>
  if (delta > 0) return (
    <span className="flex items-center gap-0.5 text-green-400 text-xs">
      <TrendingUp className="w-3 h-3" />+{abs}
    </span>
  )
  return (
    <span className="flex items-center gap-0.5 text-red-400 text-xs">
      <TrendingDown className="w-3 h-3" />-{abs}
    </span>
  )
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-yellow-400'
  if (score >= 40) return 'text-orange-400'
  return 'text-red-400'
}

function scoreLabel(score: number): string {
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 55) return 'Fair'
  if (score >= 40) return 'Needs work'
  return 'Low'
}

function OverallRing({ score, prev }: { score: number; prev: number }) {
  const circumference = 2 * Math.PI * 52
  const offset = circumference * (1 - score / 100)
  const delta = Math.round(score - prev)

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="52"
            fill="none"
            stroke={score >= 80 ? '#4ade80' : score >= 60 ? '#facc15' : score >= 40 ? '#fb923c' : '#f87171'}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${scoreColor(score)}`}>{score}</span>
          <span className="text-xs text-text-secondary">/ 100</span>
        </div>
      </div>
      <div className="text-center">
        <p className={`text-sm font-semibold ${scoreColor(score)}`}>{scoreLabel(score)}</p>
        {Math.abs(delta) >= 2 ? (
          <p className={`text-xs mt-0.5 ${delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {delta > 0 ? '+' : ''}{delta} vs last month
          </p>
        ) : (
          <p className="text-xs mt-0.5 text-text-secondary">stable vs last month</p>
        )}
      </div>
    </div>
  )
}

export function FitnessProfileClient({ data }: { data: FitnessProfileData }) {
  const { dimensions, overallScore, prevOverallScore, strengths, improvements } = data

  // Radar chart data uses both current and prev scores
  const radarData = dimensions.map((d) => ({
    dimension: d.shortName,
    Current: d.score,
    Previous: d.prevScore,
  }))

  const sortedDims = [...dimensions].sort((a, b) => b.score - a.score)

  return (
    <div className="space-y-4">

      {/* Overall score + radar */}
      <div className="bg-surface rounded-xl border border-border p-5">
        <p className="text-sm font-semibold text-text-primary mb-4">Overall Fitness Profile</p>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
          <OverallRing score={overallScore} prev={prevOverallScore} />
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} margin={{ top: 4, right: 20, bottom: 4, left: 20 }}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number, name: string) => [`${Math.round(v)}`, name]}
                />
                <Radar
                  name="Previous"
                  dataKey="Previous"
                  stroke="rgba(255,255,255,0.18)"
                  fill="rgba(255,255,255,0.04)"
                  strokeWidth={1}
                  strokeDasharray="3 2"
                />
                <Radar
                  name="Current"
                  dataKey="Current"
                  stroke="#60a5fa"
                  fill="rgba(96,165,250,0.15)"
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 justify-center text-xs text-text-secondary mt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-blue-400 inline-block" /> This month
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-white/30 inline-block border-t border-dashed border-white/30" /> Last month
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dimension cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {dimensions.map((d) => (
          <div key={d.name} className="bg-surface rounded-xl border border-border p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-base">{d.icon}</span>
              <ScoreBadge score={d.score} prev={d.prevScore} />
            </div>
            <p className={`text-xl font-bold ${scoreColor(d.score)}`}>{d.score}</p>
            <p className="text-xs font-medium text-text-primary mt-0.5">{d.name}</p>
            <p className="text-xs text-text-secondary opacity-70 mt-0.5 leading-tight">{d.value}</p>
            <div className="mt-2 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  d.score >= 80 ? 'bg-green-400' : d.score >= 60 ? 'bg-yellow-400' : d.score >= 40 ? 'bg-orange-400' : 'bg-red-400'
                }`}
                style={{ width: `${d.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Score ranking */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-3">Dimension Ranking</p>
        <div className="space-y-2">
          {sortedDims.map((d, i) => (
            <div key={d.name} className="flex items-center gap-3">
              <span className="text-xs text-text-secondary w-4 text-right">{i + 1}</span>
              <span className="text-base w-6">{d.icon}</span>
              <span className="text-sm text-text-primary flex-1">{d.name}</span>
              <div className="flex-1 max-w-[120px] h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    d.score >= 80 ? 'bg-green-400' : d.score >= 60 ? 'bg-yellow-400' : d.score >= 40 ? 'bg-orange-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${d.score}%` }}
                />
              </div>
              <span className={`text-sm font-bold w-8 text-right ${scoreColor(d.score)}`}>{d.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & improvements */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {strengths.length > 0 && (
          <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
            <p className="text-sm font-semibold text-green-400 mb-2">Strengths</p>
            <ul className="space-y-1.5">
              {strengths.map((s, i) => (
                <li key={i} className="text-xs text-text-secondary flex gap-1.5">
                  <span className="text-green-400 shrink-0">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {improvements.length > 0 && (
          <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4">
            <p className="text-sm font-semibold text-orange-400 mb-2">Areas to Focus</p>
            <ul className="space-y-1.5">
              {improvements.map((s, i) => (
                <li key={i} className="text-xs text-text-secondary flex gap-1.5">
                  <span className="text-orange-400 shrink-0">→</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* How scores are calculated */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <p className="text-sm font-semibold text-text-primary mb-2">How Scores Are Calculated</p>
        <div className="space-y-1.5">
          {dimensions.map((d) => (
            <div key={d.name} className="flex gap-2 text-xs text-text-secondary">
              <span className="shrink-0">{d.icon}</span>
              <span><span className="text-text-primary">{d.name}:</span> {d.label}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-text-secondary text-center opacity-40 pb-2">
        Scores based on last 30 days of data · updated daily
      </p>
    </div>
  )
}
