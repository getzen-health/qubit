'use client'

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
import { BodyBattery, BodyBatteryTrend, StressLevel, Readiness, SleepDebt } from './components/body-battery'
import { RespiratoryRate, BloodOxygen, SkinTemperature, WellnessRadar, MenstrualCycle, Leaderboard, QuickActions, DailyTip } from './components/advanced-metrics'
import { CurrentGlucose, GlucoseChart, TimeInRange, MealGlucoseImpact, GlucoseInsights, DailyGlucosePattern } from './components/glucose-monitor'

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
}

export function DashboardContent({
  user,
  profile,
  summaries,
  insights,
}: DashboardContentProps) {
  const router = useRouter()
  const supabase = createClient()

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

  const mockNutritionData = {
    calories: { consumed: 1650, target: 2200, burned: 485 },
    protein: { consumed: 95, target: 150 },
    carbs: { consumed: 180, target: 250 },
    fat: { consumed: 55, target: 70 },
    water: { consumed: 1800, target: 2500 },
    fiber: { consumed: 22, target: 30 },
  }

  const mockMeals = [
    { id: '1', name: 'Breakfast - Oatmeal & Berries', time: '7:30 AM', calories: 380, protein: 12, carbs: 65, fat: 8 },
    { id: '2', name: 'Lunch - Grilled Chicken Salad', time: '12:30 PM', calories: 520, protein: 42, carbs: 28, fat: 22 },
    { id: '3', name: 'Snack - Protein Shake', time: '3:30 PM', calories: 280, protein: 30, carbs: 15, fat: 8 },
    { id: '4', name: 'Dinner - Salmon & Vegetables', time: '7:00 PM', calories: 470, protein: 38, carbs: 32, fat: 18 },
  ]

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
    { name: 'Water', current: 1.8, target: 2.5, unit: 'L', icon: '💧' },
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold">Q</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Quarks</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition">
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
            <NutritionOverview data={mockNutritionData} />
          </div>
          <WaterTracker consumed={mockNutritionData.water.consumed} target={mockNutritionData.water.target} />
        </div>

        {/* Meals + Macros */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <MealLog meals={mockMeals} />
          <div className="space-y-6">
            <MacroDistribution protein={mockNutritionData.protein.consumed} carbs={mockNutritionData.carbs.consumed} fat={mockNutritionData.fat.consumed} />
            <FastingTimer startTime={null} targetHours={16} />
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

        {/* AI Insights */}
        <div className="mb-8">
          <InsightsCarousel insights={displayInsights} />
        </div>
      </main>
    </div>
  )
}
