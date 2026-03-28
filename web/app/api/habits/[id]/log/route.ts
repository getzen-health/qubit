import { apiLogger } from '@/lib/api-logger'
import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { calculateStreak, checkAchievements, ACHIEVEMENTS } from '@/lib/habits'

// POST: mark habit complete or skipped for today; award XP; check achievements
export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const habitId = req.nextUrl.pathname.split('/').at(-2)!
    const body = await req.json()
    const { skipped = false, note } = body
    const today = new Date().toISOString().slice(0, 10)

    const { data: habit, error: habitErr } = await supabase
      .from('habits')
      .select('*')
      .eq('id', habitId)
      .eq('user_id', user!.id)
      .single()

    if (habitErr || !habit) return secureErrorResponse('Habit not found', 404)

    const xpEarned = skipped ? 0 : (habit.xp_per_completion ?? 10)

    const { data: log, error: logErr } = await supabase
      .from('habit_logs')
      .upsert(
        { user_id: user!.id, habit_id: habitId, completed_at: today, skipped, note: note ?? null, xp_earned: xpEarned },
        { onConflict: 'user_id,habit_id,completed_at' }
      )
      .select()
      .single()

    if (logErr) return secureErrorResponse('Failed to log habit', 500)

    const since90 = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)
    const [
      { data: allLogs },
      { data: allHabits },
      { data: existingAchievements },
    ] = await Promise.all([
      supabase.from('habit_logs').select('habit_id,completed_at,skipped,xp_earned').eq('user_id', user!.id).gte('completed_at', since90),
      supabase.from('habits').select('*').eq('user_id', user!.id).eq('is_active', true),
      supabase.from('user_achievements').select('*').eq('user_id', user!.id),
    ])

    const habitLogs = (allLogs ?? []).filter(l => l.habit_id === habitId)
    const streak = calculateStreak(habitLogs, habit.frequency, habit.custom_days)

    const newAchievements = checkAchievements(
      allHabits ?? [],
      allLogs ?? [],
      (existingAchievements ?? []).map(a => ACHIEVEMENTS.find(t => t.id === a.achievement_id) ?? { id: a.achievement_id, name: '', emoji: '', description: '' })
    )

    if (newAchievements.length > 0) {
      const { error: achErr } = await supabase.from('user_achievements').upsert(
        newAchievements.map(a => ({ user_id: user!.id, achievement_id: a.id })),
        { onConflict: 'user_id,achievement_id' }
      )
      if (achErr) apiLogger('user_achievements upsert error', achErr)
    }

    return secureJsonResponse({ log, xp_earned: xpEarned, streak, new_achievements: newAchievements })
  }
)
