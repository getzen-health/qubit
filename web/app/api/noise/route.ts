import { z } from 'zod'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

const noiseCreateSchema = z.object({
  decibel_level: z.number().int().min(0).max(200),
  duration_minutes: z.number().int().positive(),
  environment: z.enum(['concert', 'workplace', 'traffic', 'home', 'gym', 'other']),
  notes: z.string().max(500).optional(),
  logged_at: z.string().optional(),
})

// GET /api/noise — last 30 noise logs for the authenticated user
export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'READ',
    auditResource: 'noise_log',
  },
  async (_request, { user, supabase }) => {
    const { data, error } = await supabase
      .from('noise_logs')
      .select('*')
      .eq('user_id', user!.id)
      .order('logged_at', { ascending: false })
      .limit(30)

    if (error) return secureErrorResponse('Failed to fetch noise logs', 500)

    return secureJsonResponse({ logs: data ?? [] })
  }
)

// POST /api/noise — create a new noise log entry
export const POST = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'CREATE',
    auditResource: 'noise_log',
    bodySchema: noiseCreateSchema,
  },
  async (_request, { user, body, supabase }) => {
    const { decibel_level, duration_minutes, environment, notes, logged_at } =
      body as z.infer<typeof noiseCreateSchema>

    const { data, error } = await supabase
      .from('noise_logs')
      .insert({
        user_id: user!.id,
        decibel_level,
        duration_minutes,
        environment,
        notes: notes ?? null,
        logged_at: logged_at ?? new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return secureErrorResponse('Failed to create noise log', 500)

    return secureJsonResponse({ log: data }, 201)
  }
)
