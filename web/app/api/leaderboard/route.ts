import { z } from 'zod'
import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const dynamic = 'force-dynamic'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    // Fetch top 50 from the leaderboard view
    const { data: leaderboard, error } = await supabase
      .from('streak_leaderboard')
      .select('id, display_name, current_streak, longest_streak, last_active_date')
      .limit(50)

    if (error) return secureErrorResponse('Failed to fetch leaderboard', 500)

    // Get current user's profile to find their rank
    const { data: myProfile } = await supabase
      .from('user_profiles')
      .select('id, current_streak, leaderboard_opt_in')
      .eq('user_id', user!.id)
      .single()

    let myRank: number | null = null
    let myStreak = myProfile?.current_streak ?? 0

    if (myProfile?.leaderboard_opt_in) {
      const idx = (leaderboard ?? []).findIndex((row) => row.id === myProfile.id)
      if (idx !== -1) {
        myRank = idx + 1
      } else if (myProfile.current_streak > 0) {
        // User is opted in but outside top 50 — fetch their rank via count
        const { count } = await supabase
          .from('user_profiles')
          .select('id', { count: 'exact', head: true })
          .eq('leaderboard_opt_in', true)
          .gt('current_streak', myProfile.current_streak)

        myRank = (count ?? 0) + 1
      }
    }

    return secureJsonResponse({ leaderboard: leaderboard ?? [], myRank, myStreak })
  }
)
