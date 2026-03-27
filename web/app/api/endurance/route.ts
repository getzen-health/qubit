import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'
import { checkRampRate } from '@/lib/endurance-metrics'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_request, { user, supabase }) => {
    const [profileResult, mileageResult] = await Promise.all([
      supabase
        .from('endurance_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle(),
      supabase
        .from('weekly_mileage_logs')
        .select('*')
        .eq('user_id', user!.id)
        .order('week_start', { ascending: true })
        .limit(52),
    ])

    if (profileResult.error) {
      return secureErrorResponse('Failed to fetch endurance profile', 500)
    }
    if (mileageResult.error) {
      return secureErrorResponse('Failed to fetch mileage logs', 500)
    }

    const logs = mileageResult.data ?? []
    const rampRate = checkRampRate(
      logs.map((l) => ({ week: l.week_start, distance_km: Number(l.distance_km) }))
    )

    return secureJsonResponse({
      profile: profileResult.data ?? null,
      mileage_logs: logs,
      ramp_rate: rampRate,
    })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const body = await request.json()

    if (body.type === 'mileage') {
      const { week_start, distance_km, sport = 'running' } = body
      if (!week_start || distance_km == null) {
        return secureErrorResponse('week_start and distance_km are required', 400)
      }
      const { data, error } = await supabase
        .from('weekly_mileage_logs')
        .upsert(
          { user_id: user!.id, week_start, distance_km, sport },
          { onConflict: 'user_id,week_start,sport' }
        )
        .select()
        .single()

      if (error) return secureErrorResponse('Failed to save mileage log', 500)
      return secureJsonResponse({ log: data })
    }

    const profileData: Record<string, unknown> = {
      user_id: user!.id,
      updated_at: new Date().toISOString(),
    }
    const fields = [
      'vdot', 'best_5k_seconds', 'best_10k_seconds', 'best_hm_seconds',
      'best_marathon_seconds', 'weekly_distance_km', 'ftp_watts', 'weight_kg',
      'vo2max_estimate',
    ] as const
    for (const field of fields) {
      if (body[field] !== undefined) profileData[field] = body[field]
    }

    const { data, error } = await supabase
      .from('endurance_profiles')
      .upsert(profileData, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) return secureErrorResponse('Failed to save endurance profile', 500)
    return secureJsonResponse({ profile: data })
  }
)
