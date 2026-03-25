import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { z } from 'zod'

// POST /api/habits/manage — create a new habit
export const POST = createSecureApiHandler(
  {
    rateLimit: 'default',
    requireAuth: true,
    bodySchema: z.object({
      name: z.string().min(1),
      emoji: z.string().optional(),
      target_days: z.array(z.string()).optional(),
    }),
    auditAction: 'CREATE',
    auditResource: 'habit',
  },
  async (_request, { user, body, supabase }) => {
    const { name, emoji, target_days } = body as { name: string; emoji?: string; target_days?: string[] }

    // Get current max sort_order
    const { data: existing } = await supabase
      .from('habits')
      .select('sort_order')
      .eq('user_id', user!.id)
      .is('archived_at', null)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

    const { data, error } = await supabase
      .from('habits')
      .insert({
        user_id: user!.id,
        name: name.trim(),
        emoji: emoji || '✅',
        target_days: target_days ?? ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
        sort_order: nextOrder,
      })
      .select()
      .single()

    if (error) return secureErrorResponse('Failed to create habit', 500)
    return secureJsonResponse({ habit: data }, 201)
  }
)

// DELETE /api/habits/manage?id=xxx — archive a habit
export const DELETE = createSecureApiHandler(
  {
    rateLimit: 'default',
    requireAuth: true,
    querySchema: z.object({ id: z.string() }),
    auditAction: 'DELETE',
    auditResource: 'habit',
  },
  async (_request, { user, query, supabase }) => {
    const { id } = query as { id: string }

    const { error } = await supabase
      .from('habits')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user!.id)

    if (error) return secureErrorResponse('Failed to archive habit', 500)
    return secureJsonResponse({ ok: true })
  }
)
