import { z } from 'zod'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

const LogSchema = z.object({
  logged_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sessions: z.number().int().min(0).max(5),
  morning: z.boolean().optional().default(false),
  afternoon: z.boolean().optional().default(false),
  evening: z.boolean().optional().default(false),
  total_duration_seconds: z.number().int().min(0).optional().default(0),
  notes: z.string().max(500).optional().nullable(),
})

// GET: last 90 days of oral hygiene logs
export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
  },
  async (_request, { user, supabase }) => {
    const since = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from('oral_hygiene_logs')
      .select('*')
      .eq('user_id', user!.id)
      .gte('logged_date', since)
      .order('logged_date', { ascending: false })

    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ logs: data ?? [] })
  }
)

// POST: upsert a daily log (one record per day per user)
export const POST = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
  },
  async (request, { user, supabase }) => {
    const body = await request.json()
    const parsed = LogSchema.safeParse(body)
    if (!parsed.success) {
      return secureErrorResponse(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
    }

    const today = new Date().toISOString().slice(0, 10)
    const loggedDate = parsed.data.logged_date ?? today

    const { data, error } = await supabase
      .from('oral_hygiene_logs')
      .upsert(
        { user_id: user!.id, logged_date: loggedDate, ...parsed.data },
        { onConflict: 'user_id,logged_date' }
      )
      .select()
      .single()

    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ log: data })
  }
)
