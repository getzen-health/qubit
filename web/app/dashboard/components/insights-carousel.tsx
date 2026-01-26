'use client'

import { useState } from 'react'
import { Moon, Activity, Heart, Apple, Zap, TrendingUp, Sparkles, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Insight {
  id: string
  category: string
  title: string
  content: string
  priority: 'low' | 'medium' | 'high'
  actionable?: string
  icon?: string
}

const categoryIcons: Record<string, LucideIcon> = {
  sleep: Moon,
  activity: Activity,
  heart: Heart,
  nutrition: Apple,
  recovery: Zap,
  trend: TrendingUp,
}

const priorityStyles = {
  low: 'border-blue-500 bg-blue-500/10',
  medium: 'border-yellow-500 bg-yellow-500/10',
  high: 'border-red-500 bg-red-500/10',
}

export function InsightsCarousel({ insights }: { insights: Insight[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (insights.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <Sparkles className="w-10 h-10 text-purple-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No insights yet</h3>
        <p className="text-sm text-gray-500 mt-2">Keep syncing your health data to receive AI-powered insights</p>
      </div>
    )
  }

  const currentInsight = insights[currentIndex]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Insights</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{currentIndex + 1} / {insights.length}</span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentIndex(Math.min(insights.length - 1, currentIndex + 1))}
              disabled={currentIndex === insights.length - 1}
              className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className={`border-l-4 rounded-r-xl p-4 ${priorityStyles[currentInsight.priority]}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {(() => {
              const Icon = categoryIcons[currentInsight.category] ?? Sparkles
              return <Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            })()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-gray-500 uppercase">{currentInsight.category}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                currentInsight.priority === 'high' ? 'bg-red-200 text-red-700' :
                currentInsight.priority === 'medium' ? 'bg-yellow-200 text-yellow-700' :
                'bg-blue-200 text-blue-700'
              }`}>
                {currentInsight.priority}
              </span>
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white">{currentInsight.title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{currentInsight.content}</p>
            {currentInsight.actionable && (
              <div className="mt-3 flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span>{currentInsight.actionable}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-4">
        {insights.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentIndex ? 'bg-purple-500 w-4' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export function InsightsList({ insights }: { insights: Insight[] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Insights</h3>

      <div className="space-y-3">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`border-l-4 rounded-r-xl p-4 transition-all hover:translate-x-1 cursor-pointer ${priorityStyles[insight.priority]}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {(() => {
                  const Icon = categoryIcons[insight.category] ?? Sparkles
                  return <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                })()}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-white truncate">{insight.title}</h4>
                <p className="text-sm text-gray-500 truncate">{insight.content}</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
