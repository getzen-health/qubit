'use client'

/**
 * Stream-Based Dashboard
 * Minimalistic, AI-first, expandable metrics layout
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Activity,
  Heart,
  Moon,
  Flame,
  Route,
  Brain,
  Zap,
  TrendingUp,
  Clock,
  Target,
  LogOut,
  Settings,
  Sparkles,
  Apple,
  UtensilsCrossed,
  Scale,
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

const STEP_GOAL = 10000

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
}

export function DashboardStream({
  user,
  profile,
  summaries,
  insights,
}: DashboardStreamProps) {
  const router = useRouter()
  const supabase = createClient()

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
    if (day.steps >= STEP_GOAL) {
      stepStreak++
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
              href="/workouts"
              className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
              title="Workouts"
            >
              <Activity className="w-5 h-5 text-text-secondary" />
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
              unit={`/ ${STEP_GOAL.toLocaleString()}`}
              sublabel={`${Math.round((metrics.steps / STEP_GOAL) * 100)}% of goal`}
              trend={stepsTrend}
              color="activity"
            />
            <MetricRow
              icon={<Flame className="w-5 h-5" />}
              label="Active Calories"
              value={metrics.calories}
              unit="cal"
              sublabel="500 cal goal"
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
          <WeeklyCharts summaries={summaries.slice(0, 7)} />
        </DataStreamSection>

        {/* AI Insights */}
        {insights.length > 0 && (
          <InsightsStream>
            {insights.slice(0, 5).map((insight) => {
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
        )}

        {insights.length === 0 && (
          <div className="mt-6">
            <EmptyState
              icon={<Sparkles className="w-6 h-6" />}
              title="No insights yet"
              description="As we learn more about your health patterns, personalized insights will appear here."
            />
          </div>
        )}
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
