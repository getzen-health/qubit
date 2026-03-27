import { z } from 'zod'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'
import {
  calculateRatios,
  getProgressSummary,
  type BodyMeasurement,
} from '@/lib/body-measurements'

const measurementSchema = z.object({
  measured_at: z.string().datetime().optional(),
  weight_kg: z.number().positive().max(500).optional(),
  height_cm: z.number().positive().max(300).optional(),
  body_fat_pct: z.number().min(0).max(100).optional(),
  muscle_mass_kg: z.number().positive().max(200).optional(),
  waist_cm: z.number().positive().max(300).optional(),
  hip_cm: z.number().positive().max(300).optional(),
  chest_cm: z.number().positive().max(300).optional(),
})

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const { data } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', user!.id)
      .order('measured_at', { ascending: false })
      .limit(30)

    const rows = data ?? []

    // Retrieve user sex from profile for risk calculations, default to male
    const { data: profile } = await supabase
      .from('profiles')
      .select('sex')
      .eq('id', user!.id)
      .single()
    const sex: 'male' | 'female' = profile?.sex === 'female' ? 'female' : 'male'

    const measurements: BodyMeasurement[] = rows.map((r: Record<string, unknown>) => ({
      date: r.measured_at as string,
      weight_kg: r.weight_kg as number | undefined,
      height_cm: r.height_cm as number | undefined,
      waist_cm: r.waist_cm as number | undefined,
      hips_cm: r.hips_cm as number | undefined,
      chest_cm: r.chest_cm as number | undefined,
      neck_cm: r.neck_cm as number | undefined,
      left_arm_cm: r.left_arm_cm as number | undefined,
      right_arm_cm: r.right_arm_cm as number | undefined,
      left_thigh_cm: r.left_thigh_cm as number | undefined,
      right_thigh_cm: r.right_thigh_cm as number | undefined,
      left_calf_cm: r.left_calf_cm as number | undefined,
      right_calf_cm: r.right_calf_cm as number | undefined,
    }))

    const latest = measurements[0]
    const ratios = latest ? calculateRatios(latest, sex) : null
    const { change, trend } = getProgressSummary(measurements)

    return secureJsonResponse({
      measurements: rows,
      ratios,
      trend,
      change,
      sex,
    })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true, bodySchema: measurementSchema },
  async (_req, { user, supabase, body }) => {
    const {
      measured_at,
      weight_kg,
      height_cm,
      body_fat_pct,
      muscle_mass_kg,
      waist_cm,
      hip_cm,
      chest_cm,
    } = body as z.infer<typeof measurementSchema>

    const { data, error } = await supabase
      .from('body_measurements')
      .insert({
        user_id: user!.id,
        measured_at: measured_at ?? new Date().toISOString().split('T')[0],
        weight_kg: weight_kg ?? null,
        height_cm: height_cm ?? null,
        body_fat_pct: body_fat_pct ?? null,
        muscle_mass_kg: muscle_mass_kg ?? null,
        waist_cm: waist_cm ?? null,
        hips_cm: hip_cm ?? null,
        chest_cm: chest_cm ?? null,
      })
      .select()
      .single()

    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ entry: data })
  }
)
