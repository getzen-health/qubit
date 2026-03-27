import crypto from 'crypto'
import { createSecureApiHandler, secureJsonResponse } from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'default', requireAuth: true },
  async (_req, { user, supabase }) => {
    const referralCode = crypto.createHash('sha256').update(user!.id).digest('hex').slice(0, 8).toUpperCase()
    const referralLink = `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${referralCode}`

    const { data: referrals } = await supabase
      .from('referrals')
      .select('referred_email, status, created_at')
      .eq('referrer_id', user!.id)
      .order('created_at', { ascending: false })

    return secureJsonResponse({ referralCode, referralLink, referrals: referrals ?? [] })
  }
)
