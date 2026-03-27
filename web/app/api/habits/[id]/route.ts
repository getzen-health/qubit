import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { NextRequest } from 'next/server'
import { z } from 'zod'

const UpdateSchema = z.object({
  name: z.string().optional(),
  icon: z.string().optional(),
  category: z.enum(['health', 'fitness', 'nutrition', 'sleep', 'mental', 'custom']).optional(),
  target_value: z.number().optional(),
  target_unit: z.string().optional(),
  frequency: z.enum(['daily', 'weekdays', 'weekends', 'custom']).optional(),
  reminder_time: z.string().optional(),
  reminder_enabled: z.boolean().optional(),
  is_active: z.boolean().optional(),
})

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: habit_id } = await params
  return createSecureApiHandler(
    { rateLimit: 'healthData', requireAuth: true },
    async (_req, { user, supabase }) => {
      const body = await _req.json()
      const parsed = UpdateSchema.safeParse(body)
      if (!parsed.success) return secureErrorResponse('Invalid request body', 400)
      const { error } = await supabase
        .from('user_habits')
        .update(parsed.data)
        .eq('user_id', user!.id)
        .eq('id', habit_id)
      if (error) return secureErrorResponse('Failed to update habit', 500)
      return secureJsonResponse({ ok: true })
    }
  )(req)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: habit_id } = await params
  return createSecureApiHandler(
    { rateLimit: 'healthData', requireAuth: true },
    async (_req, { user, supabase }) => {
      const { error } = await supabase
        .from('user_habits')
        .update({ is_active: false })
        .eq('user_id', user!.id)
        .eq('id', habit_id)
      if (error) return secureErrorResponse('Failed to delete habit', 500)
      return secureJsonResponse({ ok: true })
    }
  )(req)
}
