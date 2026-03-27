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
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const body = await req.json()
    const {
      measured_at,
      weight_kg,
      height_cm,
      waist_cm,
      hips_cm,
      chest_cm,
      neck_cm,
      left_arm_cm,
      right_arm_cm,
      left_thigh_cm,
      right_thigh_cm,
      left_calf_cm,
      right_calf_cm,
      notes,
    } = body

    const { data, error } = await supabase
      .from('body_measurements')
      .insert({
        user_id: user!.id,
        measured_at: measured_at ?? new Date().toISOString().split('T')[0],
        weight_kg: weight_kg || null,
        height_cm: height_cm || null,
        waist_cm: waist_cm || null,
        hips_cm: hips_cm || null,
        chest_cm: chest_cm || null,
        neck_cm: neck_cm || null,
        left_arm_cm: left_arm_cm || null,
        right_arm_cm: right_arm_cm || null,
        left_thigh_cm: left_thigh_cm || null,
        right_thigh_cm: right_thigh_cm || null,
        left_calf_cm: left_calf_cm || null,
        right_calf_cm: right_calf_cm || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ entry: data })
  }
)
