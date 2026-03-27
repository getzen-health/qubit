import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const { data, error } = await supabase.from('alert_rules').select('*').eq('user_id', user!.id).order('created_at', { ascending: false })
    if (error) return secureErrorResponse('Failed to fetch alert rules', 500)
    return secureJsonResponse({ rules: data ?? [] })
  }
)
