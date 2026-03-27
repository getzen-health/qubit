import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const { data } = await supabase
      .from('alcohol_logs')
      .select('*')
      .eq('user_id', user!.id)
      .order('date', { ascending: false })
      .limit(90)

    return secureJsonResponse({ logs: data || [] })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const body = await req.json()
    const { data, error } = await supabase
      .from('alcohol_logs')
      .upsert({ ...body, user_id: user!.id, updated_at: new Date().toISOString() })
      .select()
      .single()

    if (error) return secureErrorResponse('Failed to save log', 400)
    return secureJsonResponse({ log: data })
  }
)
