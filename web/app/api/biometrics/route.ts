import { z } from 'zod'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

const biometricSchema = z.object({
  type: z.enum(['weight', 'height', 'body_fat', 'muscle_mass', 'bmi', 'waist', 'hip', 'neck', 'chest', 'thigh', 'arm']),
  value: z.number().positive().max(1000),
  unit: z.string().max(10).optional(),
  measured_at: z.string().datetime().optional(),
})

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const since = new Date()
    since.setDate(since.getDate() - 180)

    const [{ data: logs, error: logsError }, { data: settings, error: settingsError }] = await Promise.all([
      supabase
        .from('biometric_logs')
        .select('*')
        .eq('user_id', user!.id)
        .gte('date', since.toISOString().split('T')[0])
        .order('date', { ascending: true }),
      supabase
        .from('biometric_settings')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle(),
    ])

    if (logsError) return secureErrorResponse(logsError.message, 500)
    if (settingsError) return secureErrorResponse(settingsError.message, 500)

    return secureJsonResponse({ logs: logs ?? [], settings: settings ?? null })
  }
)

const BIOMETRIC_COLUMN_MAP: Record<string, string> = {
  weight: 'weight_kg',
  height: 'height_cm',
  body_fat: 'body_fat_pct',
  muscle_mass: 'muscle_mass_kg',
  bmi: 'bmi',
  waist: 'waist_cm',
  hip: 'hip_cm',
  neck: 'neck_cm',
  chest: 'chest_cm',
  thigh: 'thigh_cm',
  arm: 'arm_cm',
}

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true, bodySchema: biometricSchema },
  async (_req, { user, supabase, body }) => {
    const { type, value, measured_at } = body as z.infer<typeof biometricSchema>

    const date = measured_at
      ? measured_at.split('T')[0]
      : new Date().toISOString().split('T')[0]

    const col = BIOMETRIC_COLUMN_MAP[type]
    const { data, error } = await supabase
      .from('biometric_logs')
      .upsert(
        { user_id: user!.id, date, [col]: value },
        { onConflict: 'user_id,date' }
      )
      .select()
      .single()

    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ log: data })
  }
)
