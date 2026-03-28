import { z } from 'zod'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

const caffeineLogSchema = z.object({
  drink_type: z.enum([
    'coffee',
    'espresso',
    'tea',
    'green_tea',
    'energy_drink',
    'soda',
    'supplement',
    'other',
  ]),
  amount_ml: z.number().int().min(1).max(2000).optional(),
  caffeine_mg: z.number().int().min(1).max(1000),
  notes: z.string().max(500).optional(),
  logged_at: z.string().optional(),
})

// GET /api/caffeine — today's logs + total_mg
export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'READ',
    auditResource: 'caffeine_log',
  },
  async (_request, { user, supabase }) => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()

    const { data, error } = await supabase
      .from('caffeine_logs')
      .select('*')
      .eq('user_id', user!.id)
      .gte('logged_at', todayStart)
      .lt('logged_at', todayEnd)
      .order('logged_at', { ascending: true })

    if (error) return secureErrorResponse('Failed to fetch caffeine logs', 500)

    const total_mg = (data ?? []).reduce(
      (sum: number, log: { caffeine_mg: number }) => sum + log.caffeine_mg,
      0
    )

    return secureJsonResponse({ logs: data ?? [], total_mg })
  }
)

// POST /api/caffeine — add a new caffeine log entry
export const POST = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'CREATE',
    auditResource: 'caffeine_log',
    bodySchema: caffeineLogSchema,
  },
  async (_request, { user, body, supabase }) => {
    const { drink_type, amount_ml, caffeine_mg, notes, logged_at } =
      body as z.infer<typeof caffeineLogSchema>

    const { data, error } = await supabase
      .from('caffeine_logs')
      .insert({
        user_id: user!.id,
        drink_type,
        amount_ml: amount_ml ?? null,
        caffeine_mg,
        notes: notes ?? null,
        logged_at: logged_at ?? new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return secureErrorResponse('Failed to log caffeine', 500)

    return secureJsonResponse({ log: data }, 201)
  }
)

// DELETE /api/caffeine?id=<uuid> — delete a log entry
export const DELETE = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'DELETE',
    auditResource: 'caffeine_log',
    querySchema: z.object({ id: z.string().uuid() }),
  },
  async (_request, { user, query, supabase }) => {
    const { id } = query as { id: string }

    const { error } = await supabase
      .from('caffeine_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id)

    if (error) return secureErrorResponse('Failed to delete caffeine log', 500)

    return secureJsonResponse({ success: true })
  }
)
