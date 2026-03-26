import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { z } from 'zod'

const dayLogSchema = z.object({
  flow_intensity: z.enum(['spotting', 'light', 'medium', 'heavy', 'none']).optional(),
  symptoms: z.array(z.string()).optional(),
  mood: z.string().optional(),
  energy_level: z.number().min(1).max(10).optional(),
  notes: z.string().max(1000).optional(),
})

export const GET = createSecureApiHandler(
  { requireAuth: true, rateLimit: 'healthData' },
  async (_req, { user, supabase }) => {
    const today = new Date().toISOString().slice(0, 10)
    const { data, error } = await supabase
      .from('cycle_day_logs')
      .select('*')
      .eq('user_id', user!.id)
      .eq('log_date', today)
      .single()
    if (error && error.code !== 'PGRST116') {
      return secureErrorResponse('Failed to fetch today\'s log', 500)
    }
    return secureJsonResponse({ log: data ?? null })
  }
)

export const POST = createSecureApiHandler(
  { requireAuth: true, rateLimit: 'healthData', bodySchema: dayLogSchema },
  async (_req, { user, body, supabase }) => {
    const today = new Date().toISOString().slice(0, 10)
    const { flow_intensity, symptoms, mood, energy_level, notes } = body as z.infer<typeof dayLogSchema>
    const { data, error } = await supabase
      .from('cycle_day_logs')
      .upsert({
        user_id: user!.id,
        log_date: today,
        flow_intensity: flow_intensity ?? 'none',
        symptoms: symptoms ?? [],
        mood: mood ?? null,
        energy_level: energy_level ?? null,
        notes: notes ?? null,
      }, { onConflict: 'user_id,log_date' })
      .select()
      .single()
    if (error) {
      return secureErrorResponse('Failed to save today\'s log', 500)
    }
    return secureJsonResponse({ log: data })
  }
)

export const PUT = POST
