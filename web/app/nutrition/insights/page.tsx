"use client"
import { useState, useEffect } from 'react'

interface InsightsData {
  hasData: boolean
  totalScans: number
  avgScore: number
  gradeDistribution: Record<string, number>
  ultraProcessedPct: number
  topProducts: Array<{ name: string; count: number; grade: string; score: number }>
  dietPattern: string
  bestProducts: Array<{ name: string; grade: string }>
  worstProducts: Array<{ name: string; grade: string }>
  trend: number
  recentAvg: number
  olderAvg: number
}

const GRADE_COLORS: Record<string, string> = {
  'A+': '#22c55e', 'A': '#4ade80', 'B': '#a3e635', 'C': '#facc15', 'D': '#fb923c', 'F': '#ef4444'
}

const DIET_PATTERN_EMOJI: Record<string, string> = {
  'Whole Food': '🥦', 'Mostly Healthy': '🥗', 'Mixed': '🍱',
  'Ultra-Processed Heavy': '🍟', 'Needs Improvement': '⚠️'
}

export default function NutritionInsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/nutrition/insights')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center"><div className="text-4xl mb-3">🔍</div><p className="text-text-secondary">Analyzing your food choices...</p></div>
    </div>
  )

  if (!data?.hasData) return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-8 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">No Scan History Yet</h1>
        <p className="text-text-secondary mb-6">Scan some food products to get personalized nutrition insights</p>
        <a href="/food/scanner" className="bg-primary text-white px-6 py-3 rounded-xl font-semibold inline-block">Go to Food Scanner</a>
      </div>
    </div>
  )

  const trendUp = data.trend > 0
  const trendNeutral = Math.abs(data.trend) < 3

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-8">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Nutrition Insights</h1>
        <p className="text-text-secondary text-sm mb-6">Based on your last 30 days of food scans ({data.totalScans} products)</p>

        {/* Diet Pattern Card */}
        <div className="bg-surface border border-border rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{DIET_PATTERN_EMOJI[data.dietPattern] ?? '🍽️'}</div>
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-wide mb-0.5">Your Diet Pattern</p>
              <h2 className="text-xl font-bold text-text-primary">{data.dietPattern}</h2>
              <p className="text-sm text-text-secondary mt-0.5">Average ZenScore: <span className="font-semibold text-text-primary">{data.avgScore}/100</span></p>
            </div>
          </div>
        </div>

        {/* Trend */}
        <div className={`rounded-2xl p-4 mb-4 border ${trendNeutral ? 'bg-surface border-border' : trendUp ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">{trendNeutral ? '➡️' : trendUp ? '📈' : '📉'}</span>
            <div>
              <p className="font-medium text-text-primary text-sm">
                {trendNeutral ? 'Your diet quality is stable' : trendUp ? `Diet quality improving (+${data.trend} pts this fortnight)` : `Diet quality dipped (${data.trend} pts this fortnight)`}
              </p>
              <p className="text-xs text-text-secondary">Earlier avg: {data.olderAvg} → Recent avg: {data.recentAvg}</p>
            </div>
          </div>
        </div>

        {/* Grade distribution */}
        <div className="bg-surface border border-border rounded-2xl p-5 mb-4">
          <h3 className="font-semibold text-text-primary mb-3">Grade Breakdown</h3>
          <div className="space-y-2">
            {['A+', 'A', 'B', 'C', 'D', 'F'].map(grade => {
              const count = data.gradeDistribution[grade] ?? 0
              const pct = Math.round(count / data.totalScans * 100)
              return (
                <div key={grade} className="flex items-center gap-3">
                  <span className="w-8 text-sm font-bold" style={{ color: GRADE_COLORS[grade] }}>{grade}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: GRADE_COLORS[grade] }} />
                  </div>
                  <span className="text-xs text-text-secondary w-12 text-right">{pct}% ({count})</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Ultra-processed */}
        <div className={`rounded-2xl p-5 mb-4 border ${data.ultraProcessedPct > 40 ? 'bg-red-50 border-red-200' : data.ultraProcessedPct > 20 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-text-primary">Ultra-Processed Foods</h3>
              <p className="text-xs text-text-secondary mt-0.5">NOVA group 4 products scanned</p>
            </div>
            <div className="text-2xl font-bold" style={{ color: data.ultraProcessedPct > 40 ? '#ef4444' : data.ultraProcessedPct > 20 ? '#f59e0b' : '#22c55e' }}>
              {data.ultraProcessedPct}%
            </div>
          </div>
          <p className="text-xs mt-2 text-text-secondary">
            {data.ultraProcessedPct < 20 ? '✅ Excellent — well below the 20% recommended limit' :
             data.ultraProcessedPct < 40 ? '⚠️ Moderate — aim to reduce ultra-processed products' :
             '🔴 High — over 40% of scanned foods are ultra-processed'}
          </p>
        </div>

        {/* Top products */}
        {data.topProducts.length > 0 && (
          <div className="bg-surface border border-border rounded-2xl p-5 mb-4">
            <h3 className="font-semibold text-text-primary mb-3">Most Scanned Products</h3>
            <div className="space-y-2">
              {data.topProducts.map(p => (
                <div key={p.name} className="flex items-center justify-between">
                  <p className="text-sm text-text-primary truncate flex-1">{p.name}</p>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-xs text-text-secondary">×{p.count}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${GRADE_COLORS[p.grade]}20`, color: GRADE_COLORS[p.grade] }}>{p.grade}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Improvement suggestions */}
        {data.worstProducts.length > 0 && (
          <div className="bg-surface border border-border rounded-2xl p-5 mb-4">
            <h3 className="font-semibold text-text-primary mb-1">💡 Consider Swapping</h3>
            <p className="text-xs text-text-secondary mb-3">Your frequently scanned lower-scored products</p>
            {data.worstProducts.map(p => (
              <div key={p.name} className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600">{p.grade}</span>
                <p className="text-sm text-text-primary">{p.name}</p>
              </div>
            ))}
            <a href="/food/scanner" className="text-primary text-sm font-medium">Scan alternatives →</a>
          </div>
        )}

        <div className="bg-surface border border-border rounded-2xl p-4">
          <p className="text-xs text-text-secondary text-center">
            Insights based on Monteiro NOVA classification 2019 · Hu et al. dietary pattern research · Celis-Morales personalization trial
          </p>
        </div>
      </div>
    </div>
  )
}
