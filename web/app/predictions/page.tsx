'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Shield,
  Zap,
  Calendar,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface Prediction {
  recovery_forecast: string
  performance_window: string
  caution_flags: string
  generated_at: string | null
  week_of: string
}

interface HRVPoint {
  day: string
  hrv: number | null
  upper: number | null
  lower: number | null
  projected: boolean
}

export default function PredictionsPage() {
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [hrvData, setHrvData] = useState<HRVPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    // Fetch latest prediction
    const predRes = await fetch('/api/predictions')
    if (predRes.ok) {
      const { prediction: p } = await predRes.json()
      setPrediction(p ?? null)
    }

    // Fetch last 14 days of HRV for trend + projection
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const since = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10)
      const { data: summaries } = await supabase
        .from('daily_summaries')
        .select('date, avg_hrv')
        .eq('user_id', user.id)
        .gte('date', since)
        .order('date', { ascending: true })
        .limit(14)

      if (summaries && summaries.length >= 3) {
        const recent = summaries.slice(-7)
        const avgHrv =
          recent.reduce((s: number, r: { avg_hrv: number | null }) => s + (r.avg_hrv ?? 0), 0) /
          recent.filter((r: { avg_hrv: number | null }) => r.avg_hrv != null).length

        const points: HRVPoint[] = summaries.map((r: { date: string; avg_hrv: number | null }) => ({
          day: new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          hrv: r.avg_hrv,
          upper: r.avg_hrv != null ? Math.round(r.avg_hrv * 1.15) : null,
          lower: r.avg_hrv != null ? Math.round(r.avg_hrv * 0.85) : null,
          projected: false,
        }))

        // Add 7-day projection
        const lastDate = new Date(summaries[summaries.length - 1].date)
        for (let i = 1; i <= 7; i++) {
          const d = new Date(lastDate)
          d.setDate(d.getDate() + i)
          const projected = Math.round(avgHrv + (Math.sin(i * 0.8) * avgHrv * 0.08))
          points.push({
            day: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            hrv: null,
            upper: Math.round(projected * 1.18),
            lower: Math.round(projected * 0.82),
            projected: true,
          })
        }
        setHrvData(points)
      }
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    const res = await fetch('/api/predictions', { method: 'POST' })
    if (res.ok) {
      await loadData()
    } else {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Failed to generate prediction. Try again later.')
    }
    setGenerating(false)
  }

  const todayIdx = hrvData.findIndex((p) => p.projected)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 -ml-2 rounded-lg hover:bg-surface-secondary transition-colors">
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </Link>
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h1 className="text-xl font-bold text-text-primary">Week Ahead</h1>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 text-sm font-medium text-accent hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Generating…' : 'Refresh'}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* HRV Forecast Chart */}
        {hrvData.length > 0 && (
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-semibold text-text-primary">HRV Trend + 7-Day Forecast</h2>
            </div>
            <div className="flex gap-4 mb-3 text-xs text-text-secondary">
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-purple-400 inline-block" /> Actual
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-purple-400/40 border-dashed border-t border-purple-400/60 inline-block" /> Projected ±18%
              </span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={hrvData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                  interval={3}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number, name: string) => {
                    if (name === 'hrv') return [`${value} ms`, 'HRV']
                    if (name === 'upper') return [`${value} ms`, 'Upper band']
                    if (name === 'lower') return [`${value} ms`, 'Lower band']
                    return [value, name]
                  }}
                />
                {todayIdx > 0 && (
                  <ReferenceLine
                    x={hrvData[todayIdx - 1]?.day}
                    stroke="rgba(168,85,247,0.4)"
                    strokeDasharray="4 2"
                    label={{ value: 'Today', fontSize: 10, fill: 'var(--text-secondary)', position: 'insideTopRight' }}
                  />
                )}
                {/* Confidence band (projected) */}
                <Area
                  type="monotone"
                  dataKey="upper"
                  stroke="none"
                  fill="url(#projGrad)"
                  strokeDasharray="4 2"
                  dot={false}
                  activeDot={false}
                />
                <Area
                  type="monotone"
                  dataKey="lower"
                  stroke="none"
                  fill="white"
                  fillOpacity={0}
                  dot={false}
                  activeDot={false}
                />
                {/* Actual HRV line */}
                <Area
                  type="monotone"
                  dataKey="hrv"
                  stroke="#a855f7"
                  strokeWidth={2}
                  fill="url(#actualGrad)"
                  dot={false}
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {prediction ? (
          <>
            {prediction.week_of && (
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <Calendar className="w-3.5 h-3.5" />
                Week of {new Date(prediction.week_of).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                {prediction.generated_at && (
                  <span className="ml-auto">
                    Updated {new Date(prediction.generated_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}

            {/* Recovery Forecast */}
            <div className="bg-surface rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <h2 className="text-sm font-semibold text-text-primary">Recovery Forecast</h2>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">{prediction.recovery_forecast}</p>
            </div>

            {/* Best Training Window */}
            <div className="bg-surface rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-blue-400" />
                </div>
                <h2 className="text-sm font-semibold text-text-primary">Best Training Window</h2>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">{prediction.performance_window}</p>
            </div>

            {/* Caution Flags */}
            <div className="bg-surface rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  prediction.caution_flags?.trim()
                    ? 'bg-orange-500/10'
                    : 'bg-green-500/10'
                }`}>
                  <Shield className={`w-4 h-4 ${
                    prediction.caution_flags?.trim() ? 'text-orange-400' : 'text-green-400'
                  }`} />
                </div>
                <h2 className="text-sm font-semibold text-text-primary">Watch Out</h2>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                {prediction.caution_flags?.trim() || 'All clear — no risk factors detected this week.'}
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-5 py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-1">No prediction yet</h2>
              <p className="text-sm text-text-secondary max-w-xs">
                Generate your first prediction. We&apos;ll analyse 90 days of biometric data to forecast your week ahead.
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 bg-accent text-white font-semibold px-6 py-3 rounded-xl transition-opacity disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" />
              {generating ? 'Generating…' : 'Generate Prediction'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
