import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const url = new URL(request.url)
    const type = url.searchParams.get('type')
    const page = parseInt(url.searchParams.get('page') ?? '1')
    const pageSize = 20

    let query = supabase
      .from('workout_logs')
      .select('id, type, workout_date, duration_minutes, calories, notes')
      .eq('user_id', user!.id)
      .order('workout_date', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (type && type !== 'all') {
      query = query.eq('type', type)
    }

    const { data, error } = await query
    if (error) return secureErrorResponse('Failed to fetch workout history', 500)

    return secureJsonResponse({ data: data ?? [], page, hasMore: (data?.length ?? 0) === pageSize })
  }
)
