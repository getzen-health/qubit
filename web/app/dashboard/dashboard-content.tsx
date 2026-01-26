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

  // Prepare chart data (reverse for chronological order)
  const chartData = [...summaries].reverse().map((s) => ({
    date: new Date(s.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    steps: s.steps,
    calories: Math.round(s.active_calories),
  }))

  // Get today's summary
  const today = summaries[0]

  // Calculate totals for the week
  const weeklySteps = summaries.reduce((sum, s) => sum + s.steps, 0)
  const weeklyCalories = summaries.reduce((sum, s) => sum + s.active_calories, 0)
  const avgSleep =
    summaries.filter((s) => s.sleep_duration_minutes).length > 0
      ? summaries
          .filter((s) => s.sleep_duration_minutes)
          .reduce((sum, s) => sum + (s.sleep_duration_minutes ?? 0), 0) /
        summaries.filter((s) => s.sleep_duration_minutes).length
      : 0

  // Calculate health score based on data
  const calculateHealthScore = () => {
    let score = 50 // Base score
    if (today?.steps > 10000) score += 15
    else if (today?.steps > 5000) score += 8
    if (avgSleep >= 420 && avgSleep <= 540) score += 20 // 7-9 hours
    else if (avgSleep >= 360) score += 10
    if (today?.active_calories > 300) score += 10
    return Math.min(score, 100)
  }

  // Mock data for demo (will be replaced with real data when available)
  const mockSleepData = {
    awake: 25,
    rem: 90,
    light: 180,
    deep: 75,
    totalHours: avgSleep > 0 ? avgSleep / 60 : 7.2,
    quality: 78,
  }

  const mockSleepTrend = chartData.map((d, i) => ({
    date: d.date,
    hours: 6 + Math.random() * 2.5,
    quality: 60 + Math.random() * 30,
  }))

  const mockHeatmapData = summaries.map((s) => ({
    date: s.date,
    steps: s.steps,
    level: (s.steps > 12000 ? 4 : s.steps > 8000 ? 3 : s.steps > 4000 ? 2 : s.steps > 1000 ? 1 : 0) as 0 | 1 | 2 | 3 | 4,
  }))

  const mockHeartRateData = Array.from({ length: 24 }, (_, i) => ({
    time: `${i.toString().padStart(2, '0')}:00`,
    bpm: 60 + Math.floor(Math.random() * 40) + (i > 8 && i < 20 ? 20 : 0),
  }))

  const mockHeartZones = [
    { name: 'Rest', min: 0, max: 60, minutes: 480, color: '#6B7280', description: 'Recovery' },
    { name: 'Fat Burn', min: 60, max: 100, minutes: 320, color: '#3B82F6', description: 'Light activity' },
    { name: 'Cardio', min: 100, max: 140, minutes: 85, color: '#22C55E', description: 'Moderate' },
    { name: 'Peak', min: 140, max: 180, minutes: 25, color: '#F97316', description: 'Intense' },
    { name: 'Max', min: 180, max: 220, minutes: 5, color: '#EF4444', description: 'Maximum effort' },
  ]

  const mockStreaks = [
    { name: 'Step Goal', current: 12, best: 21, icon: '🚶', color: '#8B5CF6' },
    { name: 'Move Ring', current: 8, best: 14, icon: '🔥', color: '#EF4444' },
    { name: 'Sleep Goal', current: 5, best: 10, icon: '😴', color: '#3B82F6' },
    { name: 'Workout', current: 3, best: 7, icon: '💪', color: '#22C55E' },
  ]

  const mockGoals = [
    { name: 'Steps', current: today?.steps ?? 0, target: 10000, unit: 'steps', icon: '👟' },
    { name: 'Active Calories', current: Math.round(today?.active_calories ?? 0), target: 500, unit: 'kcal', icon: '🔥' },
    { name: 'Distance', current: Number(((today?.distance_meters ?? 0) / 1000).toFixed(1)), target: 8, unit: 'km', icon: '📍' },
    { name: 'Stand Hours', current: 10, target: 12, unit: 'hours', icon: '🧍' },
  ]

  const mockBadges = [
    { name: '10K Steps', icon: '🏅', earned: true, description: 'Walk 10,000 steps in a day' },
    { name: 'Early Bird', icon: '🌅', earned: true, description: 'Complete a workout before 7am' },
    { name: 'Marathon', icon: '🏃', earned: false, description: 'Run a total of 42km' },
    { name: 'Sleep Pro', icon: '😴', earned: true, description: 'Get 8 hours of sleep for 7 days' },
    { name: 'Cardio King', icon: '❤️', earned: false, description: 'Spend 60 mins in cardio zone' },
    { name: 'Streak Master', icon: '🔥', earned: true, description: 'Maintain a 7-day streak' },
    { name: 'Night Owl', icon: '🦉', earned: false, description: 'Log a late night workout' },
    { name: 'Champion', icon: '🏆', earned: false, description: 'Complete all weekly goals' },
  ]

  const mockChallenge = {
    name: '50K Steps Challenge',
    description: 'Walk 50,000 steps this week to earn bonus points',
    progress: Math.min(Math.round((weeklySteps / 50000) * 100), 100),
    reward: '🎖️ Gold Badge + 500 XP',
    daysLeft: 4,
  }

  const mockWorkouts = [
    { id: '1', type: 'Morning Run', date: 'Today, 7:30 AM', duration: 32, calories: 285, icon: '🏃' },
    { id: '2', type: 'Strength Training', date: 'Yesterday', duration: 45, calories: 320, icon: '🏋️' },
    { id: '3', type: 'Cycling', date: '2 days ago', duration: 55, calories: 410, icon: '🚴' },
  ]

  const mockWorkoutTypes = [
    { type: 'Running', count: 8, color: '#EF4444' },
    { type: 'Cycling', count: 5, color: '#3B82F6' },
    { type: 'Strength', count: 6, color: '#8B5CF6' },
    { type: 'Yoga', count: 3, color: '#22C55E' },
  ]

  const formattedInsights = insights.map((i) => ({
    ...i,
    priority: (i.priority || 'medium') as 'low' | 'medium' | 'high',
    actionable: 'Learn more',
  }))

  // Add demo insights if none exist
  const displayInsights = formattedInsights.length > 0 ? formattedInsights : [
    { id: '1', category: 'sleep', title: 'Great sleep consistency!', content: 'Your sleep schedule has been very consistent this week. Keep maintaining your bedtime routine.', priority: 'low' as const, actionable: 'View sleep details' },
    { id: '2', category: 'activity', title: 'Step goal achieved', content: 'You hit your 10,000 step goal 5 times this week. Try increasing your target to 12,000 steps.', priority: 'medium' as const, actionable: 'Adjust goals' },
    { id: '3', category: 'heart', title: 'Elevated resting heart rate', content: 'Your resting heart rate was higher than usual yesterday. Consider taking a rest day.', priority: 'high' as const, actionable: 'See heart data' },
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
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome message */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Hello, {profile?.display_name?.split(' ')[0] ?? 'there'} 👋
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Here&apos;s your health overview for today
          </p>
        </div>

        {/* Health Score + Weekly Challenge Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <HealthScore
            score={calculateHealthScore()}
            label="Overall Health Score"
            trend="up"
            trendValue={5}
          />
          <WeeklyChallenge challenge={mockChallenge} />
        </div>

        {/* Health Score Grid */}
        <div className="mb-8">
          <HealthScoreGrid
            scores={[
              { label: 'Activity', score: Math.min(Math.round((today?.steps ?? 0) / 100), 100), icon: '🏃' },
              { label: 'Sleep', score: mockSleepData.quality, icon: '😴' },
              { label: 'Heart', score: 85, icon: '❤️' },
              { label: 'Recovery', score: 72, icon: '🧘' },
            ]}
          />
        </div>

        {/* Goals Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <GoalsProgress goals={mockGoals} />
          </div>
          <StreaksCard streaks={mockStreaks} />
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Steps Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Daily Steps
            </h3>
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
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    labelStyle={{ color: '#9CA3AF' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="steps" fill="url(#stepsGradient)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No data available. Sync from your iOS app to see your stats.
              </div>
            )}
          </div>

          {/* Calories Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Calories Burned
            </h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="caloriesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F97316" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#F97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="calories"
                    stroke="#F97316"
                    strokeWidth={3}
                    dot={{ fill: '#F97316', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No data available.
              </div>
            )}
          </div>
        </div>

        {/* Weekly Comparison */}
        <div className="mb-8">
          <WeeklyComparison
            thisWeek={{
              steps: weeklySteps,
              calories: Math.round(weeklyCalories),
              distance: Number((summaries.reduce((s, d) => s + d.distance_meters, 0) / 1000).toFixed(1)),
              activeMinutes: 285,
            }}
            lastWeek={{
              steps: Math.round(weeklySteps * 0.85),
              calories: Math.round(weeklyCalories * 0.9),
              distance: Number((summaries.reduce((s, d) => s + d.distance_meters, 0) / 1000 * 0.88).toFixed(1)),
              activeMinutes: 250,
            }}
          />
        </div>

        {/* Sleep & Heart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <SleepAnalysis data={mockSleepData} />
          <HeartRateZones zones={mockHeartZones} />
        </div>

        {/* Sleep Trend & HRV */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <SleepTrend data={mockSleepTrend} />
          </div>
          <HRVCard current={48} average={45} trend="up" />
        </div>

        {/* Heart Rate Chart */}
        <div className="mb-8">
          <HeartRateChart data={mockHeartRateData} />
        </div>

        {/* Activity Heatmap */}
        <div className="mb-8">
          <ActivityHeatmap data={mockHeatmapData} weeks={12} />
        </div>

        {/* Workouts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <RecentWorkouts workouts={mockWorkouts} />
          </div>
          <div className="space-y-6">
            <WorkoutStats
              stats={{
                thisWeek: 5,
                lastWeek: 4,
                totalMinutes: 185,
                totalCalories: 1420,
              }}
            />
            <WorkoutDistribution data={mockWorkoutTypes} />
          </div>
        </div>

        {/* Achievements */}
        <div className="mb-8">
          <AchievementBadges badges={mockBadges} />
        </div>

        {/* AI Insights */}
        <div className="mb-8">
          <InsightsCarousel insights={displayInsights} />
        </div>
      </main>
    </div>
  )
}
