import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

// GET: Top 20 participants for a challenge
export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { supabase }) => {
    const challenge_id = req.nextUrl.pathname.split('/').at(-2)!
    const { data: participants, error } = await supabase
      .from('challenge_participants')
      .select('user_id, current_value')
      .eq('challenge_id', challenge_id)
      .order('current_value', { ascending: false })
      .limit(20)
    if (error) return secureErrorResponse('Failed to fetch leaderboard', 500)
    const leaderboard = (participants || []).map((p, i) => ({
      rank: i + 1,
      name: `User #${p.user_id.slice(-6)}`,
      current_value: p.current_value,
    }))
    return secureJsonResponse({ leaderboard })
  }
)
