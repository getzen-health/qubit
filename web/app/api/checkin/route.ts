import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { z } from 'zod'
import { API_VERSION } from '@/lib/api-version'

// GET /api/checkin?days=30  — returns today's check-in + history
export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    querySchema: z.object({ days: z.coerce.number().int().min(1).max(90).default(30) }),
    auditAction: 'READ',
    auditResource: 'daily_checkin',
  },
  async (_request, { user, query, supabase }) => {
    const { days } = query as { days: number }
    const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from('daily_checkins')
      .select('id, date, energy, mood, stress, notes, created_at')
      .eq('user_id', user!.id)
      .gte('date', since)
      .order('date', { ascending: false })

    if (error) return secureErrorResponse('Failed to fetch check-ins', 500)

    const today = new Date().toISOString().slice(0, 10)
    const todayCheckin = data?.find((c) => c.date === today) ?? null

    const res = secureJsonResponse({ today: todayCheckin, history: data ?? [] })
    res.headers.set('X-API-Version', API_VERSION)
    return res
  }
)

// POST /api/checkin — upsert today's check-in
export const POST = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    bodySchema: z.object({
      energy: z.number().int().min(1).max(5).optional(),
      mood: z.number().int().min(1).max(5).optional(),
      stress: z.number().int().min(1).max(5).optional(),
      notes: z.string().optional().nullable(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD').optional(),
    }),
    auditAction: 'CREATE',
    auditResource: 'daily_checkin',
  },
  async (_request, { user, body, supabase }) => {
    const { energy, mood, stress, notes, date } = body as {
      energy?: number
      mood?: number
      stress?: number
      notes?: string | null
      date?: string
    }

    const today = date ?? new Date().toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from('daily_checkins')
      .upsert(
        { user_id: user!.id, date: today, energy, mood, stress, notes: notes ?? null },
        { onConflict: 'user_id,date' }
      )
      .select()
      .single()

    if (error) return secureErrorResponse('Failed to save check-in', 500)
    const res = secureJsonResponse({ checkin: data }, 201)
    res.headers.set('X-API-Version', API_VERSION)
    return res
  }
)
