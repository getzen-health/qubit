import { z } from 'zod'
import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

const postEnergySchema = z.object({
  energy_level: z.number().int().min(1).max(5),
  notes: z.string().max(300).optional(),
  logged_at: z.string().optional(),
})

// GET /api/energy — last 14 days of logs
export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const since = new Date()
    since.setDate(since.getDate() - 14)

    const { data, error } = await supabase
      .from('energy_logs')
      .select('id, energy_level, notes, logged_at')
      .eq('user_id', user!.id)
      .gte('logged_at', since.toISOString())
      .order('logged_at', { ascending: false })

    if (error) return secureErrorResponse('Failed to fetch energy logs', 500)
    return secureJsonResponse({ data: data ?? [] })
  }
)

// POST /api/energy — log an energy level
export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true, bodySchema: postEnergySchema },
  async (_req, { user, supabase, body }) => {
    const { energy_level, notes, logged_at } = body as z.infer<typeof postEnergySchema>

    const { data, error } = await supabase
      .from('energy_logs')
      .insert({
        user_id: user!.id,
        energy_level,
        notes: notes ?? null,
        logged_at: logged_at ?? new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return secureErrorResponse('Failed to create energy log', 500)
    return secureJsonResponse({ data }, 201)
  }
)

