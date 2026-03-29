import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const dynamic = 'force-dynamic'

// GET — return referral stats for the current user
export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const userId = user!.id

    const [{ data: uses }, { data: profile }] = await Promise.all([
      supabase
        .from('referral_uses')
        .select('reward_granted')
        .eq('referrer_id', userId),
      supabase
        .from('user_profiles')
        .select('is_pro, pro_expires_at')
        .eq('user_id', userId)
        .single(),
    ])

    if (!uses) return secureErrorResponse('Failed to fetch stats', 500)

    return secureJsonResponse({
      totalReferrals: uses.length,
      rewardedReferrals: uses.filter((u) => u.reward_granted).length,
      isPro: profile?.is_pro ?? false,
      proExpiresAt: profile?.pro_expires_at ?? null,
    })
  }
)
