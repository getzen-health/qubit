import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'
import { calculateStreak, calculateLevel } from '@/lib/habits'

// GET: today's habits + completion status + streaks + user level + recent achievements
export async function GET(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().slice(0, 10)
  const since90 = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)

  const [
    { data: habits },
    { data: todayLogs },
    { data: allLogs },
    { data: userAchievements },
    { data: xpRows },
  ] = await Promise.all([
    supabase.from('habits').select('*').eq('user_id', user.id).eq('is_active', true).order('created_at'),
    supabase.from('habit_logs').select('*').eq('user_id', user.id).eq('completed_at', today),
    supabase.from('habit_logs').select('habit_id,completed_at,skipped,xp_earned').eq('user_id', user.id).gte('completed_at', since90).order('completed_at', { ascending: false }),
    supabase.from('user_achievements').select('*').eq('user_id', user.id),
    supabase.from('habit_logs').select('xp_earned').eq('user_id', user.id).eq('skipped', false),
  ])

  const totalXp = (xpRows ?? []).reduce((s, r) => s + (r.xp_earned ?? 0), 0)
  const level = calculateLevel(totalXp)

  const streaks: Record<string, ReturnType<typeof calculateStreak>> = {}
  for (const habit of habits ?? []) {
    const habitLogs = (allLogs ?? []).filter(l => l.habit_id === habit.id)
    streaks[habit.id] = calculateStreak(habitLogs, habit.frequency, habit.custom_days)
  }

  // Include last 7 days of logs for weekly trend chart
  const since7 = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const recentLogs = (allLogs ?? []).filter(l => l.completed_at >= since7)

  return NextResponse.json({
    habits: habits ?? [],
    todayLogs: todayLogs ?? [],
    recentLogs,
    streaks,
    level,
    achievements: userAchievements ?? [],
  })
}

// POST: create a new habit
export async function POST(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, emoji, category, frequency, custom_days, time_of_day, anchor, tiny_version, target_streak, xp_per_completion } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: user.id,
      name: name.trim(),
      emoji: emoji ?? '✅',
      category: category ?? 'custom',
      frequency: frequency ?? 'daily',
      custom_days: custom_days ?? null,
      time_of_day: time_of_day ?? 'anytime',
      anchor: anchor ?? null,
      tiny_version: tiny_version ?? null,
      target_streak: target_streak ?? 66,
      xp_per_completion: xp_per_completion ?? 10,
      is_active: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ habit: data }, { status: 201 })
}

// DELETE: soft-delete a habit
export async function DELETE(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Habit id required' }, { status: 400 })

  const { error } = await supabase
    .from('habits')
    .update({ is_active: false })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
