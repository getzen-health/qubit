import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface MoodEntry { mood_score: number; logged_at: string }
interface DailySummary { date: string; steps: number; active_calories: number; resting_hr: number | null }
interface SleepRecord { sleep_date: string; total_sleep_minutes: number }

function pearsonCorr(xs: number[], ys: number[]): number {
  const n = xs.length
  if (n < 3) return 0
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  const num = xs.reduce((sum, x, i) => sum + (x - mx) * (ys[i] - my), 0)
  const den = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0) * ys.reduce((s, y) => s + (y - my) ** 2, 0))
  return den === 0 ? 0 : Math.round((num / den) * 100) / 100
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const since = new Date()
  since.setDate(since.getDate() - 30)

  const [moodRes, stepsRes, sleepRes] = await Promise.all([
    supabase.from('mood_entries').select('mood_score, logged_at').eq('user_id', user.id).gte('logged_at', since.toISOString()).order('logged_at'),
    supabase.from('daily_summaries').select('date, steps, resting_hr').eq('user_id', user.id).gte('date', since.toISOString().split('T')[0]).order('date'),
    supabase.from('sleep_records').select('sleep_date, total_sleep_minutes').eq('user_id', user.id).gte('sleep_date', since.toISOString().split('T')[0]).order('sleep_date'),
  ])

  const moods = moodRes.data ?? []
  const steps = stepsRes.data ?? []
  const sleep = sleepRes.data ?? []

  // Build date-keyed maps
  const moodByDate: Record<string, number> = {}
  for (const m of moods) {
    const d = m.logged_at.split('T')[0]
    moodByDate[d] = (moodByDate[d] ?? 0 + m.mood_score) / (moodByDate[d] ? 2 : 1)
  }
  const stepsByDate: Record<string, number> = Object.fromEntries(steps.map((s: DailySummary) => [s.date, s.steps]))
  const sleepByDate: Record<string, number> = Object.fromEntries(sleep.map((s: SleepRecord) => [s.sleep_date, s.total_sleep_minutes / 60]))

  // Paired arrays for correlation
  const allDates = [...new Set([...Object.keys(moodByDate)])]
  const moodArr = allDates.map(d => moodByDate[d]).filter(Boolean)
  const stepsArr = allDates.filter(d => moodByDate[d]).map(d => stepsByDate[d] ?? 0)
  const sleepArr = allDates.filter(d => moodByDate[d]).map(d => sleepByDate[d] ?? 0)

  const correlations = {
    mood_vs_steps: pearsonCorr(moodArr, stepsArr),
    mood_vs_sleep: pearsonCorr(moodArr, sleepArr),
  }

  // Chart data: daily joined points
  const chartData = allDates.map(date => ({
    date: new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    mood: moodByDate[date] ?? null,
    steps: stepsByDate[date] ?? null,
    sleep_h: sleepByDate[date] ? Math.round(sleepByDate[date] * 10) / 10 : null,
  })).slice(-30)

  // Pattern insights
  const patterns: string[] = []
  const goodSleepDays = allDates.filter(d => sleepByDate[d] >= 7 && moodByDate[d])
  const poorSleepDays = allDates.filter(d => sleepByDate[d] < 6 && sleepByDate[d] > 0 && moodByDate[d])
  if (goodSleepDays.length >= 3 && poorSleepDays.length >= 3) {
    const avgMoodGoodSleep = goodSleepDays.reduce((s, d) => s + moodByDate[d], 0) / goodSleepDays.length
    const avgMoodPoorSleep = poorSleepDays.reduce((s, d) => s + moodByDate[d], 0) / poorSleepDays.length
    if (avgMoodGoodSleep > avgMoodPoorSleep + 0.5) {
      patterns.push(`Your mood averages ${avgMoodGoodSleep.toFixed(1)}/5 on days with 7+ hours of sleep vs ${avgMoodPoorSleep.toFixed(1)}/5 with under 6 hours.`)
    }
  }
  const highStepDays = allDates.filter(d => (stepsByDate[d] ?? 0) >= 8000 && moodByDate[d])
  if (highStepDays.length >= 3) {
    const avgMood = highStepDays.reduce((s, d) => s + moodByDate[d], 0) / highStepDays.length
    patterns.push(`On days you hit 8,000+ steps, your average mood is ${avgMood.toFixed(1)}/5.`)
  }

  return NextResponse.json({ correlations, chartData, patterns, dataPoints: allDates.length })
}
