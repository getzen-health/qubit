'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import { HealthScore, HealthScoreGrid } from './components/health-score'
import { SleepAnalysis, SleepTrend } from './components/sleep-analysis'
import { ActivityHeatmap, WeeklyComparison } from './components/activity-heatmap'
import { HeartRateZones, HeartRateChart, HRVCard } from './components/heart-rate'
import { StreaksCard, GoalsProgress, AchievementBadges, WeeklyChallenge } from './components/streaks-goals'
import { InsightsCarousel } from './components/insights-carousel'
import { RecentWorkouts, WorkoutStats, WorkoutDistribution } from './components/workout-summary'
import { StrainGauge, RecoveryScore, StrainTrend, TrainingLoad } from './components/strain-recovery'
import { NutritionOverview, MealLog, WaterTracker, MacroDistribution, FastingTimer } from './components/nutrition'
import { HydrationMiniBar } from './components/hydration-mini-bar'
import Link from 'next/link'
import { BodyBattery, BodyBatteryTrend, StressLevel, Readiness, SleepDebt } from './components/body-battery'
import { RespiratoryRate, BloodOxygen, SkinTemperature, WellnessRadar, MenstrualCycle, Leaderboard, QuickActions, DailyTip } from './components/advanced-metrics'
import { CurrentGlucose, GlucoseChart, TimeInRange, MealGlucoseImpact, GlucoseInsights, DailyGlucosePattern } from './components/glucose-monitor'
import {
  PersonalRecords,
  StatCards,
  CorrelationMatrix,
  PercentileRankings,
  MonthlyReview,
  TrendPrediction,
  ShareableStatCard,
  HealthTimeline,
  DataExplorer,
  LifetimeStatsCard,
  ComparisonCards,
} from './components/infographics'
import { QuickLinks } from './components/quick-links'

interface NutritionData {
  calories: { consumed: number; target: number; burned: number }
  protein: { consumed: number; target: number }
  carbs: { consumed: number; target: number }
  fat: { consumed: number; target: number }
  water: { consumed: number; target: number }
  fiber: { consumed: number; target: number }
}

interface Meal {
  id: string
  name: string
  time: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface FastingSession {
  id: string
  protocol: string
  target_hours: number
  started_at: string
  ended_at?: string
}

interface DashboardContentProps {
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
  nutritionData?: NutritionData
  meals?: Meal[]
  fastingSession?: FastingSession | null
  defaultFastingProtocol?: string
  defaultFastingHours?: number
}

export function DashboardContent({
  user,
  profile,
  summaries,
  insights,
  nutritionData: initialNutritionData,
  meals: initialMeals,
  fastingSession: initialFastingSession,
  defaultFastingProtocol = '16:8',
  defaultFastingHours = 16,
}: DashboardContentProps) {
  // --- Quick Links ---
  // Place this at the top of the dashboard or in a quick-links grid
  // Add more links as needed
  // ---
  // Example: <QuickLinks />

  // Quick links section
  // Place this at the top of the dashboard or in a prominent quick-links area
  // Add more links as needed
  // ---

  const router = useRouter()
  const supabase = createClient()

  // State for nutrition data that can be refreshed
  const [nutritionData, setNutritionData] = useState(initialNutritionData)
  const [meals, setMeals] = useState(initialMeals ?? [])
  const [waterConsumed, setWaterConsumed] = useState(initialNutritionData?.water.consumed ?? 0)

  // Refresh nutrition data from the server
  const refreshNutrition = async () => {
    router.refresh()
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Prepare chart data
  const chartData = [...summaries].reverse().map((s) => ({
    date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    steps: s.steps,
    calories: Math.round(s.active_calories),
  }))

  const today = summaries[0]
  const weeklySteps = summaries.reduce((sum, s) => sum + s.steps, 0)
  const weeklyCalories = summaries.reduce((sum, s) => sum + s.active_calories, 0)
  const avgSleep = summaries.filter((s) => s.sleep_duration_minutes).length > 0
    ? summaries.filter((s) => s.sleep_duration_minutes).reduce((sum, s) => sum + (s.sleep_duration_minutes ?? 0), 0) /
      summaries.filter((s) => s.sleep_duration_minutes).length
    : 0

  // Mock data for all components
  const mockStrainData = {
    score: 14.2,
    cardiovascular: 12.8,
    muscular: 8.5,
    calories: Math.round(today?.active_calories ?? 485),
    duration: 127,
    peakHR: 172,
    avgHR: 98,
  }

  const mockRecoveryData = {
    score: 78,
    hrv: 52,
    restingHR: 58,
    sleepPerformance: 85,
    sleepConsistency: 92,
    respiratoryRate: 14.5,
    skinTemp: 0.2,
    bloodOxygen: 98,
  }

  // Use real nutrition data from server with fallback to defaults
  const defaultNutritionData: NutritionData = {
    calories: { consumed: 0, target: 2000, burned: Math.round(today?.active_calories ?? 0) },
    protein: { consumed: 0, target: 150 },
    carbs: { consumed: 0, target: 250 },
    fat: { consumed: 0, target: 65 },
    water: { consumed: 0, target: 2500 },
    fiber: { consumed: 0, target: 30 },
  }
  const actualNutritionData = nutritionData ?? defaultNutritionData

  const mockBodyBattery = {
    current: 72,
    high: 95,
    low: 35,
    charged: 60,
    drained: 48,
  }

  const mockStressData = {
    current: 32,
    restTime: 320,
    stressTime: 180,
    average: 38,
    timeline: Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      level: 20 + Math.random() * 40,
    })),
  }

  const mockReadinessData = {
    score: 82,
    factors: { sleep: 88, recovery: 78, activity: 85, hrv: 72, restingHR: 90 },
    recommendation: 'Your body is ready for intense training today. Consider a HIIT session or long run.',
  }

  const mockWellnessData = {
    sleep: 85,
    activity: 78,
    nutrition: 72,
    stress: 35,
    recovery: 82,
    mindfulness: 60,
  }

  const mockRespiratoryData = {
    current: 14.5,
    average: 14.2,
    min: 12,
    max: 18,
    trend: Array.from({ length: 12 }, (_, i) => ({ time: `${i * 2}:00`, rate: 12 + Math.random() * 4 })),
  }

  const mockSpO2Data = {
    current: 98,
    average: 97,
    lowest: 94,
    timeline: Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, value: 95 + Math.random() * 4 })),
  }

  const mockSkinTempData = {
    current: 36.8,
    baseline: 36.5,
    deviation: 0.3,
    history: chartData.map((d) => ({ date: d.date, temp: 36.3 + Math.random() * 0.8 })),
  }

  const mockLeaderboardData = {
    friends: [
      { name: 'Sarah M.', avatar: 'S', steps: 15420 },
      { name: 'Mike R.', avatar: 'M', steps: 12850 },
      { name: 'You', avatar: profile?.display_name?.[0] || 'Y', steps: weeklySteps },
      { name: 'Alex K.', avatar: 'A', steps: 9200 },
      { name: 'Emma L.', avatar: 'E', steps: 8100 },
    ].sort((a, b) => b.steps - a.steps),
    rank: 3,
    totalParticipants: 28,
  }

  const mockSleepData = {
    awake: 25,
    rem: 90,
    light: 180,
    deep: 75,
    totalHours: avgSleep > 0 ? avgSleep / 60 : 7.2,
    quality: 78,
  }

  const mockSleepTrend = chartData.map((d) => ({
    date: d.date,
    hours: 6 + Math.random() * 2.5,
    quality: 60 + Math.random() * 30,
  }))

  const mockHeartZones = [
    { name: 'Rest', min: 0, max: 60, minutes: 480, color: '#6B7280', description: 'Recovery' },
    { name: 'Fat Burn', min: 60, max: 100, minutes: 320, color: '#3B82F6', description: 'Light activity' },
    { name: 'Cardio', min: 100, max: 140, minutes: 85, color: '#22C55E', description: 'Moderate' },
    { name: 'Peak', min: 140, max: 180, minutes: 25, color: '#F97316', description: 'Intense' },
    { name: 'Max', min: 180, max: 220, minutes: 5, color: '#EF4444', description: 'Maximum effort' },
  ]

  const mockStrainTrend = chartData.map((d, i) => ({
    date: d.date,
    strain: 8 + Math.random() * 10,
    recovery: 50 + Math.random() * 40,
  }))

  const mockGoals = [
    { name: 'Steps', current: today?.steps ?? 0, target: 10000, unit: 'steps', icon: '👟' },
    { name: 'Calories', current: Math.round(today?.active_calories ?? 0), target: 500, unit: 'kcal', icon: '🔥' },
    { name: 'Distance', current: Number(((today?.distance_meters ?? 0) / 1000).toFixed(1)), target: 8, unit: 'km', icon: '📍' },
    { name: 'Water', current: Number((waterConsumed / 1000).toFixed(1)), target: actualNutritionData.water.target / 1000, unit: 'L', icon: '💧' },
  ]

  const mockStreaks = [
    { name: 'Step Goal', current: 12, best: 21, icon: '🚶', color: '#8B5CF6' },
    { name: 'Move Ring', current: 8, best: 14, icon: '🔥', color: '#EF4444' },
    { name: 'Sleep Goal', current: 5, best: 10, icon: '😴', color: '#3B82F6' },
    { name: 'Workout', current: 3, best: 7, icon: '💪', color: '#22C55E' },
  ]

  const mockWorkouts = [
    { id: '1', type: 'Morning Run', date: 'Today, 7:30 AM', duration: 32, calories: 285, icon: '🏃' },
    { id: '2', type: 'Strength Training', date: 'Yesterday', duration: 45, calories: 320, icon: '🏋️' },
    { id: '3', type: 'Cycling', date: '2 days ago', duration: 55, calories: 410, icon: '🚴' },
  ]

  const displayInsights = insights.length > 0 ? insights.map((i) => ({
    ...i,
    priority: (i.priority || 'medium') as 'low' | 'medium' | 'high',
    actionable: 'Learn more',
  })) : [
    { id: '1', category: 'sleep', title: 'Great sleep consistency!', content: 'Your sleep schedule has been very consistent this week.', priority: 'low' as const, actionable: 'View details' },
    { id: '2', category: 'activity', title: 'Step goal achieved', content: 'You hit your 10,000 step goal 5 times this week.', priority: 'medium' as const, actionable: 'Adjust goals' },
    { id: '3', category: 'heart', title: 'HRV trending up', content: 'Your heart rate variability improved 8% this week.', priority: 'low' as const, actionable: 'See trends' },
  ]

  // CGM/Glucose mock data
  const mockGlucoseData = {
    current: 98,
    trend: 'stable' as const,
    average: 112,
    gmi: 5.8,
    variability: 28,
    timeInRange: { low: 3, inRange: 82, high: 15 },
    readings: Array.from({ length: 48 }, (_, i) => {
      const hour = Math.floor(i / 2)
      const minute = (i % 2) * 30
      const baseValue = 95 + Math.sin(hour / 3) * 20 + Math.random() * 15
      // Add meal spikes
      const mealSpike = (hour === 8 || hour === 13 || hour === 19) ? 40 * Math.exp(-(minute / 30)) : 0
      return {
        timestamp: new Date(Date.now() - (47 - i) * 30 * 60 * 1000).toISOString(),
        value: Math.round(baseValue + mealSpike),
        trend: 'stable' as const,
      }
    }),
    meals: [
      { timestamp: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(), name: 'Breakfast', calories: 380, carbs: 45 },
      { timestamp: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(), name: 'Lunch', calories: 520, carbs: 55 },
      { timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), name: 'Dinner', calories: 650, carbs: 70 },
    ],
  }

  const mockGlucoseImpacts = [
    { meal: 'Oatmeal with Berries', carbs: 45, glucoseBefore: 92, glucosePeak: 138, glucoseAfter2h: 102, peakTime: 45, recovery: 90, score: 'good' as const },
    { meal: 'Grilled Chicken Salad', carbs: 25, glucoseBefore: 98, glucosePeak: 118, glucoseAfter2h: 95, peakTime: 35, recovery: 60, score: 'excellent' as const },
    { meal: 'Pasta with Marinara', carbs: 75, glucoseBefore: 95, glucosePeak: 172, glucoseAfter2h: 125, peakTime: 55, recovery: 150, score: 'poor' as const },
  ]

  // Infographic mock data
  const mockPersonalRecords = [
    { metric: 'Most Steps', value: 24850, unit: 'steps', date: 'Dec 15, 2024', icon: '👟', improvement: 12 },
    { metric: 'Longest Run', value: 15.2, unit: 'km', date: 'Nov 28, 2024', icon: '🏃', improvement: 8 },
    { metric: 'Best Sleep', value: 9.2, unit: 'hours', date: 'Jan 1, 2025', icon: '😴' },
    { metric: 'Lowest RHR', value: 48, unit: 'bpm', date: 'Jan 10, 2025', icon: '❤️', improvement: 5 },
  ]

  const mockStatCards = [
    { label: 'Weekly Steps', value: weeklySteps, unit: '', change: 12, changeLabel: 'vs last week', sparkline: [6500, 8200, 7800, 9100, 8500, 10200, 9800], color: '#8B5CF6', icon: '👟' },
    { label: 'Avg Heart Rate', value: 72, unit: 'bpm', change: -3, changeLabel: 'vs last week', sparkline: [75, 74, 73, 72, 74, 71, 72], color: '#EF4444', icon: '❤️' },
    { label: 'Sleep Score', value: 85, unit: '', change: 8, changeLabel: 'vs last week', sparkline: [78, 82, 80, 85, 83, 88, 85], color: '#3B82F6', icon: '😴' },
    { label: 'Calories', value: Math.round(weeklyCalories), unit: 'kcal', change: 5, changeLabel: 'vs last week', sparkline: [420, 380, 450, 520, 480, 510, 490], color: '#F97316', icon: '🔥' },
  ]

  const mockCorrelationData = {
    metrics: ['Sleep', 'HRV', 'Steps', 'Stress', 'Recovery'],
    correlations: [
      [1.0, 0.8, 0.3, -0.6, 0.7],
      [0.8, 1.0, 0.2, -0.5, 0.9],
      [0.3, 0.2, 1.0, 0.1, 0.4],
      [-0.6, -0.5, 0.1, 1.0, -0.7],
      [0.7, 0.9, 0.4, -0.7, 1.0],
    ],
  }

  const mockPercentileRankings = [
    { metric: 'Daily Steps', value: today?.steps ?? 8500, unit: 'steps', percentile: 78, demographic: 'Males 25-34', icon: '👟' },
    { metric: 'Resting HR', value: 58, unit: 'bpm', percentile: 85, demographic: 'Your age group', icon: '❤️' },
    { metric: 'Sleep Duration', value: 7.5, unit: 'hours', percentile: 62, demographic: 'Adults', icon: '😴' },
    { metric: 'VO2 Max', value: 48, unit: 'ml/kg/min', percentile: 72, demographic: 'Males 25-34', icon: '🫁' },
  ]

  const mockMonthlyReview = {
    month: 'January 2025',
    highlights: [
      { label: 'Total Steps', value: '285K', icon: '👟', change: 15 },
      { label: 'Workouts', value: '18', icon: '💪', change: 20 },
      { label: 'Avg Sleep', value: '7.4h', icon: '😴', change: 5 },
    ],
    topDay: { date: 'Jan 15', metric: 'steps', value: '18,420' },
    totalActive: 26,
    avgDaily: { steps: 9500, calories: 2200, sleep: 7.4 },
    streakDays: 12,
    achievements: ['🏆', '🎯', '🔥', '💪', '⭐'],
  }

  const mockTrendPrediction = {
    metric: 'Weekly Steps',
    current: 68000,
    predicted: 75000,
    confidence: 82,
    trend: 'up' as const,
    timeframe: 'Next Week',
    historicalData: [
      { date: 'W1', actual: 52000 },
      { date: 'W2', actual: 58000 },
      { date: 'W3', actual: 61000 },
      { date: 'W4', actual: 68000 },
      { date: 'W5', actual: 68000, predicted: 72000 },
      { date: 'W6', actual: 72000, predicted: 75000 },
    ],
  }

  const mockShareableCard = {
    metric: 'Steps This Month',
    value: 285420,
    unit: 'steps',
    achievement: 'You walked the equivalent of 3 marathons this month!',
    date: 'January 2025',
    comparison: 'Top 15% of KQuarks users',
    gradient: 'from-emerald-500 to-teal-600',
  }

  const mockTimelineEvents = [
    { time: '6:30 AM', type: 'sleep' as const, title: 'Wake Up', description: 'Slept 7h 42m with 92% efficiency', icon: '😴', value: '92% quality' },
    { time: '7:15 AM', type: 'activity' as const, title: 'Morning Run', description: '5.2 km in 28 minutes', icon: '🏃', value: '320 cal' },
    { time: '8:00 AM', type: 'meal' as const, title: 'Breakfast', description: 'Oatmeal with berries and coffee', icon: '🍳', value: '380 kcal' },
    { time: '12:30 PM', type: 'meal' as const, title: 'Lunch', description: 'Grilled chicken salad', icon: '🥗', value: '520 kcal' },
    { time: '3:00 PM', type: 'achievement' as const, title: 'Goal Reached!', description: 'Hit 10,000 steps for the day', icon: '🎯' },
    { time: '6:00 PM', type: 'activity' as const, title: 'Gym Session', description: 'Strength training - Upper body', icon: '💪', value: '45 min' },
  ]

  const mockDataExplorerData = chartData.map((d, i) => ({
    date: d.date,
    steps: d.steps,
    calories: d.calories,
    sleep: 6.5 + Math.random() * 2,
    hrv: 45 + Math.random() * 20,
    stress: 30 + Math.random() * 30,
  }))

  const mockDataExplorerMetrics = [
    { key: 'steps', label: 'Steps', color: '#8B5CF6' },
    { key: 'calories', label: 'Calories', color: '#F97316' },
    { key: 'sleep', label: 'Sleep (hrs)', color: '#3B82F6' },
    { key: 'hrv', label: 'HRV', color: '#22C55E' },
    { key: 'stress', label: 'Stress', color: '#EF4444' },
  ]

  const mockLifetimeStats = {
    totalSteps: 4850000,
    totalCalories: 892000,
    totalDistance: 3420,
    totalWorkouts: 342,
    totalSleepHours: 2850,
    memberSince: 'Mar 2023',
    activeDays: 485,
    longestStreak: 45,
  }

  const mockComparisons = [
    { metric: 'Daily Steps', current: today?.steps ?? 8500, previous: 7200, unit: '', icon: '👟' },
    { metric: 'Active Calories', current: Math.round(today?.active_calories ?? 450), previous: 380, unit: 'kcal', icon: '🔥' },
    { metric: 'Sleep Duration', current: 7.5, previous: 6.8, unit: 'hrs', icon: '😴' },
    { metric: 'Resting HR', current: 58, previous: 62, unit: 'bpm', icon: '❤️' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold">K</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">KQuarks</h1>
          </div>
          <div className="flex items-center gap-4">
              <button
                aria-label="Notifications"
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                {(profile?.display_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                {profile?.display_name ?? user.email}
              </span>
            </div>
            <button onClick={handleSignOut} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome + Daily Tip */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Hello, {profile?.display_name?.split(' ')[0] ?? 'there'} 👋
          </h2>
          <DailyTip
            tip="Try to get 10 minutes of morning sunlight to boost your circadian rhythm and improve tonight's sleep quality."
            category="sleep"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <QuickActions />
        </div>

        {/* Key Stats with Sparklines */}
        <div className="mb-8">
          <StatCards stats={mockStatCards} />
        </div>

        {/* Strain + Recovery Row (Whoop-style) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <StrainGauge data={mockStrainData} />
          <RecoveryScore data={mockRecoveryData} />
        </div>

        {/* Body Battery + Readiness + Stress */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <BodyBattery data={mockBodyBattery} />
          <Readiness data={mockReadinessData} />
          <StressLevel data={mockStressData} />
        </div>

        {/* Goals Progress + Streaks */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <GoalsProgress goals={mockGoals} />
          </div>
          <StreaksCard streaks={mockStreaks} />
        </div>

        {/* Nutrition Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <NutritionOverview
              data={actualNutritionData}
              onMealSaved={refreshNutrition}
            />
          </div>
          <div className="mb-4">
  <div className="flex items-center gap-2 mb-1">
    <span className="text-blue-400 text-lg">💧</span>
    <span className="font-semibold text-text-primary">Hydration</span>
  </div>
  <HydrationMiniBar />
  <Link href="/hydration" className="text-xs text-primary underline mt-1">Smart hydration tracker →</Link>
</div>
        </div>

        {/* Meals + Macros */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <MealLog meals={meals} />
          <div className="space-y-6">
            <MacroDistribution
              protein={actualNutritionData.protein.consumed}
              carbs={actualNutritionData.carbs.consumed}
              fat={actualNutritionData.fat.consumed}
            />
            <FastingTimer
              initialSession={initialFastingSession}
              defaultProtocol={defaultFastingProtocol}
              defaultHours={defaultFastingHours}
              onSessionChanged={refreshNutrition}
            />
          </div>
        </div>

        {/* CGM / Glucose Monitoring Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">📊</span> Glucose Monitoring
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <CurrentGlucose data={mockGlucoseData} />
          <TimeInRange data={mockGlucoseData.timeInRange} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <GlucoseChart data={mockGlucoseData} />
          <DailyGlucosePattern readings={mockGlucoseData.readings} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <MealGlucoseImpact impacts={mockGlucoseImpacts} />
          <GlucoseInsights data={mockGlucoseData} />
        </div>

        {/* Wellness Radar + Vitals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <WellnessRadar data={mockWellnessData} />
          <BloodOxygen data={mockSpO2Data} />
          <RespiratoryRate data={mockRespiratoryData} />
        </div>

        {/* Sleep Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <SleepAnalysis data={mockSleepData} />
          <HeartRateZones zones={mockHeartZones} />
        </div>

        {/* Sleep Trend + HRV + Skin Temp */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <SleepTrend data={mockSleepTrend} />
          <HRVCard current={52} average={48} trend="up" />
          <SkinTemperature data={mockSkinTempData} />
        </div>

        {/* Strain vs Recovery Trend + Training Load */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <StrainTrend data={mockStrainTrend} />
          <TrainingLoad weeklyLoad={[850, 920, 780, 1100, 950, 1200, 1050]} optimalRange={[800, 1100]} />
        </div>

        {/* Activity Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daily Steps</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <defs>
                    <linearGradient id="stepsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '12px' }} />
                  <Bar dataKey="steps" fill="url(#stepsGradient)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                Sync from iOS app to see your stats
              </div>
            )}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Calories Burned</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '12px' }} />
                  <Line type="monotone" dataKey="calories" stroke="#F97316" strokeWidth={3} dot={{ fill: '#F97316', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Weekly Comparison */}
        <div className="mb-8">
          <WeeklyComparison
            thisWeek={{ steps: weeklySteps, calories: Math.round(weeklyCalories), distance: Number((summaries.reduce((s, d) => s + d.distance_meters, 0) / 1000).toFixed(1)), activeMinutes: 285 }}
            lastWeek={{ steps: Math.round(weeklySteps * 0.85), calories: Math.round(weeklyCalories * 0.9), distance: Number((summaries.reduce((s, d) => s + d.distance_meters, 0) / 1000 * 0.88).toFixed(1)), activeMinutes: 250 }}
          />
        </div>

        {/* Workouts + Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RecentWorkouts workouts={mockWorkouts} />
          <Leaderboard data={mockLeaderboardData} />
        </div>

        {/* Activity Heatmap */}
        <div className="mb-8">
          <ActivityHeatmap
            data={summaries.map((s) => ({
              date: s.date,
              steps: s.steps,
              level: (s.steps > 12000 ? 4 : s.steps > 8000 ? 3 : s.steps > 4000 ? 2 : s.steps > 1000 ? 1 : 0) as 0 | 1 | 2 | 3 | 4,
            }))}
            weeks={12}
          />
        </div>

        {/* ============================================ */}
        {/* INFOGRAPHICS & STATS SECTION */}
        {/* ============================================ */}

        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">📈</span> Your Stats & Insights
          </h2>
        </div>

        {/* Personal Records + Monthly Review */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <PersonalRecords records={mockPersonalRecords} />
          <MonthlyReview data={mockMonthlyReview} />
        </div>

        {/* Timeline + Comparisons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <HealthTimeline events={mockTimelineEvents} />
          <ComparisonCards comparisons={mockComparisons} periodLabel="Last Week" />
        </div>

        {/* Percentile Rankings + Correlations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <PercentileRankings rankings={mockPercentileRankings} />
          <CorrelationMatrix data={mockCorrelationData} />
        </div>

        {/* Data Explorer */}
        <div className="mb-8">
          <DataExplorer data={mockDataExplorerData} metrics={mockDataExplorerMetrics} />
        </div>

        {/* Trend Prediction + Shareable Card + Lifetime Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <TrendPrediction data={mockTrendPrediction} />
          <ShareableStatCard data={mockShareableCard} />
          <LifetimeStatsCard stats={mockLifetimeStats} />
        </div>

        {/* AI Insights */}
        <div className="mb-8">
          <AlertBanner />
          <InsightsCarousel insights={displayInsights} />
        </div>
      </main>
    </div>
  )
}
