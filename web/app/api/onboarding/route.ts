import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const body = await request.json()
    // Save onboarding data to user profile (user_profiles table with jsonb column 'onboarding')
    const { error } = await supabase
      .from('user_profiles')
      .update({ onboarding: body })
      .eq('user_id', user!.id)
    if (error) return secureErrorResponse('Failed to save onboarding data', 500)
    return secureJsonResponse({ success: true })
  }
)
