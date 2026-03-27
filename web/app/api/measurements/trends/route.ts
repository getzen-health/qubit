import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const days = parseInt(req.nextUrl.searchParams.get('days') ?? '30')
    const since = new Date(Date.now() - days * 86400000).toISOString()

    const { data, error } = await supabase
      .from('body_measurements')
      .select('measured_at, weight_kg, bmi, body_fat_pct, waist_cm, hip_cm, chest_cm')
      .eq('user_id', user!.id)
      .gte('measured_at', since)
      .order('measured_at', { ascending: true })

    if (error) return secureErrorResponse('Failed to fetch trends', 500)

    const { data: settingsData } = await supabase
      .from('user_settings')
      .select('goal_weight_kg')
      .eq('user_id', user!.id)
      .single()

    return secureJsonResponse({
      data: data ?? [],
      goalWeight: settingsData?.goal_weight_kg ?? null,
    })
  }
)
