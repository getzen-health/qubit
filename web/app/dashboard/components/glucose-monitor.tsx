'use client'

import React, { useState } from 'react'
import React, {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  LineChart,
  Line,
  ComposedChart,
  Bar,
} from 'recharts'

interface GlucoseReading {
  timestamp: string
  value: number // mg/dL
  trend?: 'rising_fast' | 'rising' | 'stable' | 'falling' | 'falling_fast'
}

interface MealMarker {
  timestamp: string
  name: string
  calories: number
  carbs: number
}

interface GlucoseData {
  current: number
  trend: 'rising_fast' | 'rising' | 'stable' | 'falling' | 'falling_fast'
  readings: GlucoseReading[]
  meals?: MealMarker[]
  timeInRange: {
    low: number // percentage < 70
    inRange: number // percentage 70-180
    high: number // percentage > 180
  }
  average: number
  gmi: number // Glucose Management Indicator (estimated A1C)
  variability: number // CV coefficient of variation
}

const GLUCOSE_RANGES = {
  veryLow: 54,
  low: 70,
  targetLow: 70,
  targetHigh: 140,
  high: 180,
  veryHigh: 250,
}

const getTrendArrow = (trend: string) => {
  switch (trend) {
    case 'rising_fast':
      return { arrow: '↑↑', color: '#F97316', label: 'Rising fast' }
    case 'rising':
      return { arrow: '↗', color: '#F59E0B', label: 'Rising' }
    case 'stable':
      return { arrow: '→', color: '#22C55E', label: 'Stable' }
    case 'falling':
      return { arrow: '↘', color: '#3B82F6', label: 'Falling' }
    case 'falling_fast':
      return { arrow: '↓↓', color: '#8B5CF6', label: 'Falling fast' }
    default:
      return { arrow: '→', color: '#6B7280', label: 'Unknown' }
  }
}

const getGlucoseStatus = (value: number) => {
  if (value < GLUCOSE_RANGES.veryLow) return { label: 'Very Low', color: '#DC2626', bg: 'bg-red-500' }
  if (value < GLUCOSE_RANGES.low) return { label: 'Low', color: '#F97316', bg: 'bg-orange-500' }
  if (value <= GLUCOSE_RANGES.targetHigh) return { label: 'In Range', color: '#22C55E', bg: 'bg-green-500' }
  if (value <= GLUCOSE_RANGES.high) return { label: 'Elevated', color: '#F59E0B', bg: 'bg-yellow-500' }
  return { label: 'High', color: '#DC2626', bg: 'bg-red-500' }
}

function CurrentGlucoseComponent({ data }: { data: GlucoseData }) {
  const status = getGlucoseStatus(data.current)
  const trend = getTrendArrow(data.trend)

  return (
    <div className={`${status.bg} rounded-2xl shadow-lg p-6 text-white relative overflow-hidden`}>
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-white/80 uppercase tracking-wide">Current Glucose</h3>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-6xl font-bold">{data.current}</span>
              <span className="text-2xl text-white/70">mg/dL</span>
              <span className="text-4xl" style={{ color: trend.color }}>{trend.arrow}</span>
            </div>
            <p className="text-sm text-white/80 mt-1">{trend.label}</p>
          </div>
          <div className="text-right">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-2">
              <span className="text-3xl">📊</span>
            </div>
            <span className="text-sm text-white/80">{status.label}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
            <div className="text-xl font-bold">{data.average}</div>
            <div className="text-xs text-white/70">Avg (24h)</div>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
            <div className="text-xl font-bold">{data.gmi}%</div>
            <div className="text-xs text-white/70">GMI (A1C)</div>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
            <div className="text-xl font-bold">{data.variability}%</div>
            <div className="text-xs text-white/70">CV</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function GlucoseChartComponent({ data }: { data: GlucoseData }) {
  const chartData = data.readings.map((r) => ({
    time: new Date(r.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    glucose: r.value,
    timestamp: r.timestamp,
  }))

  // Add meal markers to chart data
  const mealsMap = new Map(data.meals?.map((m) => [m.timestamp, m]) || [])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Glucose Trend</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500/30" />
            <span className="text-gray-500">Target Range</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart data={chartData}>
          <defs>
            <linearGradient id="glucoseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Target range background */}
          <ReferenceArea
            y1={GLUCOSE_RANGES.targetLow}
            y2={GLUCOSE_RANGES.targetHigh}
            fill="#22C55E"
            fillOpacity={0.1}
          />

          {/* Reference lines */}
          <ReferenceLine y={GLUCOSE_RANGES.low} stroke="#F97316" strokeDasharray="3 3" />
          <ReferenceLine y={GLUCOSE_RANGES.high} stroke="#F97316" strokeDasharray="3 3" />

          <XAxis dataKey="time" stroke="#9CA3AF" fontSize={10} />
          <YAxis
            stroke="#9CA3AF"
            fontSize={10}
            domain={[40, 250]}
            ticks={[70, 100, 140, 180, 220]}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '12px' }}
            labelStyle={{ color: '#9CA3AF' }}
            formatter={(value: number) => [`${value} mg/dL`, 'Glucose']}
          />

          <Area
            type="monotone"
            dataKey="glucose"
            stroke="#8B5CF6"
            fill="url(#glucoseGradient)"
            strokeWidth={2}
            dot={false}
          />

          {/* Meal markers as bars at bottom */}
          {data.meals?.map((meal, i) => (
            <ReferenceLine
              key={i}
              x={new Date(meal.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              stroke="#EC4899"
              strokeWidth={2}
              label={{ value: '🍽️', position: 'top', fontSize: 16 }}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

function TimeInRangeComponent({ data }: { data: GlucoseData['timeInRange'] }) {
  const segments = [
    { label: 'Low', value: data.low, color: '#F97316', target: '<4%' },
    { label: 'In Range', value: data.inRange, color: '#22C55E', target: '>70%' },
    { label: 'High', value: data.high, color: '#EF4444', target: '<25%' },
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Time in Range</h3>

      {/* Stacked bar */}
      <div className="h-8 rounded-full overflow-hidden flex mb-4">
        {segments.map((seg) => (
          <div
            key={seg.label}
            style={{ width: `${seg.value}%`, backgroundColor: seg.color }}
            className="flex items-center justify-center transition-all"
          >
            {seg.value >= 10 && <span className="text-xs font-bold text-white">{seg.value}%</span>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {segments.map((seg) => (
          <div key={seg.label} className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
              <span className="text-sm text-gray-600 dark:text-gray-400">{seg.label}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: seg.color }}>
              {seg.value}%
            </div>
            <div className="text-xs text-gray-400">Target: {seg.target}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface GlucoseImpact {
  meal: string
  carbs: number
  glucoseBefore: number
  glucosePeak: number
  glucoseAfter2h: number
  peakTime: number // minutes after meal
  recovery: number // minutes to return to baseline
  score: 'excellent' | 'good' | 'moderate' | 'poor'
}

function MealGlucoseImpactComponent({ impacts }: { impacts: GlucoseImpact[] }) {
  const getScoreStyle = (score: string) => {
    switch (score) {
      case 'excellent':
        return { color: '#22C55E', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Minimal spike' }
      case 'good':
        return { color: '#3B82F6', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Low spike' }
      case 'moderate':
        return { color: '#F59E0B', bg: 'bg-yellow-100 dark:bg-yellow-900/30', label: 'Moderate spike' }
      case 'poor':
        return { color: '#EF4444', bg: 'bg-red-100 dark:bg-red-900/30', label: 'High spike' }
      default:
        return { color: '#6B7280', bg: 'bg-gray-100', label: 'Unknown' }
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Meal Impact Analysis</h3>
        <span className="text-sm text-gray-500">Glucose response</span>
      </div>

      <div className="space-y-4">
        {impacts.map((impact, i) => {
          const style = getScoreStyle(impact.score)
          const spike = impact.glucosePeak - impact.glucoseBefore

          return (
            <div key={i} className={`${style.bg} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🍽️</span>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{impact.meal}</div>
                    <div className="text-xs text-gray-500">{impact.carbs}g carbs</div>
                  </div>
                </div>
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: `${style.color}20`, color: style.color }}
                >
                  {style.label}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{impact.glucoseBefore}</div>
                  <div className="text-xs text-gray-500">Before</div>
                </div>
                <div>
                  <div className="text-lg font-bold" style={{ color: style.color }}>
                    +{spike}
                  </div>
                  <div className="text-xs text-gray-500">Spike</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{impact.peakTime}m</div>
                  <div className="text-xs text-gray-500">Peak Time</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{impact.recovery}m</div>
                  <div className="text-xs text-gray-500">Recovery</div>
                </div>
              </div>

              {/* Mini glucose curve visualization */}
              <div className="mt-3 h-8 flex items-end gap-px">
                {Array.from({ length: 12 }).map((_, j) => {
                  // Simulate a glucose response curve
                  const peakIdx = Math.floor(impact.peakTime / 10)
                  const beforePeak = j < peakIdx
                  const height = beforePeak
                    ? 20 + (spike / 2) * (j / peakIdx)
                    : 20 + (spike / 2) * (1 - (j - peakIdx) / (12 - peakIdx))
                  return (
                    <div
                      key={j}
                      className="flex-1 rounded-t transition-all"
                      style={{
                        height: `${Math.max(height, 10)}%`,
                        backgroundColor: j === peakIdx ? style.color : `${style.color}40`,
                      }}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GlucoseInsightsComponent({ data }: { data: GlucoseData }) {
  const insights = []

  // Generate insights based on data
  if (data.timeInRange.inRange >= 70) {
    insights.push({
      type: 'success',
      icon: '🎯',
      title: 'Great glucose control!',
      text: `You're spending ${data.timeInRange.inRange}% of time in range. Keep it up!`,
    })
  }

  if (data.variability > 36) {
    insights.push({
      type: 'warning',
      icon: '📈',
      title: 'High variability detected',
      text: 'Try eating more fiber and protein with carbs to smooth glucose response.',
    })
  }

  if (data.average > 140) {
    insights.push({
      type: 'alert',
      icon: '⚠️',
      title: 'Elevated average glucose',
      text: 'Consider reducing refined carbs and increasing physical activity.',
    })
  }

  insights.push({
    type: 'tip',
    icon: '💡',
    title: 'Pro tip',
    text: 'A 10-minute walk after meals can reduce glucose spikes by up to 30%.',
  })

  const typeStyles = {
    success: 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800',
    warning: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800',
    alert: 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800',
    tip: 'border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Glucose Insights</h3>

      <div className="space-y-3">
        {insights.map((insight, i) => (
          <div
            key={i}
            className={`border rounded-xl p-4 ${typeStyles[insight.type as keyof typeof typeStyles]}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{insight.icon}</span>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{insight.title}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{insight.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CGMConnectionCardComponent() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [connected, setConnected] = useState(false)

  const cgmProviders = [
    { name: 'Dexcom', icon: '💚', color: 'from-green-500 to-emerald-600' },
    { name: 'Libre', icon: '💙', color: 'from-blue-500 to-cyan-600' },
    { name: 'Medtronic', icon: '💜', color: 'from-purple-500 to-indigo-600' },
    { name: 'Manual Entry', icon: '✏️', color: 'from-gray-500 to-gray-600' },
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Connect CGM</h3>
        {connected && (
          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 text-xs rounded-full font-medium">
            Connected
          </span>
        )}
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Connect your continuous glucose monitor to track glucose levels and see how food affects your blood sugar.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {cgmProviders.map((provider) => (
          <button
            key={provider.name}
            onClick={() => {
              setIsConnecting(true)
              setTimeout(() => {
                setIsConnecting(false)
                setConnected(true)
              }, 1500)
            }}
            disabled={isConnecting}
            className={`p-4 rounded-xl bg-gradient-to-br ${provider.color} text-white hover:opacity-90 transition-all hover:scale-105 active:scale-95 disabled:opacity-50`}
          >
            <div className="text-2xl mb-2">{provider.icon}</div>
            <div className="text-sm font-medium">{provider.name}</div>
          </button>
        ))}
      </div>

      {isConnecting && (
        <div className="mt-4 flex items-center justify-center gap-2 text-purple-500">
          <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full" />
          <span className="text-sm">Connecting...</span>
        </div>
      )}
    </div>
  )
}

function DailyGlucosePatternComponent({ readings }: { readings: GlucoseReading[] }) {
  // Group readings by hour and calculate averages
  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const hourReadings = readings.filter((r) => new Date(r.timestamp).getHours() === hour)
    const avg = hourReadings.length > 0 ? hourReadings.reduce((sum, r) => sum + r.value, 0) / hourReadings.length : null
    return {
      hour: `${hour}:00`,
      average: avg ? Math.round(avg) : null,
      min: hourReadings.length > 0 ? Math.min(...hourReadings.map((r) => r.value)) : null,
      max: hourReadings.length > 0 ? Math.max(...hourReadings.map((r) => r.value)) : null,
    }
  }).filter((d) => d.average !== null)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daily Pattern</h3>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={hourlyData}>
          <defs>
            <linearGradient id="patternGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <ReferenceArea y1={70} y2={140} fill="#22C55E" fillOpacity={0.1} />
          <XAxis dataKey="hour" stroke="#9CA3AF" fontSize={10} />
          <YAxis stroke="#9CA3AF" fontSize={10} domain={[60, 200]} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
            formatter={(value: number) => [`${value} mg/dL`, 'Average']}
          />
          <Area type="monotone" dataKey="average" stroke="#8B5CF6" fill="url(#patternGradient)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Morning Avg</div>
          <div className="font-bold text-gray-900 dark:text-white">
            {Math.round(
              hourlyData
                .filter((d) => parseInt(d.hour) >= 6 && parseInt(d.hour) < 12)
                .reduce((sum, d) => sum + (d.average || 0), 0) /
                hourlyData.filter((d) => parseInt(d.hour) >= 6 && parseInt(d.hour) < 12).length || 0
            ) || '-'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Afternoon Avg</div>
          <div className="font-bold text-gray-900 dark:text-white">
            {Math.round(
              hourlyData
                .filter((d) => parseInt(d.hour) >= 12 && parseInt(d.hour) < 18)
                .reduce((sum, d) => sum + (d.average || 0), 0) /
                hourlyData.filter((d) => parseInt(d.hour) >= 12 && parseInt(d.hour) < 18).length || 0
            ) || '-'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Evening Avg</div>
          <div className="font-bold text-gray-900 dark:text-white">
            {Math.round(
              hourlyData
                .filter((d) => parseInt(d.hour) >= 18 || parseInt(d.hour) < 6)
                .reduce((sum, d) => sum + (d.average || 0), 0) /
                hourlyData.filter((d) => parseInt(d.hour) >= 18 || parseInt(d.hour) < 6).length || 0
            ) || '-'}
          </div>
        </div>
      </div>
    </div>
  )
}

export const CurrentGlucose = React.memo(CurrentGlucoseComponent)
export const GlucoseChart = React.memo(GlucoseChartComponent)
export const TimeInRange = React.memo(TimeInRangeComponent)
export const MealGlucoseImpact = React.memo(MealGlucoseImpactComponent)
export const GlucoseInsights = React.memo(GlucoseInsightsComponent)
export const CGMConnectionCard = React.memo(CGMConnectionCardComponent)
export const DailyGlucosePattern = React.memo(DailyGlucosePatternComponent)
