import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

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

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const body = await req.json()

    if (body.type === 'settings') {
      const { type: _t, ...fields } = body
      const { data, error } = await supabase
        .from('biometric_settings')
        .upsert({ user_id: user!.id, ...fields, updated_at: new Date().toISOString() })
        .select()
        .single()
      if (error) return secureErrorResponse(error.message, 500)
      return secureJsonResponse({ settings: data })
    }

    // Default: upsert a biometric log entry
    const {
      date,
      weight_kg,
      body_fat_pct,
      waist_cm,
      hip_cm,
      neck_cm,
      chest_cm,
      arm_cm,
      thigh_cm,
      calf_cm,
      notes,
    } = body

    if (!date) return secureErrorResponse('date is required', 400)

    const { data, error } = await supabase
      .from('biometric_logs')
      .upsert(
        {
          user_id: user!.id,
          date,
          weight_kg: weight_kg ?? null,
          body_fat_pct: body_fat_pct ?? null,
          waist_cm: waist_cm ?? null,
          hip_cm: hip_cm ?? null,
          neck_cm: neck_cm ?? null,
          chest_cm: chest_cm ?? null,
          arm_cm: arm_cm ?? null,
          thigh_cm: thigh_cm ?? null,
          calf_cm: calf_cm ?? null,
          notes: notes ?? null,
        },
        { onConflict: 'user_id,date' }
      )
      .select()
      .single()

    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ log: data })
  }
)
