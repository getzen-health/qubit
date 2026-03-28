import { z } from 'zod'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

const setSchema = z.object({
  exercise_name: z.string().min(1).max(200),
  set_number: z.number().int().positive(),
  reps: z.number().int().nonnegative(),
  weight_kg: z.number().nonnegative(),
  completed: z.boolean().default(true),
  notes: z.string().max(500).nullable().optional(),
})

const strengthBodySchema = z.object({
  session_date: z.string().min(1),
  notes: z.string().max(1000).nullable().optional(),
  sets: z.array(setSchema).min(1),
})

export const POST = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    bodySchema: strengthBodySchema,
  },
  async (_request, { user, body, supabase }) => {
    const { session_date, notes, sets } = body as z.infer<typeof strengthBodySchema>

    const { data: session, error: sessionError } = await supabase
      .from('strength_sessions')
      .insert({
        user_id: user!.id,
        session_date,
        notes: notes ?? null,
      })
      .select('id')
      .single()

    if (sessionError) return secureErrorResponse(sessionError.message, 500)

    const setsWithSession = sets.map((s) => ({
      session_id: session.id,
      user_id: user!.id,
      exercise_name: s.exercise_name,
      set_number: s.set_number,
      reps: s.reps,
      weight_kg: s.weight_kg,
      completed: s.completed,
      notes: s.notes ?? null,
    }))

    const { error: setsError } = await supabase
      .from('strength_sets')
      .insert(setsWithSession)

    if (setsError) return secureErrorResponse(setsError.message, 500)

    return secureJsonResponse({ session_id: session.id, sets_count: sets.length }, 201)
  }
)

export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
  },
  async (_request, { user, supabase }) => {
    const { data: sessions, error } = await supabase
      .from('strength_sessions')
      .select(`
        id,
        session_date,
        notes,
        created_at,
        strength_sets (
          id,
          exercise_name,
          set_number,
          reps,
          weight_kg,
          completed,
          notes
        )
      `)
      .eq('user_id', user!.id)
      .order('session_date', { ascending: false })
      .limit(30)

    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ data: sessions })
  }
)
