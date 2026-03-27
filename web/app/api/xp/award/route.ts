// Awards XP for an action, updates user_stats, checks for new achievements
// Called fire-and-forget from other routes after key actions
import { z } from 'zod'
import { createSecureApiHandler, secureJsonResponse } from '@/lib/security'
import { XP_ACTIONS, LEVELS } from '@/lib/achievements'

const xpBodySchema = z.object({
  action: z.string().min(1),
})

export const POST = createSecureApiHandler(
  { rateLimit: 'default', requireAuth: true, bodySchema: xpBodySchema },
  async (_req, { user, body, supabase }) => {
    const { action } = body as z.infer<typeof xpBodySchema>
    const xp = XP_ACTIONS[action] ?? 5

    const { error: xpLogErr } = await supabase.from('user_xp_log').insert({ user_id: user!.id, action, xp_earned: xp })
    if (xpLogErr) console.error('xp_log insert error', xpLogErr)

    const { data: stats, error: statsErr } = await supabase.from('user_stats').select('total_xp').eq('user_id', user!.id).single()
    if (statsErr && statsErr.code !== 'PGRST116') console.error('user_stats fetch error', statsErr)
    const newXP = (stats?.total_xp ?? 0) + xp
    const newLevel = LEVELS.filter(l => newXP >= l.minXP).length

    const { error: upsertErr } = await supabase.from('user_stats').upsert({
      user_id: user!.id,
      total_xp: newXP,
      level: newLevel,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    if (upsertErr) console.error('user_stats upsert error', upsertErr)

    return secureJsonResponse({ xp_earned: xp, total_xp: newXP, level: newLevel })
  }
)
