import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'
import { calculateStreak, calculateLevel } from '@/lib/habits'

// GET: today's habits + completion status + streaks + user level + recent achievements
export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const today = new Date().toISOString().slice(0, 10)
    const since90 = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)

    const [
      { data: habits },
      { data: todayLogs },
      { data: allLogs },
      { data: userAchievements },
      { data: xpRows },
    ] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', user!.id).eq('is_active', true).order('created_at'),
      supabase.from('habit_logs').select('*').eq('user_id', user!.id).eq('completed_at', today),
      supabase.from('habit_logs').select('habit_id,completed_at,skipped,xp_earned').eq('user_id', user!.id).gte('completed_at', since90).order('completed_at', { ascending: false }),
      supabase.from('user_achievements').select('*').eq('user_id', user!.id),
      supabase.from('habit_logs').select('xp_earned').eq('user_id', user!.id).eq('skipped', false),
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

    return secureJsonResponse({
      habits: habits ?? [],
      todayLogs: todayLogs ?? [],
      recentLogs,
      streaks,
      level,
      achievements: userAchievements ?? [],
    })
  }
)

// POST: create a new habit
export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const body = await req.json()
    const { name, emoji, category, frequency, custom_days, time_of_day, anchor, tiny_version, target_streak, xp_per_completion } = body

    if (!name?.trim()) return secureErrorResponse('Name is required', 400)

    const { data, error } = await supabase
      .from('habits')
      .insert({
        user_id: user!.id,
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

    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ habit: data }, 201)
  }
)

// DELETE: soft-delete a habit
export const DELETE = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const { id } = await req.json()
    if (!id) return secureErrorResponse('Habit id required', 400)

    const { error } = await supabase
      .from('habits')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', user!.id)

    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ success: true })
  }
)
