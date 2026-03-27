import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const { data, error } = await supabase.from('alert_history').select('*').eq('user_id', user!.id).order('triggered_at', { ascending: false })
    if (error) return secureErrorResponse('Failed to fetch alert history', 500)
    return secureJsonResponse({ history: data ?? [] })
  }
)

export const PATCH = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const { error } = await supabase.from('alert_history').update({ acknowledged: true }).eq('user_id', user!.id).eq('acknowledged', false)
    if (error) return secureErrorResponse('Failed to acknowledge alerts', 500)
    return secureJsonResponse({ success: true })
  }
)
