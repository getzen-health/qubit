import { z } from 'zod'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

const workoutBodySchema = z.object({
  type: z.string().min(1).max(100),
  duration_minutes: z.number().positive(),
  calories: z.number().nonnegative().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
})

const workoutDeleteQuerySchema = z.object({
  id: z.string().uuid(),
})

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
    bodySchema: workoutBodySchema,
  },
  async (_request, { user, body, supabase }) => {
    const { type, duration_minutes, calories, notes } = body as z.infer<typeof workoutBodySchema>
    const { data, error } = await supabase
      .from('workout_logs')
      .insert({ user_id: user!.id, type, duration_minutes, calories: calories ?? null, notes: notes ?? null, workout_date: new Date().toISOString() })
      .select().single()
    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ data }, 201)
  }
)

export const DELETE = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    querySchema: workoutDeleteQuerySchema,
  },
  async (_request, { user, query, supabase }) => {
    const { id } = query as z.infer<typeof workoutDeleteQuerySchema>
    const { error } = await supabase.from('workout_logs').delete().eq('id', id).eq('user_id', user!.id)
    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ success: true })
  }
)
