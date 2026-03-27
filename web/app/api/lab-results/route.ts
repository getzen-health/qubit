import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const { data, error } = await supabase
      .from('lab_results')
      .select('*')
      .eq('user_id', user!.id)
      .order('lab_date', { ascending: false })
      .limit(200)

    if (error) return secureErrorResponse('Failed to fetch lab results', 500)

    const latest: Record<string, unknown> = {}
    for (const r of (data ?? [])) {
      if (!latest[r.biomarker_key]) latest[r.biomarker_key] = r
    }
    return secureJsonResponse({ results: data ?? [], latest })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const body = await request.json()
    const { data, error } = await supabase
      .from('lab_results')
      .insert({ ...body, user_id: user!.id })
      .select()
      .single()

    if (error) return secureErrorResponse('Failed to create lab result', 500)
    return secureJsonResponse({ result: data })
  }
)

export const DELETE = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const { id } = await request.json()
    const { error } = await supabase
      .from('lab_results')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id)

    if (error) return secureErrorResponse('Failed to delete lab result', 500)
    return secureJsonResponse({ success: true })
  }
)
