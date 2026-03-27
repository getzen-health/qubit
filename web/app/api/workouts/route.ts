import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
  },
  async (_request, { user, supabase }) => {
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', user!.id)
      .order('workout_date', { ascending: false })
      .limit(20)
    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ data })
  }
)

export const POST = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
  },
  async (request, { user, supabase }) => {
    const body = await request.json()
    const { type, duration_minutes, calories, notes } = body
    if (!type || !duration_minutes) return secureErrorResponse('type and duration_minutes required', 400)
    const { data, error } = await supabase
      .from('workout_logs')
      .insert({ user_id: user!.id, type, duration_minutes: Number(duration_minutes), calories: calories ? Number(calories) : null, notes: notes || null, workout_date: new Date().toISOString() })
      .select().single()
    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ data }, 201)
  }
)

export const DELETE = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
  },
  async (request, { user, supabase }) => {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return secureErrorResponse('id required', 400)
    const { error } = await supabase.from('workout_logs').delete().eq('id', id).eq('user_id', user!.id)
    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ success: true })
  }
)
