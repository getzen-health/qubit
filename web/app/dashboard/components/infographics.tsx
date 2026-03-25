'use client'

import React, { useState } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts'

// ============================================
// PERSONAL RECORDS & MILESTONES
// ============================================

interface PersonalRecord {
  metric: string
  value: number
  unit: string
  date: string
  icon: string
  previousBest?: number
  improvement?: number
}

function PersonalRecordsComponent({ records }: { records: PersonalRecord[] }) {
  return (
    <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span className="text-2xl">🏆</span> Personal Records
        </h3>
        <span className="text-sm text-white/70">All-time bests</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {records.map((record, i) => (
          <div key={i} className="bg-white/15 backdrop-blur rounded-xl p-4 relative overflow-hidden">
            <div className="absolute -right-2 -top-2 text-4xl opacity-20">{record.icon}</div>
            <div className="relative">
              <div className="text-xs text-white/70 mb-1">{record.metric}</div>
              <div className="text-2xl font-bold">
                {record.value.toLocaleString()}
                <span className="text-sm font-normal ml-1">{record.unit}</span>
              </div>
              <div className="text-xs text-white/60 mt-1">{record.date}</div>
              {record.improvement && (
                <div className="mt-2 text-xs bg-white/20 rounded-full px-2 py-0.5 inline-block">
                  +{record.improvement}% from previous
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// STAT SUMMARY CARDS WITH SPARKLINES
// ============================================

interface StatCardData {
  label: string
  value: number
  unit: string
  change: number
  changeLabel: string
  sparkline: number[]
  color: string
  icon: string
}

function StatCardsComponent({ stats }: { stats: StatCardData[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 relative overflow-hidden">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value.toLocaleString()}
                <span className="text-sm font-normal text-gray-500 ml-1">{stat.unit}</span>
              </div>
            </div>
            <div className="text-2xl">{stat.icon}</div>
          </div>

          <div className="h-12 mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stat.sparkline.map((v, i) => ({ i, v }))}>
                <defs>
                  <linearGradient id={`gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stat.color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={stat.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={stat.color} fill={`url(#gradient-${i})`} strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className={`text-xs font-medium ${stat.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {stat.change >= 0 ? '↑' : '↓'} {Math.abs(stat.change)}% {stat.changeLabel}
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================
// CORRELATION MATRIX
// ============================================

interface CorrelationData {
  metrics: string[]
  correlations: number[][] // -1 to 1
}

function CorrelationMatrixComponent({ data }: { data: CorrelationData }) {
  const getColor = (value: number) => {
    if (value > 0.7) return 'bg-green-500'
    if (value > 0.3) return 'bg-green-300'
    if (value > 0) return 'bg-green-100'
    if (value > -0.3) return 'bg-red-100'
    if (value > -0.7) return 'bg-red-300'
    return 'bg-red-500'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Metric Correlations</h3>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-500" /> Strong +</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-500" /> Strong -</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Header row */}
          <div className="flex">
            <div className="w-24" />
            {data.metrics.map((m, i) => (
              <div key={i} className="w-16 text-xs text-gray-500 text-center truncate px-1" title={m}>
                {m.slice(0, 8)}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {data.correlations.map((row, i) => (
            <div key={i} className="flex items-center">
              <div className="w-24 text-xs text-gray-600 dark:text-gray-400 truncate pr-2" title={data.metrics[i]}>
                {data.metrics[i]}
              </div>
              {row.map((value, j) => (
                <div key={j} className="w-16 h-12 p-1">
                  <div
                    className={`w-full h-full rounded-lg ${getColor(value)} flex items-center justify-center text-xs font-medium ${
                      Math.abs(value) > 0.5 ? 'text-white' : 'text-gray-700'
                    }`}
                    title={`${data.metrics[i]} vs ${data.metrics[j]}: ${value.toFixed(2)}`}
                  >
                    {i === j ? '—' : value.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
        <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Key Insight</div>
        <p className="text-xs text-purple-600 dark:text-purple-400">
          Your sleep quality strongly correlates with next-day HRV (+0.8) and recovery score (+0.7). Prioritize sleep for better performance.
        </p>
      </div>
    </div>
  )
}

// ============================================
// PERCENTILE RANKINGS
// ============================================

interface PercentileData {
  metric: string
  value: number
  unit: string
  percentile: number
  demographic: string
  icon: string
}

function PercentileRankingsComponent({ rankings }: { rankings: PercentileData[] }) {
  const getPercentileStyle = (p: number) => {
    if (p >= 90) return { color: '#22C55E', label: 'Elite', bg: 'bg-green-500' }
    if (p >= 75) return { color: '#3B82F6', label: 'Excellent', bg: 'bg-blue-500' }
    if (p >= 50) return { color: '#F59E0B', label: 'Above Avg', bg: 'bg-yellow-500' }
    if (p >= 25) return { color: '#F97316', label: 'Average', bg: 'bg-orange-500' }
    return { color: '#EF4444', label: 'Below Avg', bg: 'bg-red-500' }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">How You Compare</h3>
        <span className="text-xs text-gray-500">vs. similar demographics</span>
      </div>

      <div className="space-y-4">
        {rankings.map((r, i) => {
          const style = getPercentileStyle(r.percentile)
          return (
            <div key={i} className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{r.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{r.metric}</div>
                    <div className="text-xs text-gray-500">{r.value} {r.unit}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold" style={{ color: style.color }}>
                    Top {100 - r.percentile}%
                  </div>
                  <div className="text-xs text-gray-500">{style.label}</div>
                </div>
              </div>

              {/* Percentile bar */}
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${style.bg} transition-all duration-1000`}
                  style={{ width: `${r.percentile}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// MONTHLY REVIEW CARD
// ============================================

interface MonthlyReviewData {
  month: string
  highlights: { label: string; value: string; icon: string; change?: number }[]
  topDay: { date: string; metric: string; value: string }
  totalActive: number
  avgDaily: { steps: number; calories: number; sleep: number }
  streakDays: number
  achievements: string[]
}

function MonthlyReviewComponent({ data }: { data: MonthlyReviewData }) {
  return (
    <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 400 400">
          <circle cx="350" cy="50" r="100" fill="white" />
          <circle cx="50" cy="350" r="80" fill="white" />
        </svg>
      </div>

      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-sm text-white/70 uppercase tracking-wide">Monthly Review</div>
            <h3 className="text-2xl font-bold">{data.month}</h3>
          </div>
          <div className="text-4xl">📊</div>
        </div>

        {/* Highlights Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {data.highlights.map((h, i) => (
            <div key={i} className="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">{h.icon}</div>
              <div className="text-xl font-bold">{h.value}</div>
              <div className="text-xs text-white/70">{h.label}</div>
              {h.change !== undefined && (
                <div className={`text-xs mt-1 ${h.change >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {h.change >= 0 ? '↑' : '↓'} {Math.abs(h.change)}%
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Best Day */}
        <div className="bg-white/10 rounded-xl p-4 mb-4">
          <div className="text-xs text-white/70 mb-1">🌟 Best Day</div>
          <div className="flex items-center justify-between">
            <span className="font-medium">{data.topDay.date}</span>
            <span className="text-lg font-bold">{data.topDay.value} {data.topDay.metric}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-center border-t border-white/20 pt-4">
          <div>
            <div className="text-xl font-bold">{data.totalActive}</div>
            <div className="text-xs text-white/70">Active Days</div>
          </div>
          <div>
            <div className="text-xl font-bold">{data.streakDays}</div>
            <div className="text-xs text-white/70">Best Streak</div>
          </div>
          <div>
            <div className="text-xl font-bold">{data.achievements.length}</div>
            <div className="text-xs text-white/70">Achievements</div>
          </div>
        </div>

        {/* Achievements */}
        {data.achievements.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {data.achievements.map((a, i) => (
              <span key={i} className="text-2xl" title={a}>{a}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// TREND PREDICTIONS
// ============================================

interface PredictionData {
  metric: string
  current: number
  predicted: number
  confidence: number
  trend: 'up' | 'down' | 'stable'
  timeframe: string
  historicalData: { date: string; actual: number; predicted?: number }[]
}

function TrendPredictionComponent({ data }: { data: PredictionData }) {
  const trendColors = {
    up: '#22C55E',
    down: '#EF4444',
    stable: '#3B82F6',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Prediction</h3>
        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs rounded-full">
          {data.confidence}% confidence
        </span>
      </div>

      <div className="flex items-center gap-6 mb-6">
        <div>
          <div className="text-sm text-gray-500">Current {data.metric}</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{data.current}</div>
        </div>
        <div className="text-3xl" style={{ color: trendColors[data.trend] }}>
          {data.trend === 'up' ? '→' : data.trend === 'down' ? '→' : '→'}
        </div>
        <div>
          <div className="text-sm text-gray-500">Predicted ({data.timeframe})</div>
          <div className="text-3xl font-bold" style={{ color: trendColors[data.trend] }}>
            {data.predicted}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={150}>
        <AreaChart data={data.historicalData}>
          <defs>
            <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="predictedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22C55E" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} />
          <YAxis stroke="#9CA3AF" fontSize={10} />
          <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
          <Area type="monotone" dataKey="actual" stroke="#8B5CF6" fill="url(#actualGradient)" strokeWidth={2} />
          <Area type="monotone" dataKey="predicted" stroke="#22C55E" fill="url(#predictedGradient)" strokeWidth={2} strokeDasharray="5 5" />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex justify-center gap-6 mt-2">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-0.5 bg-purple-500" />
          <span className="text-gray-500">Actual</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-0.5 bg-green-500 border-dashed" style={{ borderTop: '2px dashed #22C55E' }} />
          <span className="text-gray-500">Predicted</span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// SHAREABLE STAT CARD
// ============================================

interface ShareableCardData {
  metric: string
  value: number
  unit: string
  achievement: string
  date: string
  comparison: string
  gradient: string
}

function ShareableStatCardComponent({ data }: { data: ShareableCardData }) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    // In a real app, this would generate an image
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`bg-gradient-to-br ${data.gradient} rounded-2xl shadow-lg p-6 text-white relative overflow-hidden`}>
      {/* Watermark */}
      <div className="absolute bottom-2 right-4 text-white/30 text-xs font-medium">
        quarks.health
      </div>

      <div className="relative">
        <div className="text-sm text-white/70 uppercase tracking-wide mb-2">{data.date}</div>
        <div className="text-5xl font-bold mb-1">
          {data.value.toLocaleString()}
          <span className="text-xl font-normal ml-2">{data.unit}</span>
        </div>
        <div className="text-lg font-medium mb-4">{data.metric}</div>

        <div className="bg-white/20 backdrop-blur rounded-xl p-3 mb-4">
          <div className="text-sm">{data.achievement}</div>
          <div className="text-xs text-white/70 mt-1">{data.comparison}</div>
        </div>

        <button
          onClick={handleShare}
          className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2"
        >
          {copied ? (
            <>✓ Copied to clipboard</>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share This Achievement
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ============================================
// HEALTH TIMELINE
// ============================================

interface TimelineEvent {
  time: string
  type: 'activity' | 'meal' | 'sleep' | 'health' | 'achievement'
  title: string
  description: string
  value?: string
  icon: string
}

function HealthTimelineComponent({ events }: { events: TimelineEvent[] }) {
  const typeStyles = {
    activity: 'bg-green-500',
    meal: 'bg-orange-500',
    sleep: 'bg-indigo-500',
    health: 'bg-red-500',
    achievement: 'bg-yellow-500',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Today's Timeline</h3>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

        <div className="space-y-4">
          {events.map((event, i) => (
            <div key={i} className="relative flex gap-4">
              {/* Dot */}
              <div className={`w-8 h-8 rounded-full ${typeStyles[event.type]} flex items-center justify-center text-white text-sm z-10`}>
                {event.icon}
              </div>

              {/* Content */}
              <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{event.title}</span>
                  <span className="text-xs text-gray-500">{event.time}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{event.description}</p>
                {event.value && (
                  <div className="mt-2 text-sm font-bold text-purple-500">{event.value}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================
// DATA EXPLORER
// ============================================

interface DataPoint {
  date: string
  [key: string]: number | string
}

function DataExplorerComponent({ data, metrics }: { data: DataPoint[]; metrics: { key: string; label: string; color: string }[] }) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([metrics[0]?.key || ''])
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  const toggleMetric = (key: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Explorer</h3>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                timeRange === range
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Metric toggles */}
      <div className="flex flex-wrap gap-2 mb-4">
        {metrics.map((m) => (
          <button
            key={m.key}
            onClick={() => toggleMetric(m.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-2 ${
              selectedMetrics.includes(m.key)
                ? 'text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            style={selectedMetrics.includes(m.key) ? { backgroundColor: m.color } : {}}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: m.color }}
            />
            {m.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} />
          <YAxis stroke="#9CA3AF" fontSize={10} />
          <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
          {metrics
            .filter((m) => selectedMetrics.includes(m.key))
            .map((m) => (
              <Line
                key={m.key}
                type="monotone"
                dataKey={m.key}
                stroke={m.color}
                strokeWidth={2}
                dot={false}
                name={m.label}
              />
            ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Stats summary */}
      <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        {selectedMetrics.slice(0, 4).map((key) => {
          const metric = metrics.find((m) => m.key === key)
          const values = data.map((d) => Number(d[key]) || 0)
          const avg = values.reduce((a, b) => a + b, 0) / values.length
          const min = Math.min(...values)
          const max = Math.max(...values)

          return (
            <div key={key} className="text-center">
              <div className="text-xs text-gray-500 mb-1">{metric?.label}</div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">{avg.toFixed(0)} avg</div>
              <div className="text-xs text-gray-400">{min} - {max}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// LIFETIME STATS
// ============================================

interface LifetimeStats {
  totalSteps: number
  totalCalories: number
  totalDistance: number
  totalWorkouts: number
  totalSleepHours: number
  memberSince: string
  activeDays: number
  longestStreak: number
}

function LifetimeStatsCardComponent({ stats }: { stats: LifetimeStats }) {
  const formatLargeNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-lg p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Lifetime Stats</h3>
          <div className="text-xs text-gray-400">Member since {stats.memberSince}</div>
        </div>
        <div className="text-3xl">🏅</div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/10 rounded-xl p-4">
          <div className="text-3xl font-bold text-green-400">{formatLargeNumber(stats.totalSteps)}</div>
          <div className="text-xs text-gray-400">Total Steps</div>
        </div>
        <div className="bg-white/10 rounded-xl p-4">
          <div className="text-3xl font-bold text-orange-400">{formatLargeNumber(stats.totalCalories)}</div>
          <div className="text-xs text-gray-400">Calories Burned</div>
        </div>
        <div className="bg-white/10 rounded-xl p-4">
          <div className="text-3xl font-bold text-blue-400">{formatLargeNumber(stats.totalDistance)}</div>
          <div className="text-xs text-gray-400">km Traveled</div>
        </div>
        <div className="bg-white/10 rounded-xl p-4">
          <div className="text-3xl font-bold text-purple-400">{stats.totalWorkouts}</div>
          <div className="text-xs text-gray-400">Workouts</div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
        <div className="text-center">
          <div className="text-xl font-bold">{stats.activeDays}</div>
          <div className="text-xs text-gray-400">Active Days</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold">{stats.longestStreak}</div>
          <div className="text-xs text-gray-400">Longest Streak</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold">{Math.round(stats.totalSleepHours)}</div>
          <div className="text-xs text-gray-400">Hours Slept</div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// COMPARISON CARDS
// ============================================

interface ComparisonData {
  metric: string
  current: number
  previous: number
  unit: string
  icon: string
}

function ComparisonCardsComponent({ comparisons, periodLabel }: { comparisons: ComparisonData[]; periodLabel: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">vs. {periodLabel}</h3>
      </div>

      <div className="space-y-4">
        {comparisons.map((c, i) => {
          const change = ((c.current - c.previous) / c.previous) * 100
          const isPositive = change >= 0

          return (
            <div key={i} className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl">
                {c.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500">{c.metric}</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {c.current.toLocaleString()} {c.unit}
                  </span>
                  <span className="text-sm text-gray-400">
                    vs {c.previous.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className={`text-right ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                <div className="text-lg font-bold">{isPositive ? '+' : ''}{change.toFixed(1)}%</div>
                <div className="text-xs">{isPositive ? '↑' : '↓'}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const PersonalRecords = React.memo(PersonalRecordsComponent)
export const StatCards = React.memo(StatCardsComponent)
export const CorrelationMatrix = React.memo(CorrelationMatrixComponent)
export const PercentileRankings = React.memo(PercentileRankingsComponent)
export const MonthlyReview = React.memo(MonthlyReviewComponent)
export const TrendPrediction = React.memo(TrendPredictionComponent)
export const ShareableStatCard = React.memo(ShareableStatCardComponent)
export const HealthTimeline = React.memo(HealthTimelineComponent)
export const DataExplorer = React.memo(DataExplorerComponent)
export const LifetimeStatsCard = React.memo(LifetimeStatsCardComponent)
export const ComparisonCards = React.memo(ComparisonCardsComponent)
