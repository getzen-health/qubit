'use client'

/**
 * Stream-Based Dashboard
 * Minimalistic, AI-first, expandable metrics layout
 */

import { useState, useEffect, useRef } from 'react'
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
  Droplets,
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
import { GoalRings } from './components/goal-rings'
import { BottomNav } from '@/components/bottom-nav'

const DEFAULT_STEP_GOAL = 10000
const DEFAULT_CAL_GOAL = 500
const DEFAULT_SLEEP_GOAL_MINUTES = 480 // 8 hours

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
    active_minutes?: number
    sleep_duration_minutes?: number
    resting_heart_rate?: number
    avg_hrv?: number
    recovery_score?: number
    strain_score?: number
    weight_kg?: number
  }>
  recentWorkouts: Array<{
    workout_type: string
    duration_minutes: number
    active_calories?: number | null
    avg_heart_rate?: number | null
  }>
  recentSleepRecords: Array<{
    duration_minutes: number
    deep_minutes?: number | null
    rem_minutes?: number | null
    core_minutes?: number | null
    awake_minutes?: number | null
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
  dbStepGoal?: number | null
  dbCalGoal?: number | null
  dbSleepGoalMinutes?: number | null
  lastSyncAt?: string | null
  todayWaterMl?: number
  waterTargetMl?: number
  todayCaloriesConsumed?: number
  calorieIntakeTarget?: number
  activeFast?: {
    id: string
    protocol: string
    target_hours: number
    started_at: string
  } | null
}

export function DashboardStream({
  user,
  profile,
  summaries,
  recentWorkouts,
  recentSleepRecords,
  insights,
  weeklyWorkoutCount,
  workoutStreak,
  dbStepGoal,
  dbCalGoal,
  dbSleepGoalMinutes,
  lastSyncAt,
  todayWaterMl = 0,
  waterTargetMl = 2500,
  todayCaloriesConsumed = 0,
  calorieIntakeTarget = 2000,
  activeFast = null,
}: DashboardStreamProps) {
  const router = useRouter()
  const supabase = createClient()

  const [stepGoal, setStepGoal] = useState(dbStepGoal ?? DEFAULT_STEP_GOAL)
  const [calGoal, setCalGoal] = useState(dbCalGoal ?? DEFAULT_CAL_GOAL)
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false)
  const [insightError, setInsightError] = useState<string | null>(null)
  const [localActiveFast, setLocalActiveFast] = useState(activeFast)
  const [endingFast, setEndingFast] = useState(false)
  const [fastElapsedHours, setFastElapsedHours] = useState<number>(() => {
    if (!activeFast) return 0
    return (Date.now() - new Date(activeFast.started_at).getTime()) / 3600000
  })

  useEffect(() => {
    if (!localActiveFast) return
    const startMs = new Date(localActiveFast.started_at).getTime()
    const tick = () => setFastElapsedHours((Date.now() - startMs) / 3600000)
    const id = setInterval(tick, 60000) // update every minute on dashboard
    return () => clearInterval(id)
  }, [localActiveFast])
  const [localWaterMl, setLocalWaterMl] = useState(todayWaterMl)
  const [waterLogging, setWaterLogging] = useState(false)
  const [showWaterQuick, setShowWaterQuick] = useState(false)

  const handleEndFast = async () => {
    if (!localActiveFast) return
    setEndingFast(true)
    try {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) return
      const now = new Date().toISOString()
      const actualHours = (Date.now() - new Date(localActiveFast.started_at).getTime()) / 3600000
      await supabase
        .from('fasting_sessions')
        .update({ ended_at: now, actual_hours: actualHours, completed: actualHours >= localActiveFast.target_hours })
        .eq('id', localActiveFast.id)
        .eq('user_id', u.id)
      setLocalActiveFast(null)
    } finally {
      setEndingFast(false)
    }
  }

  const handleAddWater = async (ml: number) => {
    setWaterLogging(true)
    try {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) return
      const todayDate = new Date().toISOString().slice(0, 10)
      await supabase.from('water_logs').insert({ user_id: u.id, amount_ml: ml, logged_at: new Date().toISOString() })
      const newTotal = localWaterMl + ml
      await supabase.from('daily_water').upsert({ user_id: u.id, date: todayDate, total_ml: newTotal }, { onConflict: 'user_id,date' })
      setLocalWaterMl(newTotal)
      setShowWaterQuick(false)
    } finally {
      setWaterLogging(false)
    }
  }

  const [localInsights, setLocalInsights] = useState(insights)
  useEffect(() => {
    // Only use localStorage if DB didn't provide goals
    if (!dbStepGoal) {
      const storedSteps = localStorage.getItem('kquarks_step_goal')
      if (storedSteps) {
        const n = parseInt(storedSteps, 10)
        if (!isNaN(n) && n > 0) setStepGoal(n)
      }
    }
    if (!dbCalGoal) {
      const storedCal = localStorage.getItem('kquarks_calorie_goal')
      if (storedCal) {
        const n = parseInt(storedCal, 10)
        if (!isNaN(n) && n > 0) setCalGoal(n)
      }
    }
  }, [dbStepGoal, dbCalGoal])

  const handleGenerateInsights = async () => {
    setIsGeneratingInsights(true)
    setInsightError(null)
    try {
      const userApiKey = localStorage.getItem('kquarks_claude_api_key') ?? undefined
      const todaySummary = summaries[0]
      const weekHistory = summaries.slice(1, 8)
      const healthContext = {
        dailySummary: {
          date: todaySummary?.date ?? '',
          steps: todaySummary?.steps ?? 0,
          distanceMeters: todaySummary?.distance_meters ?? 0,
          activeCalories: todaySummary?.active_calories ?? 0,
          totalCalories: todaySummary?.active_calories ?? 0,
          floorsClimbed: todaySummary?.floors_climbed ?? 0,
          restingHeartRate: todaySummary?.resting_heart_rate ?? null,
          avgHrv: todaySummary?.avg_hrv ?? null,
          sleepDurationMinutes: todaySummary?.sleep_duration_minutes ?? null,
          sleepQualityScore: null,
          activeMinutes: todaySummary?.active_minutes ?? 0,
        },
        weekHistory: weekHistory.map((s) => ({
          date: s.date,
          steps: s.steps,
          activeCalories: s.active_calories,
          restingHeartRate: s.resting_heart_rate ?? null,
          avgHrv: s.avg_hrv ?? null,
          sleepDurationMinutes: s.sleep_duration_minutes ?? null,
        })),
        recentWorkouts: recentWorkouts.map((w) => ({
          workoutType: w.workout_type,
          durationMinutes: w.duration_minutes ?? 0,
          activeCalories: w.active_calories ?? null,
          avgHeartRate: w.avg_heart_rate ?? null,
        })),
        recentSleep: recentSleepRecords.map((s) => ({
          durationMinutes: s.duration_minutes ?? 0,
          deepMinutes: s.deep_minutes ?? 0,
          remMinutes: s.rem_minutes ?? 0,
          coreMinutes: s.core_minutes ?? 0,
          awakeMinutes: s.awake_minutes ?? 0,
        })),
      }
      const stepGoalRaw = localStorage.getItem('kquarks_step_goal')
      const calGoalRaw = localStorage.getItem('kquarks_calorie_goal')
      const sleepGoalRaw = localStorage.getItem('kquarks_sleep_goal_minutes')
      const userGoals = {
        stepGoal: stepGoalRaw ? parseInt(stepGoalRaw, 10) || 10000 : 10000,
        calorieGoal: calGoalRaw ? parseInt(calGoalRaw, 10) || 500 : 500,
        sleepGoalMinutes: sleepGoalRaw ? parseInt(sleepGoalRaw, 10) || 480 : 480,
      }
      const extendedContext = {
        ...healthContext,
        userGoals,
        ...(waterTargetMl > 0 ? { hydration: { todayMl: todayWaterMl, targetMl: waterTargetMl } } : {}),
        ...(calorieIntakeTarget > 0 && todayCaloriesConsumed > 0 ? { nutrition: { todayCalories: todayCaloriesConsumed, calorieTarget: calorieIntakeTarget } } : {}),
        ...(activeFast ? { fasting: { isActive: true, protocol: activeFast.protocol, elapsedHours: fastElapsedHours } } : {}),
      }
      const { error } = await supabase.functions.invoke('generate-insights', {
        body: { healthContext: extendedContext, userApiKey },
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

  // Compute sleep streak (consecutive nights meeting sleep goal)
  const sleepGoalMin = (dbSleepGoalMinutes ?? DEFAULT_SLEEP_GOAL_MINUTES)
  let sleepStreak = 0
  for (const day of summaries.slice(1)) {
    if ((day.sleep_duration_minutes ?? 0) >= sleepGoalMin) {
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

  // Personalized daily tip based on current data
  const getDailyTip = (): { text: string; icon: string; type: 'positive' | 'caution' | 'info' } | null => {
    const hour = new Date().getHours()
    const sleepMin = today?.sleep_duration_minutes ?? 0
    const steps = today?.steps ?? 0
    const hrv = today?.avg_hrv ?? null
    const avgHrv7 = hrvHistory.length > 0 ? hrvHistory.reduce((a, b) => a + b, 0) / hrvHistory.length : null

    // Sleep-based tips
    if (sleepMin > 0 && sleepMin < (dbSleepGoalMinutes ?? 420)) {
      const deficit = Math.round(((dbSleepGoalMinutes ?? 420) - sleepMin) / 60 * 10) / 10
      return { text: `You slept ${deficit}h under your goal. A short nap or early bedtime tonight will help recovery.`, icon: '🌙', type: 'caution' }
    }

    // HRV drop tip
    if (hrv && avgHrv7 && hrv < avgHrv7 * 0.85) {
      return { text: `Your HRV is ${Math.round(((avgHrv7 - hrv) / avgHrv7) * 100)}% below your 7-day average. Consider lighter activity today.`, icon: '💗', type: 'caution' }
    }

    // Step goal nearly met in evening
    if (hour >= 16 && steps >= stepGoal * 0.8 && steps < stepGoal) {
      const remaining = stepGoal - steps
      return { text: `Only ${remaining.toLocaleString()} steps to go! A 10–15 minute walk will get you there.`, icon: '🚶', type: 'info' }
    }

    // High recovery — encourage training
    if (recoveryScore >= 75 && strainScore < 10) {
      return { text: `Recovery is strong at ${recoveryScore}%. Great day to push your training.`, icon: '⚡', type: 'positive' }
    }

    // Step goal already met
    if (steps >= stepGoal) {
      return { text: `Step goal hit! You've walked ${(steps / 1000).toFixed(1)}k steps today.`, icon: '✅', type: 'positive' }
    }

    // Low water
    if (waterTargetMl > 0 && localWaterMl < waterTargetMl * 0.4 && hour >= 14) {
      return { text: `You've only had ${localWaterMl}ml of water today. Try to drink more this afternoon.`, icon: '💧', type: 'caution' }
    }

    return null
  }
  const dailyTip = getDailyTip()

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
            {(() => {
              if (lastSyncAt) {
                const syncDate = new Date(lastSyncAt)
                const diffMs = Date.now() - syncDate.getTime()
                const diffMin = Math.floor(diffMs / 60000)
                const diffHours = Math.floor(diffMs / 3600000)
                const diffDays = Math.floor(diffMs / 86400000)
                let label: string
                if (diffMin < 2) label = 'Synced just now'
                else if (diffMin < 60) label = `Synced ${diffMin}m ago`
                else if (diffHours < 24) label = `Synced ${diffHours}h ago`
                else if (diffDays === 1) label = 'Synced yesterday'
                else label = `Synced ${diffDays} days ago`
                return <p className="text-xs text-text-secondary opacity-60">{label}</p>
              }
              if (summaries.length > 0) {
                const lastDate = new Date(summaries[0].date + 'T00:00:00')
                const diffDays = Math.floor((Date.now() - lastDate.getTime()) / 86400000)
                return (
                  <p className="text-xs text-text-secondary opacity-60">
                    {diffDays === 0 ? 'Data from today' : diffDays === 1 ? 'Data from yesterday' : `Data from ${diffDays} days ago`}
                  </p>
                )
              }
              return null
            })()}
          </div>
          <div className="flex items-center gap-1">
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
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* AI Essence */}
        <AIEssence
          recoveryScore={recoveryScore}
          strainScore={strainScore}
          primaryInsight={generatePrimaryInsight()}
          secondaryInsight={getSecondaryInsight()}
          recoveryTrend={recoveryTrend}
          strainTrend={strainTrend}
        />

        {/* Goal Rings */}
        {today && (
          <GoalRings
            steps={metrics.steps}
            stepGoal={stepGoal}
            calories={metrics.calories}
            calGoal={calGoal}
            sleepMinutes={metrics.sleep.duration}
            sleepGoalMinutes={sleepGoalMin}
          />
        )}

        {/* Daily Tip */}
        {dailyTip && (
          <div className={cn(
            'mb-6 rounded-xl border p-4 flex items-start gap-3',
            dailyTip.type === 'positive' && 'bg-green-500/5 border-green-500/20',
            dailyTip.type === 'caution' && 'bg-amber-500/5 border-amber-500/20',
            dailyTip.type === 'info' && 'bg-blue-500/5 border-blue-500/20',
          )}>
            <span className="text-xl leading-none mt-0.5">{dailyTip.icon}</span>
            <p className={cn(
              'text-sm leading-relaxed',
              dailyTip.type === 'positive' && 'text-green-300',
              dailyTip.type === 'caution' && 'text-amber-300',
              dailyTip.type === 'info' && 'text-blue-300',
            )}>{dailyTip.text}</p>
          </div>
        )}

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

        {/* Hydration */}
        {waterTargetMl > 0 && (
          <div className="mb-6 bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setShowWaterQuick((v) => !v)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Droplets className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-text-secondary">Hydration</span>
                <span className="text-xs text-blue-400">{showWaterQuick ? '▲' : '+ Log'}</span>
              </button>
              <Link href="/water" className="text-sm font-semibold text-text-primary hover:underline">
                {localWaterMl >= 1000 ? `${(localWaterMl / 1000).toFixed(1)}L` : `${localWaterMl}ml`}
                <span className="text-text-secondary font-normal"> / {waterTargetMl >= 1000 ? `${(waterTargetMl / 1000).toFixed(1)}L` : `${waterTargetMl}ml`}</span>
              </Link>
            </div>
            <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min((localWaterMl / waterTargetMl) * 100, 100)}%`,
                  background: localWaterMl >= waterTargetMl ? '#22c55e' : '#3b82f6',
                }}
              />
            </div>
            <p className="text-xs text-text-secondary mt-1.5">
              {localWaterMl >= waterTargetMl
                ? 'Goal reached!'
                : `${waterTargetMl - localWaterMl}ml to go`}
            </p>
            {showWaterQuick && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {[150, 250, 350, 500, 750].map((ml) => (
                  <button
                    key={ml}
                    type="button"
                    disabled={waterLogging}
                    onClick={() => handleAddWater(ml)}
                    className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                  >
                    +{ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Nutrition calories */}
        {todayCaloriesConsumed > 0 && (
          <Link href="/nutrition" className="block mb-6 bg-surface rounded-xl border border-border p-4 hover:bg-surface-secondary transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">🥗</span>
                <span className="text-sm font-medium text-text-secondary">Calories</span>
              </div>
              <span className="text-sm font-semibold text-text-primary">
                {todayCaloriesConsumed.toLocaleString()}
                <span className="text-text-secondary font-normal"> / {calorieIntakeTarget.toLocaleString()} kcal</span>
              </span>
            </div>
            <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min((todayCaloriesConsumed / calorieIntakeTarget) * 100, 100)}%`,
                  background: todayCaloriesConsumed > calorieIntakeTarget ? '#ef4444' : '#10b981',
                }}
              />
            </div>
            <p className="text-xs text-text-secondary mt-1.5">
              {todayCaloriesConsumed >= calorieIntakeTarget
                ? 'Daily goal reached'
                : `${(calorieIntakeTarget - todayCaloriesConsumed).toLocaleString()} kcal remaining`}
            </p>
          </Link>
        )}

        {/* Active Fast */}
        {localActiveFast && (
          <div className="mb-6 bg-surface rounded-xl border border-amber-500/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <Link href="/fasting" className="flex items-center gap-2">
                <span className="text-amber-400 text-sm">⏱</span>
                <span className="text-sm font-medium text-amber-400">Fasting · {localActiveFast.protocol}</span>
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-text-primary">
                  {Math.floor(fastElapsedHours)}h {Math.floor((fastElapsedHours % 1) * 60)}m
                  <span className="text-text-secondary font-normal"> / {localActiveFast.target_hours}h</span>
                </span>
                <button
                  type="button"
                  onClick={handleEndFast}
                  disabled={endingFast}
                  className="px-2.5 py-1 text-xs font-medium bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                >
                  {endingFast ? '…' : 'End'}
                </button>
              </div>
            </div>
            <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min((fastElapsedHours / localActiveFast.target_hours) * 100, 100)}%`,
                  background: fastElapsedHours >= localActiveFast.target_hours ? '#22c55e' : '#f59e0b',
                }}
              />
            </div>
            <p className="text-xs text-text-secondary mt-1.5">
              {fastElapsedHours >= localActiveFast.target_hours
                ? '🎉 Goal reached!'
                : `${Math.max(0, localActiveFast.target_hours - Math.floor(fastElapsedHours))}h remaining`}
            </p>
          </div>
        )}

        {/* Week-over-Week Comparison */}
        {(wowSteps !== null || wowCal !== null || wowSleep !== null) && (
          <div className="mb-6 bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">vs Last Week</p>
              <Link href="/compare" className="text-xs text-accent hover:underline">View all</Link>
            </div>
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
        <DataStreamSection
          title="Today's Metrics"
          action={today?.date ? (
            <Link href={`/day/${today.date}`} className="text-sm text-accent hover:underline">
              Full day →
            </Link>
          ) : undefined}
        >
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
        {/* Quick navigation — categorized */}
        <div className="mt-6 pt-6 border-t border-border space-y-4">
          {[
            {
              section: 'Activity',
              links: [
                { href: '/rings', label: 'Activity Rings' },
                { href: '/floors', label: 'Floors Climbed' },
                { href: '/running', label: 'Running' },
                { href: '/race-predictor', label: 'Race Predictor' },
                { href: '/cycling', label: 'Cycling' },
                { href: '/swimming', label: 'Swimming' },
                { href: '/hiking', label: 'Hiking' },
                { href: '/variety', label: 'Workout Variety' },
                { href: '/workouts/prs', label: 'Workout PRs' },
                { href: '/records', label: 'All-Time Records' },
                { href: '/calories', label: 'Calorie Balance' },
                { href: '/training-load', label: 'Training Load' },
                { href: '/calendar', label: 'Activity Calendar' },
              ],
            },
            {
              section: 'Heart & Vitals',
              links: [
                { href: '/heartrate', label: 'Heart Rate' },
                { href: '/zones', label: 'Training Zones' },
                { href: '/recovery', label: 'Recovery & HRV' },
                { href: '/vitals', label: 'Vitals' },
                { href: '/bloodpressure', label: 'Blood Pressure' },
                { href: '/glucose', label: 'Blood Glucose' },
                { href: '/vo2max', label: 'VO₂ Max' },
                { href: '/cardiac', label: 'Cardiac Events' },
              ],
            },
            {
              section: 'Sleep',
              links: [
                { href: '/sleep', label: 'Sleep' },
                { href: '/sleep/schedule', label: 'Sleep Schedule' },
                { href: '/temperature', label: 'Wrist Temp' },
              ],
            },
            {
              section: 'Wellbeing',
              links: [
                { href: '/daylight', label: 'Daylight' },
                { href: '/mobility', label: 'Mobility' },
                { href: '/hearing', label: 'Hearing Health' },
                { href: '/mindfulness', label: 'Mindfulness' },
                { href: '/body', label: 'Body Weight' },
              ],
            },
            {
              section: 'Lifestyle',
              links: [
                { href: '/water', label: 'Hydration' },
                { href: '/nutrition', label: 'Nutrition' },
                { href: '/macros', label: 'Macros' },
                { href: '/fasting', label: 'Fasting' },
              ],
            },
            {
              section: 'Analytics',
              links: [
                { href: '/score', label: 'Health Score' },
                { href: '/insights', label: 'AI Insights' },
                { href: '/correlations', label: 'Correlations' },
                { href: '/trends', label: 'Trends' },
                { href: '/streaks', label: 'Streaks' },
                { href: '/goals', label: 'Goals' },
                { href: '/monthly', label: 'Monthly' },
                { href: '/year', label: 'Year View' },
                { href: '/compare', label: 'Compare Weeks' },
              ],
            },
          ].map(({ section, links }) => (
            <div key={section}>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">{section}</p>
              <div className="flex flex-wrap gap-2">
                {links.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="px-3 py-1.5 rounded-full bg-surface border border-border text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
      <BottomNav />
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
