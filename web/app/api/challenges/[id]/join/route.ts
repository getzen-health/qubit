import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

// POST: Join a challenge
export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const challenge_id = req.nextUrl.pathname.split('/').at(-2)!
    const { error } = await supabase.from('challenge_participants').insert({
      challenge_id,
      user_id: user!.id,
    })
    if (error && !error.message.includes('duplicate')) return secureErrorResponse('Failed to join challenge', 500)
    return secureJsonResponse({ success: true })
  }
)
