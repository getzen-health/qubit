import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { NextRequest } from 'next/server'
import { z } from 'zod'

const CompleteSchema = z.object({
  value_logged: z.number().optional(),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: habit_id } = await params
  return createSecureApiHandler(
    { rateLimit: 'healthData', requireAuth: true },
    async (_req, { user, supabase }) => {
      const body = await _req.json()
      const parsed = CompleteSchema.safeParse(body)
      if (!parsed.success) return secureErrorResponse('Invalid request body', 400)
      const today = new Date().toISOString().slice(0, 10)
      const { error } = await supabase
        .from('habit_completions')
        .upsert({
          user_id: user!.id,
          habit_id,
          completed_date: today,
          value_logged: parsed.data.value_logged,
          notes: parsed.data.notes,
        }, { onConflict: 'habit_id,completed_date' })
      if (error) return secureErrorResponse('Failed to complete habit', 500)
      return secureJsonResponse({ ok: true })
    }
  )(req)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: habit_id } = await params
  return createSecureApiHandler(
    { rateLimit: 'healthData', requireAuth: true },
    async (_req, { user, supabase }) => {
      const today = new Date().toISOString().slice(0, 10)
      const { error } = await supabase
        .from('habit_completions')
        .delete()
        .eq('user_id', user!.id)
        .eq('habit_id', habit_id)
        .eq('completed_date', today)
      if (error) return secureErrorResponse('Failed to delete habit completion', 500)
      return secureJsonResponse({ ok: true })
    }
  )(req)
}
