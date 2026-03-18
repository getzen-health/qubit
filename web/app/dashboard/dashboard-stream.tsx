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
  Droplets,
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
} from 'lucide-react'
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

  // Mock metrics (will be replaced with real data)
  const metrics = {
    recovery: { score: 78, trend: 5 },
    strain: { score: 14.2, trend: -8 },
    sleep: {
      duration: today?.sleep_duration_minutes ?? 462,
      quality: 85,
    },
    hrv: { value: 52, trend: 12 },
    restingHR: today?.resting_heart_rate ?? 58,
    steps: today?.steps ?? 0,
    calories: Math.round(today?.active_calories ?? 0),
    water: 1800,
    waterTarget: 2500,
  }

  // Format sleep duration
  const sleepHours = Math.floor(metrics.sleep.duration / 60)
  const sleepMins = metrics.sleep.duration % 60

  // Generate AI insight based on data
  const generatePrimaryInsight = () => {
    if (metrics.recovery.score >= 80) {
      return "Your recovery is excellent. Today is ideal for high-intensity training."
    }
    if (metrics.recovery.score >= 60) {
      return "You're moderately recovered. Consider a balanced workout today."
    }
    return "Your recovery is low. Prioritize rest and light activity today."
  }

  const getSecondaryInsight = () => {
    if (metrics.hrv.trend > 10) {
      return `HRV trending up ${metrics.hrv.trend}% this week - a positive adaptation sign.`
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
            <button
              type="button"
              className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-text-secondary" />
            </button>
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
          recoveryScore={metrics.recovery.score}
          strainScore={metrics.strain.score}
          primaryInsight={generatePrimaryInsight()}
          secondaryInsight={getSecondaryInsight()}
          recoveryTrend={metrics.recovery.trend}
          strainTrend={metrics.strain.trend}
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
            value={metrics.hrv.value}
            unit="ms"
            trend={metrics.hrv.trend}
            color="heart"
          />
        </QuickStatsGrid>

        {/* Primary Metrics Stream */}
        <DataStreamSection title="Today's Metrics">
          <DataStream>
            <MetricRow
              icon={<Zap className="w-5 h-5" />}
              label="Recovery"
              value={metrics.recovery.score}
              unit="%"
              sublabel={metrics.recovery.score >= 67 ? 'Optimal' : metrics.recovery.score >= 34 ? 'Moderate' : 'Low'}
              trend={metrics.recovery.trend}
              color="recovery"
              expandContent={
                <div className="space-y-3">
                  <MetricDetail label="Sleep Performance" value="85%" />
                  <MetricDetail label="Sleep Consistency" value="92%" />
                  <MetricDetail label="Respiratory Rate" value="14.5 breaths/min" />
                  <MetricDetail label="Skin Temperature" value="+0.2°C" />
                </div>
              }
            />
            <MetricRow
              icon={<Flame className="w-5 h-5" />}
              label="Strain"
              value={metrics.strain.score.toFixed(1)}
              unit="/21"
              sublabel={metrics.strain.score >= 18 ? 'All Out' : metrics.strain.score >= 14 ? 'High' : metrics.strain.score >= 10 ? 'Moderate' : 'Light'}
              trend={metrics.strain.trend}
              color="strain"
              expandContent={
                <div className="space-y-3">
                  <MetricDetail label="Cardiovascular" value="12.8" />
                  <MetricDetail label="Muscular" value="8.5" />
                  <MetricDetail label="Peak HR" value="172 bpm" />
                  <MetricDetail label="Active Minutes" value="127 min" />
                </div>
              }
            />
            <MetricRow
              icon={<Moon className="w-5 h-5" />}
              label="Sleep"
              value={`${sleepHours}h ${sleepMins}m`}
              sublabel={`${metrics.sleep.quality}% quality`}
              color="sleep"
              expandContent={
                <div className="space-y-3">
                  <MetricDetail label="Deep Sleep" value="1h 23m" color="text-sleep" />
                  <MetricDetail label="REM" value="1h 45m" color="text-hrv" />
                  <MetricDetail label="Light" value="3h 52m" color="text-text-secondary" />
                  <MetricDetail label="Awake" value="22m" color="text-warning" />
                </div>
              }
            />
            <MetricRow
              icon={<Heart className="w-5 h-5" />}
              label="Resting Heart Rate"
              value={metrics.restingHR}
              unit="bpm"
              color="heart"
              expandContent={
                <div className="space-y-3">
                  <MetricDetail label="HRV" value={`${metrics.hrv.value} ms`} />
                  <MetricDetail label="Max HR Today" value="142 bpm" />
                  <MetricDetail label="7-day Average" value="59 bpm" />
                </div>
              }
            />
          </DataStream>
        </DataStreamSection>

        {/* Activity Stream */}
        <DataStreamSection title="Activity">
          <DataStream>
            <MetricRow
              icon={<Activity className="w-5 h-5" />}
              label="Steps"
              value={metrics.steps.toLocaleString()}
              unit="/ 10,000"
              sublabel={`${Math.round((metrics.steps / 10000) * 100)}% of goal`}
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
            <MetricRow
              icon={<Droplets className="w-5 h-5" />}
              label="Water"
              value={(metrics.water / 1000).toFixed(1)}
              unit={`/ ${(metrics.waterTarget / 1000).toFixed(1)}L`}
              sublabel={`${Math.round((metrics.water / metrics.waterTarget) * 100)}% of goal`}
              color="sleep"
            />
          </DataStream>
        </DataStreamSection>

        {/* 7-Day Trends */}
        <DataStreamSection title="7-Day Trends">
          <WeeklyCharts summaries={summaries} />
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
