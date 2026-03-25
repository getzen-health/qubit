import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { z } from 'zod'

// GET /api/social/leaderboard?challenge_id=<uuid>
// Returns all participants for the challenge ranked by current_value DESC
export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    querySchema: z.object({ challenge_id: z.string().uuid() }),
    auditAction: 'READ',
    auditResource: 'challenge',
  },
  async (_request, { query, supabase }) => {
    const { challenge_id } = query as { challenge_id: string }

    // Fetch challenge metadata
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('id, title, metric, target_value, starts_at, ends_at')
      .eq('id', challenge_id)
      .single()

    if (challengeError || !challenge) return secureErrorResponse('Challenge not found', 404)

    // Fetch participants with current progress
    const { data: participants, error } = await supabase
      .from('challenge_participants')
      .select('user_id, current_value, joined_at')
      .eq('challenge_id', challenge_id)
      .order('current_value', { ascending: false })

    if (error) return secureErrorResponse('Failed to fetch leaderboard', 500)

    const userIds = (participants ?? []).map((p) => p.user_id)

    // Fetch display names from user profiles
    const { data: profiles } = userIds.length
      ? await supabase.from('users').select('id, display_name, email').in('id', userIds)
      : { data: [] }

    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))

    const leaderboard = (participants ?? []).map((p, i) => {
      const profile = profileMap[p.user_id]
      return {
        rank: i + 1,
        user_id: p.user_id,
        display_name: profile?.display_name ?? profile?.email?.split('@')[0] ?? 'User',
        current_value: p.current_value,
        progress_pct: challenge.target_value > 0
          ? Math.min(100, Math.round((p.current_value / challenge.target_value) * 100))
          : 0,
        joined_at: p.joined_at,
      }
    })

    return secureJsonResponse({ challenge, leaderboard })
  }
)
