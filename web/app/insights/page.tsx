'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Activity, Heart, Moon, Zap, Flame, Sparkles, RefreshCw, Smile } from 'lucide-react'
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
  wellbeing: { label: 'Wellbeing', icon: Smile, color: 'text-teal-400' },
}

const PRIORITY_BADGE: Record<string, string> = {
  high: 'bg-red-500/20 text-red-400',
  normal: 'bg-accent/10 text-accent',
  low: 'bg-surface-secondary text-text-secondary',
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [cooldownSecs, setCooldownSecs] = useState(0)
  const supabase = createClient()

  const fetchInsights = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('health_insights')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)
    setInsights(data ?? [])
  }, [supabase])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      await fetchInsights(user.id)
      setLoading(false)
    })
  }, [fetchInsights, supabase.auth])

  const handleGenerate = async () => {
    if (cooldownSecs > 0 || generating) return
    setGenerating(true)
    setGenerateError(null)
    // Start 60-second cooldown to prevent quota exhaustion
    setCooldownSecs(60)
    const tick = setInterval(() => {
      setCooldownSecs((s) => {
        if (s <= 1) { clearInterval(tick); return 0 }
        return s - 1
      })
    }, 1000)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not signed in')

      const [{ data: summaries }, { data: workouts }, { data: sleepRecords }] = await Promise.all([
        supabase
          .from('daily_summaries')
          .select('date, steps, active_calories, distance_meters, floors_climbed, active_minutes, resting_heart_rate, avg_hrv, sleep_duration_minutes, recovery_score, strain_score')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(8),
        supabase
          .from('workout_records')
          .select('workout_type, duration_minutes, active_calories, avg_heart_rate')
          .eq('user_id', user.id)
          .order('start_time', { ascending: false })
          .limit(5),
        supabase
          .from('sleep_records')
          .select('duration_minutes, deep_minutes, rem_minutes, core_minutes, awake_minutes')
          .eq('user_id', user.id)
          .order('start_time', { ascending: false })
          .limit(3),
      ])

      const today = summaries?.[0]
      if (!today) throw new Error('No health data found. Sync your data from the iOS app first.')

      const healthContext = {
        dailySummary: {
          date: today.date,
          steps: today.steps ?? 0,
          distanceMeters: today.distance_meters ?? 0,
          activeCalories: today.active_calories ?? 0,
          totalCalories: today.active_calories ?? 0,
          floorsClimbed: today.floors_climbed ?? 0,
          restingHeartRate: today.resting_heart_rate ?? null,
          avgHrv: today.avg_hrv ?? null,
          sleepDurationMinutes: today.sleep_duration_minutes ?? null,
          sleepQualityScore: null,
          activeMinutes: (today as Record<string, number>).active_minutes ?? 0,
        },
        weekHistory: (summaries ?? []).slice(1).map((s) => ({
          date: s.date,
          steps: s.steps ?? 0,
          activeCalories: s.active_calories ?? 0,
          restingHeartRate: s.resting_heart_rate ?? null,
          avgHrv: s.avg_hrv ?? null,
          sleepDurationMinutes: s.sleep_duration_minutes ?? null,
        })),
        recentWorkouts: (workouts ?? []).map((w) => ({
          workoutType: w.workout_type,
          durationMinutes: w.duration_minutes ?? 0,
          activeCalories: w.active_calories ?? null,
          avgHeartRate: w.avg_heart_rate ?? null,
        })),
        recentSleep: (sleepRecords ?? []).map((s) => ({
          durationMinutes: s.duration_minutes ?? 0,
          deepMinutes: s.deep_minutes ?? 0,
          remMinutes: s.rem_minutes ?? 0,
          coreMinutes: s.core_minutes ?? 0,
          awakeMinutes: s.awake_minutes ?? 0,
        })),
      }

      const userApiKey = typeof window !== 'undefined'
        ? localStorage.getItem('kquarks_claude_api_key') ?? undefined
        : undefined

      const stepGoalRaw = localStorage.getItem('kquarks_step_goal')
      const calGoalRaw = localStorage.getItem('kquarks_calorie_goal')
      const sleepGoalRaw = localStorage.getItem('kquarks_sleep_goal_minutes')
      const userGoals = {
        stepGoal: stepGoalRaw ? parseInt(stepGoalRaw, 10) || 10000 : 10000,
        calorieGoal: calGoalRaw ? parseInt(calGoalRaw, 10) || 500 : 500,
        sleepGoalMinutes: sleepGoalRaw ? parseInt(sleepGoalRaw, 10) || 480 : 480,
      }

      const { error } = await supabase.functions.invoke('generate-insights', {
        body: { healthContext: { ...healthContext, userGoals }, userApiKey },
      })

      if (error) throw new Error(error.message ?? 'Generation failed')

      await fetchInsights(user.id)
    } catch (err: unknown) {
      setGenerateError(err instanceof Error ? err.message : 'Failed to generate insights')
    } finally {
      setGenerating(false)
    }
  }

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
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary">Insights</h1>
<div className="mb-4">
  <Link href="/insights/correlations" className="block bg-surface border border-primary/30 rounded-xl p-4 hover:bg-primary/10 transition-colors">
    <div className="flex items-center gap-3">
      <span className="text-primary font-bold text-lg">Mood Correlations &rarr;</span>
      <span className="text-xs text-text-secondary">See how your mood relates to sleep and steps</span>
    </div>
  </Link>
</div>
<div className="mb-4">
  <Link href="/insights/benchmarks" className="block bg-surface border border-primary/30 rounded-xl p-4 hover:bg-primary/10 transition-colors">
    <div className="flex items-center gap-3">
      <span className="text-primary font-bold text-lg">📊 Benchmarks &rarr;</span>
      <span className="text-xs text-text-secondary">Compare your stats to your age group</span>
    </div>
  </Link>
</div>
            <p className="text-sm text-text-secondary">
              {loading ? '…' : `${insights.length} AI-generated insights`}
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating || loading || cooldownSecs > 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {generating
              ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              : <Sparkles className="w-3.5 h-3.5" />}
            {generating ? 'Generating…' : cooldownSecs > 0 ? `Wait ${cooldownSecs}s` : 'Generate'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4 pb-24">
        {/* Smart Nudges banner */}
        <Link
          href="/nudges"
          className="flex items-center gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl hover:bg-purple-500/15 transition-colors"
        >
          <span className="text-xl">🎯</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-purple-300 leading-tight">Smart Nudges</p>
            <p className="text-xs text-text-secondary opacity-70">Algorithmic recommendations from your data · No AI needed</p>
          </div>
          <span className="text-text-secondary text-xs">→</span>
        </Link>

        {generateError && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {generateError}
          </div>
        )}

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
            <p className="text-sm text-text-secondary mb-6">
              Tap &ldquo;Generate&rdquo; above to get AI-powered insights about your health patterns.
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              Generate Insights
            </button>
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
