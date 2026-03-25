import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { z } from 'zod'

// GET /api/habits?days=30 — returns habits + completions window
export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    querySchema: z.object({ days: z.coerce.number().int().min(1).max(365).default(30) }),
    auditAction: 'READ',
    auditResource: 'habit',
  },
  async (_request, { user, query, supabase }) => {
    const days = Math.min((query as { days: number }).days, 90)
    const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)

    const [{ data: habits, error: habitsError }, { data: completions, error: completionsError }] = await Promise.all([
      supabase
        .from('habits')
        .select('id, name, emoji, target_days, sort_order, created_at')
        .eq('user_id', user!.id)
        .is('archived_at', null)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
      supabase
        .from('habit_completions')
        .select('habit_id, date')
        .eq('user_id', user!.id)
        .gte('date', since),
    ])

    if (habitsError) return secureErrorResponse('Failed to fetch habits', 500)
    if (completionsError) return secureErrorResponse('Failed to fetch completions', 500)

    return secureJsonResponse({ habits: habits ?? [], completions: completions ?? [] })
  }
)

// POST /api/habits — toggle completion for a date
export const POST = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    bodySchema: z.object({
      habit_id: z.string(),
      date: z.string(),
      completed: z.boolean().optional(),
    }),
    auditAction: 'UPDATE',
    auditResource: 'habit',
  },
  async (_request, { user, body, supabase }) => {
    const { habit_id, date, completed } = body as { habit_id: string; date: string; completed?: boolean }

    // Verify habit belongs to user
    const { data: habit } = await supabase
      .from('habits')
      .select('id')
      .eq('id', habit_id)
      .eq('user_id', user!.id)
      .single()

    if (!habit) return secureErrorResponse('Habit not found', 404)

    if (completed) {
      const { error } = await supabase
        .from('habit_completions')
        .upsert({ habit_id, user_id: user!.id, date }, { onConflict: 'habit_id,date' })
      if (error) return secureErrorResponse('Failed to record completion', 500)
    } else {
      const { error } = await supabase
        .from('habit_completions')
        .delete()
        .eq('habit_id', habit_id)
        .eq('date', date)
      if (error) return secureErrorResponse('Failed to remove completion', 500)
    }

    return secureJsonResponse({ ok: true })
  }
)
