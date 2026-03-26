import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'

function getTrend(moods: number[]) {
  if (moods.length < 2) return 'stable'
  const diff = moods[moods.length - 1] - moods[0]
  if (diff > 1) return 'improving'
  if (diff < -1) return 'declining'
  return 'stable'
}

export async function GET(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data: entries, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('entry_date', { ascending: true })
    .gte('entry_date', new Date(Date.now() - 1209600000).toISOString().slice(0, 10)) // last 14 days
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const moods = entries.map(e => e.mood_score).filter(Boolean)
  const avgMood = moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null
  const trend = getTrend(moods)

  // Streak
  let streak = 0, prev = null
  for (const e of [...entries].reverse()) {
    if (prev && new Date(e.entry_date).getTime() !== prev + 86400000) break
    streak++
    prev = new Date(e.entry_date).getTime()
  }

  // Low mood streak
  let lowStreak = 0, maxLowStreak = 0
  for (const e of entries) {
    if (e.mood_score && e.mood_score <= 4) lowStreak++
    else lowStreak = 0
    if (lowStreak > maxLowStreak) maxLowStreak = lowStreak
  }
  let alert = null
  if (maxLowStreak >= 3) alert = { alert: 'low_mood_streak', days: maxLowStreak }

  // Correlation: low mood + low sleep
  let lowMoodDays = entries.filter(e => e.mood_score && e.mood_score <= 4)
  let lowSleepDays = entries.filter(e => e.sleep_hours && e.sleep_hours <= 5)
  let correlation = null
  if (lowMoodDays.length && lowSleepDays.length) {
    const overlap = lowMoodDays.filter(e => lowSleepDays.some(s => s.entry_date === e.entry_date))
    if (overlap.length >= 2) correlation = 'low_mood_sleep'
  }

  return NextResponse.json({ avgMood, trend, streak, alert, correlation })
}
