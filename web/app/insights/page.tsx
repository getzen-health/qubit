'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Activity, Heart, Moon, Zap, Flame, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BottomNav } from '@/components/bottom-nav'

interface Insight {
  id: string
  title: string
  content: string
  category: string
  priority: string
  insight_type: string
  created_at: string
  date: string
  read_at: string | null
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Activity; color: string }> = {
  sleep: { label: 'Sleep', icon: Moon, color: 'text-blue-400' },
  activity: { label: 'Activity', icon: Activity, color: 'text-green-400' },
  heart: { label: 'Heart', icon: Heart, color: 'text-red-400' },
  recovery: { label: 'Recovery', icon: Zap, color: 'text-emerald-400' },
  strain: { label: 'Strain', icon: Flame, color: 'text-orange-400' },
}

const PRIORITY_BADGE: Record<string, string> = {
  high: 'bg-red-500/20 text-red-400',
  normal: 'bg-accent/10 text-accent',
  low: 'bg-surface-secondary text-text-secondary',
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('health_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)
      setInsights(data ?? [])
      setLoading(false)
    })
  }, [])

  const categories = Array.from(new Set(insights.map((i) => i.category).filter(Boolean)))
  const filtered = activeCategory ? insights.filter((i) => i.category === activeCategory) : insights

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Insights</h1>
            <p className="text-sm text-text-secondary">
              {loading ? '…' : `${insights.length} AI-generated insights`}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Category filter chips */}
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setActiveCategory(null)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === null
                  ? 'bg-accent text-white'
                  : 'bg-surface border border-border text-text-secondary hover:bg-surface-secondary'
              }`}
            >
              All
            </button>
            {categories.map((cat) => {
              const cfg = CATEGORY_CONFIG[cat.toLowerCase()]
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === cat
                      ? 'bg-accent text-white'
                      : 'bg-surface border border-border text-text-secondary hover:bg-surface-secondary'
                  }`}
                >
                  {cfg?.label ?? cat}
                </button>
              )
            })}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Sparkles className="w-10 h-10 text-text-secondary mb-4" />
            <h2 className="text-lg font-semibold text-text-primary mb-2">No insights yet</h2>
            <p className="text-sm text-text-secondary">
              Sync data and generate insights from your dashboard to see them here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((insight) => {
              const cat = CATEGORY_CONFIG[insight.category?.toLowerCase()]
              const Icon = cat?.icon ?? Sparkles
              return (
                <div
                  key={insight.id}
                  className="bg-surface rounded-xl border border-border p-4 space-y-2"
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 shrink-0 ${cat?.color ?? 'text-text-secondary'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-text-primary text-sm">{insight.title}</span>
                        {insight.priority && insight.priority !== 'normal' && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_BADGE[insight.priority] ?? PRIORITY_BADGE.normal}`}>
                            {insight.priority}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary leading-relaxed">{insight.content}</p>
                      <p className="text-xs text-text-secondary opacity-60 mt-2">
                        {new Date(insight.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
