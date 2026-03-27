import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const { data, error } = await supabase
      .from('break_sessions')
      .select('*')
      .eq('user_id', user!.id)
      .gte('logged_at', today.toISOString())
      .order('logged_at', { ascending: false })

    if (error) return secureErrorResponse('Failed to fetch break sessions', 500)

    const completed = (data ?? []).filter(b => b.completed)
    const totalSittingMin = (data ?? []).reduce((sum, b) => sum + (b.sitting_minutes_before ?? 0), 0)

    return secureJsonResponse({ breaks: data ?? [], completedToday: completed.length, totalSittingMin })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const body = await request.json()
    const { data, error } = await supabase
      .from('break_sessions')
      .insert({ ...body, user_id: user!.id })
      .select()
      .single()
    if (error) return secureErrorResponse('Failed to create break session', 400)
    return secureJsonResponse(data)
  }
)
