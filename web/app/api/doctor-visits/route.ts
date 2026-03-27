import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const { data, error } = await supabase
      .from('doctor_visits')
      .select('*')
      .eq('user_id', user!.id)
      .order('visit_date', { ascending: false })
      .limit(20)

    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ visits: data ?? [] })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const body = await req.json()
    const { data, error } = await supabase
      .from('doctor_visits')
      .insert({
        user_id: user!.id,
        visit_date: body.visit_date,
        provider_name: body.provider_name ?? null,
        visit_type: body.visit_type ?? null,
        chief_complaint: body.chief_complaint ?? null,
        diagnoses: body.diagnoses ?? [],
        medications_changed: body.medications_changed ?? [],
        follow_up_date: body.follow_up_date ?? null,
        notes: body.notes ?? null,
      })
      .select()
      .single()

    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ visit: data })
  }
)
