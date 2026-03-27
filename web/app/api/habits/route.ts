import { z } from 'zod'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'
import { calculateStreak, calculateLevel } from '@/lib/habits'

const habitSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  target_count: z.number().int().positive().max(100).default(1),
  icon: z.string().max(10).optional(),
  color: z.string().max(20).optional(),
})

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
  { rateLimit: 'healthData', requireAuth: true, bodySchema: habitSchema },
  async (_req, { user, supabase, body }) => {
    const { name, description, frequency, target_count, icon, color } = body as z.infer<typeof habitSchema>

    const { data, error } = await supabase
      .from('habits')
      .insert({
        user_id: user!.id,
        name: name.trim(),
        description: description ?? null,
        frequency,
        target_count,
        icon: icon ?? '✅',
        color: color ?? null,
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
