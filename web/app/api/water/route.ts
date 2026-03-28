import { z } from 'zod'
import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

const postWaterSchema = z.object({
  amount_ml: z.number().positive().max(5000),
  logged_at: z.string().datetime({ offset: true }).optional(),
})

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('water_entries')
      .select('id, amount_ml, logged_at')
      .eq('user_id', user!.id)
      .gte('logged_at', today.toISOString())
      .order('logged_at', { ascending: false })

    if (error) return secureErrorResponse('Failed to fetch water entries', 500)

    const total = (data ?? []).reduce((sum, e) => sum + e.amount_ml, 0)
    return secureJsonResponse({ data, total })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true, bodySchema: postWaterSchema },
  async (_request, { user, supabase, body }) => {
    const { amount_ml, logged_at } = body as z.infer<typeof postWaterSchema>

    const { data, error } = await supabase
      .from('water_entries')
      .insert({ user_id: user!.id, amount_ml, ...(logged_at ? { logged_at } : {}) })
      .select()
      .single()

    if (error) return secureErrorResponse('Failed to create water entry', 500)
    return secureJsonResponse({ data })
  }
)

export const DELETE = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const { id } = await request.json()
    const { error } = await supabase
      .from('water_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id)
    if (error) return secureErrorResponse('Failed to delete water entry', 500)
    return secureJsonResponse({ success: true })
  }
)
