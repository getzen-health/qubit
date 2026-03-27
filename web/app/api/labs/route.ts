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
      .from('lab_results')
      .select('*')
      .eq('user_id', user!.id)
      .order('test_date', { ascending: false })
      .limit(20)

    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ results: data ?? [] })
  }
)

export const POST = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
  },
  async (request, { user, supabase }) => {
    const body = await request.json()
    const { data, error } = await supabase
      .from('lab_results')
      .insert({
        user_id: user!.id,
        test_date: body.test_date,
        panel_name: body.panel_name ?? null,
        markers: body.markers ?? {},
        lab_name: body.lab_name ?? null,
        ordering_provider: body.ordering_provider ?? null,
        notes: body.notes ?? null,
      })
      .select()
      .single()

    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ result: data })
  }
)
