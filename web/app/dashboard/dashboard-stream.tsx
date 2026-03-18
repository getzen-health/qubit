'use client'

/**
 * Stream-Based Dashboard
 * Minimalistic, AI-first, expandable metrics layout
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Activity,
  Heart,
  Moon,
  Flame,
  Route,
  Zap,
  TrendingUp,
  Target,
  LogOut,
  Settings,
  Sparkles,
  Scale,
  Trophy,
  BedDouble,
  Lightbulb,
  CalendarDays,
} from 'lucide-react'
import Link from 'next/link'
import {
  AIEssence,
  MetricRow,
  DataStream,
  DataStreamSection,
  DataStreamDivider,
  QuickStatsGrid,
  QuickStat,
  InsightsStream,
  InsightCard,
  EmptyState,
} from './components/layout'
import { cn } from '@/lib/utils'
import { WeeklyCharts } from './components/weekly-charts'

const DEFAULT_STEP_GOAL = 10000
const DEFAULT_CAL_GOAL = 500

interface DashboardStreamProps {
  user: {
    id: string
    email?: string
  }
  profile: {
    display_name?: string
    avatar_url?: string
  } | null
  summaries: Array<{
    date: string
    steps: number
    active_calories: number
    distance_meters: number
    floors_climbed: number
    sleep_duration_minutes?: number
    resting_heart_rate?: number
    avg_hrv?: number
    recovery_score?: number
    strain_score?: number
    weight_kg?: number
  }>
  insights: Array<{
    id: string
    title: string
    content: string
    category: string
    priority: string
    created_at: string
  }>
  weeklyWorkoutCount: number
  workoutStreak: number
}

export function DashboardStream({
  user,
  profile,
  summaries,
  insights,
  weeklyWorkoutCount,
  workoutStreak,
}: DashboardStreamProps) {
  const router = useRouter()
  const supabase = createClient()

  const [stepGoal, setStepGoal] = useState(DEFAULT_STEP_GOAL)
  const [calGoal, setCalGoal] = useState(DEFAULT_CAL_GOAL)
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false)
  const [insightError, setInsightError] = useState<string | null>(null)
  const [localInsights, setLocalInsights] = useState(insights)
  useEffect(() => {
    const storedSteps = localStorage.getItem('kquarks_step_goal')
    if (storedSteps) {
      const n = parseInt(storedSteps, 10)
      if (!isNaN(n) && n > 0) setStepGoal(n)
    }
    const storedCal = localStorage.getItem('kquarks_calorie_goal')
    if (storedCal) {
      const n = parseInt(storedCal, 10)
      if (!isNaN(n) && n > 0) setCalGoal(n)
    }
  }, [])

  const handleGenerateInsights = async () => {
    setIsGeneratingInsights(true)
    setInsightError(null)
    try {
      const userApiKey = localStorage.getItem('kquarks_claude_api_key') ?? undefined
      const healthContext = summaries.slice(0, 7).map((s) => ({
        date: s.date,
        steps: s.steps,
        active_calories: s.active_calories,
        sleep_duration_minutes: s.sleep_duration_minutes,
        resting_heart_rate: s.resting_heart_rate,
        avg_hrv: s.avg_hrv,
        recovery_score: s.recovery_score,
        strain_score: s.strain_score,
      }))
      const { error } = await supabase.functions.invoke('generate-insights', {
        body: { healthContext, userApiKey },
      })
      if (error) throw error
      // Refresh insights from DB
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: fresh } = await supabase
          .from('health_insights')
          .select('id, title, content, category, priority, insight_type, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)
        if (fresh) setLocalInsights(fresh)
      }
    } catch (err: unknown) {
      setInsightError(err instanceof Error ? err.message : 'Failed to generate insights')
    } finally {
      setIsGeneratingInsights(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Get today's data
  const today = summaries[0]

  // Calculate trends
  const yesterdaySteps = summaries[1]?.steps ?? today?.steps
  const stepsTrend = today ? Math.round(((today.steps - yesterdaySteps) / yesterdaySteps) * 100) : 0

  // Compute step goal streak (summaries are newest-first, skip today which may be partial)
  let stepStreak = 0
  for (const day of summaries.slice(1)) { // skip today — still accumulating
    if (day.steps >= stepGoal) {
      stepStreak++
    } else {
      break
    }
  }

  // Compute sleep streak (7+ hours = 420 min goal, skip today)
  const SLEEP_GOAL_MINUTES = 420
  let sleepStreak = 0
  for (const day of summaries.slice(1)) {
    if ((day.sleep_duration_minutes ?? 0) >= SLEEP_GOAL_MINUTES) {
      sleepStreak++
    } else {
      break
    }
  }

  // Mock metrics (will be replaced with real data)
  const metrics = {
    sleep: {
      duration: today?.sleep_duration_minutes ?? 462,
    },
    restingHR: today?.resting_heart_rate ?? 58,
    steps: today?.steps ?? 0,
    calories: Math.round(today?.active_calories ?? 0),
  }

  // Real HRV from synced data
  const todayHrv = today?.avg_hrv ?? null

  // HRV trend: today vs average of past 6 days (skip today)
  const hrvHistory = summaries.slice(1, 7).map((d) => d.avg_hrv).filter((v): v is number => typeof v === 'number' && v > 0)
  const hrvTrend = todayHrv && hrvHistory.length > 0
    ? Math.round(((todayHrv - hrvHistory.reduce((a, b) => a + b, 0) / hrvHistory.length) / (hrvHistory.reduce((a, b) => a + b, 0) / hrvHistory.length)) * 100)
    : undefined

  // Real recovery and strain from AI-synced scores
  const recoveryScore = today?.recovery_score ?? 50
  const strainScore = today?.strain_score ?? 0

  // Recovery trend: today vs average of past 6 days
  const recoveryHistory = summaries.slice(1, 7).map((d) => d.recovery_score).filter((v): v is number => typeof v === 'number' && v > 0)
  const recoveryTrend = (today?.recovery_score != null) && recoveryHistory.length > 0
    ? Math.round(((today.recovery_score - recoveryHistory.reduce((a, b) => a + b, 0) / recoveryHistory.length) / (recoveryHistory.reduce((a, b) => a + b, 0) / recoveryHistory.length)) * 100)
    : undefined

  // Strain trend: today vs past 6 days
  const strainHistory = summaries.slice(1, 7).map((d) => d.strain_score).filter((v): v is number => typeof v === 'number' && v > 0)
  const strainTrend = (today?.strain_score != null) && strainHistory.length > 0
    ? Math.round(((today.strain_score - strainHistory.reduce((a, b) => a + b, 0) / strainHistory.length) / (strainHistory.reduce((a, b) => a + b, 0) / strainHistory.length)) * 100)
    : undefined

  const distanceKm = ((today?.distance_meters ?? 0) / 1000).toFixed(1)

  // Week-over-week comparison (skip today index 0 — partial day)
  const thisWeek = summaries.slice(1, 8)  // days 1-7 (yesterday through 7 days ago)
  const lastWeek = summaries.slice(8, 15) // days 8-14 (one full week prior)
  const wowSteps = thisWeek.length > 0 && lastWeek.length > 0
    ? Math.round(((thisWeek.reduce((a, b) => a + b.steps, 0) / thisWeek.length)
        - (lastWeek.reduce((a, b) => a + b.steps, 0) / lastWeek.length))
        / Math.max(lastWeek.reduce((a, b) => a + b.steps, 0) / lastWeek.length, 1) * 100)
    : null
  const wowCal = thisWeek.length > 0 && lastWeek.length > 0
    ? Math.round(((thisWeek.reduce((a, b) => a + b.active_calories, 0) / thisWeek.length)
        - (lastWeek.reduce((a, b) => a + b.active_calories, 0) / lastWeek.length))
        / Math.max(lastWeek.reduce((a, b) => a + b.active_calories, 0) / lastWeek.length, 1) * 100)
    : null
  const wowSleepThis = thisWeek.filter((d) => (d.sleep_duration_minutes ?? 0) > 0)
  const wowSleepLast = lastWeek.filter((d) => (d.sleep_duration_minutes ?? 0) > 0)
  const wowSleep = wowSleepThis.length > 0 && wowSleepLast.length > 0
    ? Math.round(((wowSleepThis.reduce((a, b) => a + (b.sleep_duration_minutes ?? 0), 0) / wowSleepThis.length)
        - (wowSleepLast.reduce((a, b) => a + (b.sleep_duration_minutes ?? 0), 0) / wowSleepLast.length))
        / Math.max(wowSleepLast.reduce((a, b) => a + (b.sleep_duration_minutes ?? 0), 0) / wowSleepLast.length, 1) * 100)
    : null

  // 7-day average resting HR (skip today)
  const hrHistory = summaries.slice(1, 7).map((d) => d.resting_heart_rate).filter((v): v is number => typeof v === 'number' && v > 0)
  const avgRestingHR = hrHistory.length > 0 ? Math.round(hrHistory.reduce((a, b) => a + b, 0) / hrHistory.length) : null

  // Most recent body weight (may not be today's)
  const latestWeight = summaries.find((s) => s.weight_kg != null)?.weight_kg ?? null

  // Format sleep duration
  const sleepHours = Math.floor(metrics.sleep.duration / 60)
  const sleepMins = metrics.sleep.duration % 60

  // Generate AI insight based on data
  const generatePrimaryInsight = () => {
    if (recoveryScore >= 80) {
      return "Your recovery is excellent. Today is ideal for high-intensity training."
    }
    if (recoveryScore >= 60) {
      return "You're moderately recovered. Consider a balanced workout today."
    }
    return "Your recovery is low. Prioritize rest and light activity today."
  }

  const getSecondaryInsight = () => {
    if (hrvTrend != null && hrvTrend > 10) {
      return `HRV trending up ${hrvTrend}% this week - a positive adaptation sign.`
    }
    if (stepsTrend > 20) {
      return `You're ${stepsTrend}% more active than yesterday. Great momentum!`
    }
    return undefined
  }

  // Map insight categories to icons and colors
  const insightCategoryMap: Record<string, { icon: typeof Activity; color: 'recovery' | 'strain' | 'sleep' | 'heart' | 'activity' }> = {
    sleep: { icon: Moon, color: 'sleep' },
    activity: { icon: Activity, color: 'activity' },
    heart: { icon: Heart, color: 'heart' },
    recovery: { icon: Zap, color: 'recovery' },
    strain: { icon: Flame, color: 'strain' },
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              {profile?.display_name
                ? `Hi, ${profile.display_name.split(' ')[0]}`
                : 'Dashboard'}
            </h1>
            <p className="text-sm text-text-secondary">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </p>
            {summaries.length > 0 && (() => {
              const lastDate = new Date(summaries[0].date + 'T00:00:00')
              const diffDays = Math.floor((Date.now() - lastDate.getTime()) / 86400000)
              return (
                <p className="text-xs text-text-secondary opacity-60">
                  {diffDays === 0 ? 'Synced today' : diffDays === 1 ? 'Synced yesterday' : `Synced ${diffDays} days ago`}
                </p>
              )
            })()}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/steps"
              className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
              title="Activity"
            >
              <Activity className="w-5 h-5 text-text-secondary" />
            </Link>
            <Link
              href="/workouts"
              className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
              title="Workouts"
            >
              <Zap className="w-5 h-5 text-text-secondary" />
            </Link>
            <Link
              href="/recovery"
              className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
              title="Recovery & Strain"
            >
              <TrendingUp className="w-5 h-5 text-text-secondary" />
            </Link>
            <Link
              href="/heartrate"
              className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
              title="Heart Rate"
            >
              <Heart className="w-5 h-5 text-text-secondary" />
            </Link>
            <Link
              href="/sleep"
              className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
              title="Sleep History"
            >
              <BedDouble className="w-5 h-5 text-text-secondary" />
            </Link>
            <Link
              href="/body"
              className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
              title="Body Weight"
            >
              <Scale className="w-5 h-5 text-text-secondary" />
            </Link>
            <Link
              href="/insights"
              className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
              title="All Insights"
            >
              <Lightbulb className="w-5 h-5 text-text-secondary" />
            </Link>
            <Link
              href="/monthly"
              className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
              title="Monthly Stats"
            >
              <CalendarDays className="w-5 h-5 text-text-secondary" />
            </Link>
            <Link
              href="/records"
              className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
              title="Personal Records"
            >
              <Trophy className="w-5 h-5 text-text-secondary" />
            </Link>
            <Link
              href="/settings"
              className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-text-secondary" />
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
              title="Sign out"
            >
              <LogOut className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* AI Essence */}
        <AIEssence
          recoveryScore={recoveryScore}
          strainScore={strainScore}
          primaryInsight={generatePrimaryInsight()}
          secondaryInsight={getSecondaryInsight()}
          recoveryTrend={recoveryTrend}
          strainTrend={strainTrend}
        />

        {/* Quick Stats */}
        <QuickStatsGrid columns={4}>
          <QuickStat
            label="Steps"
            value={metrics.steps.toLocaleString()}
            trend={stepsTrend}
            color="activity"
          />
          <QuickStat
            label="Calories"
            value={metrics.calories}
            unit="cal"
            color="strain"
          />
          <QuickStat
            label="Sleep"
            value={`${sleepHours}h ${sleepMins}m`}
            color="sleep"
          />
          <QuickStat
            label="HRV"
            value={todayHrv != null ? Math.round(todayHrv) : '—'}
            unit="ms"
            trend={hrvTrend}
            color="heart"
          />
        </QuickStatsGrid>

        {/* Week-over-Week Comparison */}
        {(wowSteps !== null || wowCal !== null || wowSleep !== null) && (
          <div className="mb-6 bg-surface rounded-xl border border-border p-4">
            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">vs Last Week</p>
            <div className="flex gap-4">
              {wowSteps !== null && (
                <div className="flex-1 text-center">
                  <p className={`text-lg font-bold ${wowSteps > 0 ? 'text-green-400' : wowSteps < 0 ? 'text-red-400' : 'text-text-primary'}`}>
                    {wowSteps > 0 ? '+' : ''}{wowSteps}%
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">Steps</p>
                </div>
              )}
              {wowCal !== null && (
                <div className="flex-1 text-center">
                  <p className={`text-lg font-bold ${wowCal > 0 ? 'text-green-400' : wowCal < 0 ? 'text-red-400' : 'text-text-primary'}`}>
                    {wowCal > 0 ? '+' : ''}{wowCal}%
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">Calories</p>
                </div>
              )}
              {wowSleep !== null && (
                <div className="flex-1 text-center">
                  <p className={`text-lg font-bold ${wowSleep > 0 ? 'text-green-400' : wowSleep < 0 ? 'text-red-400' : 'text-text-primary'}`}>
                    {wowSleep > 0 ? '+' : ''}{wowSleep}%
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">Sleep</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Primary Metrics Stream */}
        <DataStreamSection title="Today's Metrics">
          <DataStream>
            <MetricRow
              icon={<Zap className="w-5 h-5" />}
              label="Recovery"
              value={recoveryScore}
              unit="%"
              sublabel={recoveryScore >= 67 ? 'Optimal' : recoveryScore >= 34 ? 'Moderate' : 'Low'}
              trend={recoveryTrend}
              color="recovery"
            />
            <MetricRow
              icon={<Flame className="w-5 h-5" />}
              label="Strain"
              value={strainScore.toFixed(1)}
              unit="/21"
              sublabel={strainScore >= 18 ? 'All Out' : strainScore >= 14 ? 'High' : strainScore >= 10 ? 'Moderate' : 'Light'}
              trend={strainTrend}
              color="strain"
            />
            <MetricRow
              icon={<Moon className="w-5 h-5" />}
              label="Sleep"
              value={`${sleepHours}h ${sleepMins}m`}
              color="sleep"
            />
            {sleepStreak > 0 && (
              <MetricRow
                icon={<Moon className="w-5 h-5" />}
                label="Sleep Streak"
                value={sleepStreak}
                unit={sleepStreak === 1 ? 'night' : 'nights'}
                sublabel="consecutive nights of 7+ hours"
                color="sleep"
              />
            )}
            <MetricRow
              icon={<Heart className="w-5 h-5" />}
              label="Resting Heart Rate"
              value={metrics.restingHR}
              unit="bpm"
              color="heart"
              expandContent={
                <div className="space-y-3">
                  <MetricDetail label="HRV" value={todayHrv != null ? `${Math.round(todayHrv)} ms` : '—'} />
                  {avgRestingHR != null && <MetricDetail label="7-day Average" value={`${avgRestingHR} bpm`} />}
                </div>
              }
            />
            {latestWeight != null && (
              <MetricRow
                icon={<Scale className="w-5 h-5" />}
                label="Body Weight"
                value={latestWeight.toFixed(1)}
                unit="kg"
                color="recovery"
              />
            )}
          </DataStream>
        </DataStreamSection>

        {/* Activity Stream */}
        <DataStreamSection title="Activity">
          <DataStream>
            <MetricRow
              icon={<Activity className="w-5 h-5" />}
              label="Steps"
              value={metrics.steps.toLocaleString()}
              unit={`/ ${stepGoal.toLocaleString()}`}
              sublabel={`${Math.round((metrics.steps / stepGoal) * 100)}% of goal`}
              trend={stepsTrend}
              color="activity"
            />
            <MetricRow
              icon={<Flame className="w-5 h-5" />}
              label="Active Calories"
              value={metrics.calories}
              unit="cal"
              sublabel={`${calGoal} cal goal`}
              color="strain"
            />
            {stepStreak > 0 && (
              <MetricRow
                icon={<Target className="w-5 h-5" />}
                label="Step Streak"
                value={stepStreak}
                unit={stepStreak === 1 ? 'day' : 'days'}
                sublabel="consecutive days at goal"
                color="activity"
              />
            )}
            {weeklyWorkoutCount > 0 && (
              <MetricRow
                icon={<Activity className="w-5 h-5" />}
                label="Workouts This Week"
                value={weeklyWorkoutCount}
                unit={weeklyWorkoutCount === 1 ? 'session' : 'sessions'}
                color="activity"
              />
            )}
            {workoutStreak > 0 && (
              <MetricRow
                icon={<Activity className="w-5 h-5" />}
                label="Workout Streak"
                value={workoutStreak}
                unit={workoutStreak === 1 ? 'day' : 'days'}
                sublabel="consecutive days with a workout"
                color="activity"
              />
            )}
            <MetricRow
              icon={<Route className="w-5 h-5" />}
              label="Distance"
              value={distanceKm}
              unit="km"
              color="activity"
            />
            {(today?.floors_climbed ?? 0) > 0 && (
              <MetricRow
                icon={<TrendingUp className="w-5 h-5" />}
                label="Floors Climbed"
                value={today?.floors_climbed ?? 0}
                unit="floors"
                color="activity"
              />
            )}
          </DataStream>
        </DataStreamSection>

        {/* 7-Day Trends */}
        <DataStreamSection title="7-Day Trends">
          <WeeklyCharts
            summaries={summaries.slice(0, 7)}
            stepGoal={stepGoal}
            calGoal={calGoal}
            weightData={summaries
              .filter((s) => s.weight_kg != null)
              .map((s) => ({ date: s.date, weight_kg: s.weight_kg! }))}
          />
        </DataStreamSection>

        {/* AI Insights */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">AI Insights</h2>
            <button
              onClick={handleGenerateInsights}
              disabled={isGeneratingInsights}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 text-accent text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isGeneratingInsights ? 'Generating…' : 'Generate'}
            </button>
          </div>

          {insightError && (
            <p className="text-xs text-red-400 mb-3">{insightError}</p>
          )}

          {localInsights.length > 0 ? (
            <InsightsStream>
              {localInsights.slice(0, 5).map((insight) => {
                const category = insightCategoryMap[insight.category.toLowerCase()] ?? {
                  icon: Sparkles,
                  color: 'default' as const,
                }
                const Icon = category.icon
                return (
                  <InsightCard
                    key={insight.id}
                    category={insight.category}
                    title={insight.title}
                    description={insight.content}
                    icon={<Icon className="w-5 h-5" />}
                    color={category.color}
                  />
                )
              })}
            </InsightsStream>
          ) : (
            <EmptyState
              icon={<Sparkles className="w-6 h-6" />}
              title="No insights yet"
              description="Click Generate to get AI-powered insights about your health patterns."
            />
          )}
        </div>
      </main>
    </div>
  )
}

// Helper component for expanded metric details
function MetricDetail({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className={cn('text-sm font-medium', color ?? 'text-text-primary')}>
        {value}
      </span>
    </div>
  )
}
