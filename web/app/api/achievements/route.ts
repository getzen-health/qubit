import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface Streak {
  type: 'steps' | 'sleep' | 'workouts'
  label: string
  emoji: string
  currentCount: number
  nextMilestone: number
  progressPercent: number
}

interface Badge {
  id: string
  type: string
  title: string
  description: string
  icon: string
  rarity: 'bronze' | 'silver' | 'gold' | 'legendary'
  earnedAt: string
}

interface BadgeProgress {
  type: string
  title: string
  currentCount: number
  targetCount: number
  progressPercent: number
  nextMilestone: number
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Calculate streaks from daily_summaries
    const { data: dailySummaries } = await supabase
      .from('daily_summaries')
      .select('date, steps, sleep_duration_minutes')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(365)

    // Calculate workout count
    const { data: workouts } = await supabase
      .from('workout_records')
      .select('start_time')
      .eq('user_id', user.id)
      .gte('start_time', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())

    const streaks = calculateStreaks(dailySummaries, workouts)

    return NextResponse.json({
      streaks,
      earnedCount: 0,
    })
  } catch (error) {
    console.error('Achievement fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    )
  }
}

function calculateStreaks(
  summaries: any[] | null,
  workouts: any[] | null
): Streak[] {
  if (!summaries) summaries = []
  if (!workouts) workouts = []

  // Calculate steps streak - only continue if most recent date is today or yesterday
  let stepsCount = 0
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  
  // Check if streak is continuing (most recent entry is today or yesterday)
  const mostRecentSummary = summaries[0]
  const continueStreak = mostRecentSummary && (mostRecentSummary.date === today || mostRecentSummary.date === yesterday)
  
  if (continueStreak) {
    for (const summary of summaries) {
      if (summary.steps >= 8000) {
        stepsCount++
      } else {
        break
      }
    }
  }

  // Calculate sleep streak with same logic
  let sleepCount = 0
  if (continueStreak) {
    for (const summary of summaries) {
      if (summary.sleep_duration_minutes >= 420) { // 7 hours
        sleepCount++
      } else {
        break
      }
    }
  }

  // Calculate workout frequency (workouts per week)
  const now = new Date()
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const recentWorkouts = workouts.filter(
    w => new Date(w.start_time) >= twoWeeksAgo
  ).length

  return [
    {
      type: 'steps',
      label: 'Steps',
      emoji: '🚶',
      currentCount: stepsCount,
      nextMilestone: 30,
      progressPercent: Math.min(100, Math.round((stepsCount / 30) * 100)),
    },
    {
      type: 'sleep',
      label: 'Sleep Quality',
      emoji: '😴',
      currentCount: sleepCount,
      nextMilestone: 30,
      progressPercent: Math.min(100, Math.round((sleepCount / 30) * 100)),
    },
    {
      type: 'workouts',
      label: 'Workouts',
      emoji: '🏋️',
      currentCount: recentWorkouts,
      nextMilestone: 10,
      progressPercent: Math.min(100, Math.round((recentWorkouts / 10) * 100)),
    },
  ]
}
