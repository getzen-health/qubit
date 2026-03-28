import { z } from 'zod'
import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

const postGlucoseSchema = z.object({
  value_mmol: z.number().min(0.1).max(30),
  context: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
  logged_at: z.string().datetime({ offset: true }).optional(),
})

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const days = parseInt(new URL(request.url).searchParams.get('days') ?? '30')
    const since = new Date()
    since.setDate(since.getDate() - days)

    const { data, error } = await supabase
      .from('blood_glucose_entries')
      .select('id, value_mmol, value_mgdl, context, notes, logged_at')
      .eq('user_id', user!.id)
      .gte('logged_at', since.toISOString())
      .order('logged_at', { ascending: true })

    if (error) return secureErrorResponse('Failed to fetch glucose data', 500)
    return secureJsonResponse({ data: data ?? [] })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true, bodySchema: postGlucoseSchema },
  async (_request, { user, supabase, body }) => {
    const { value_mmol, context, notes } = body as z.infer<typeof postGlucoseSchema>

    const { data, error } = await supabase
      .from('blood_glucose_entries')
      .insert({ user_id: user!.id, value_mmol, context: context ?? 'random', notes })
      .select()
      .single()

    if (error) return secureErrorResponse('Failed to create glucose entry', 500)
    return secureJsonResponse({ data })
  }
)

export const DELETE = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const { id } = await request.json()
    const { error } = await supabase
      .from('blood_glucose_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id)
    if (error) return secureErrorResponse('Failed to delete glucose entry', 500)
    return secureJsonResponse({ success: true })
  }
)
