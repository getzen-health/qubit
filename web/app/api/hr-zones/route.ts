import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'
import { detectZone, calculateHRZones, analyzePolarizedBalance } from '@/lib/hr-zones'
import type { WorkoutZoneLog } from '@/lib/hr-zones'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const [profileRes, logsRes] = await Promise.all([
      supabase
        .from('hr_zone_profiles')
        .select('age, resting_hr, max_hr, formula_used, updated_at')
        .eq('user_id', user!.id)
        .maybeSingle(),
      supabase
        .from('workout_hr_logs')
        .select('logged_at, duration_min, avg_hr, dominant_zone, calories, workout_type')
        .eq('user_id', user!.id)
        .order('logged_at', { ascending: false })
        .limit(30),
    ])

    const profile = profileRes.data
    const logs: WorkoutZoneLog[] = (logsRes.data ?? []).map(r => ({
      date: r.logged_at,
      duration_min: r.duration_min,
      avg_hr: r.avg_hr ?? 0,
      zone: r.dominant_zone ?? 1,
      calories: r.calories ?? undefined,
    }))

    const zoneDist = [0, 0, 0, 0, 0]
    logs.forEach(l => { if (l.zone >= 1 && l.zone <= 5) zoneDist[l.zone - 1]++ })

    const polarized = analyzePolarizedBalance(logs)

    let zones = null
    if (profile?.age && profile?.resting_hr) {
      zones = calculateHRZones(
        profile.age,
        profile.resting_hr,
        (profile.formula_used as 'tanaka' | 'fox' | 'manual') ?? 'tanaka',
        profile.max_hr ?? undefined,
      )
    }

    return secureJsonResponse({
      profile,
      zones,
      logs: logsRes.data ?? [],
      zone_distribution: zoneDist,
      polarized_balance: polarized,
    })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const body = await req.json()
    const { action } = body

    if (action === 'save_profile') {
      const { age, resting_hr, max_hr, formula_used } = body
      if (!age || !resting_hr || age < 10 || age > 120 || resting_hr < 30 || resting_hr > 120) {
        return secureErrorResponse('Invalid profile values', 400)
      }
      const { error } = await supabase
        .from('hr_zone_profiles')
        .upsert(
          { user_id: user!.id, age, resting_hr, max_hr: max_hr ?? null, formula_used: formula_used ?? 'tanaka', updated_at: new Date().toISOString() },
          { onConflict: 'user_id' },
        )
      if (error) return secureErrorResponse('Failed to save HR zone profile', 500)
      return secureJsonResponse({ success: true })
    }

    if (action === 'log_workout') {
      const { workout_type, duration_min, avg_hr, max_hr: wMaxHr, calories, notes, zones } = body
      if (!duration_min || duration_min < 1 || duration_min > 600) {
        return secureErrorResponse('Invalid duration (1–600 min)', 400)
      }

      let dominant_zone: number | null = null
      if (avg_hr && zones) {
        dominant_zone = detectZone(avg_hr, zones)
      }

      const { data, error } = await supabase
        .from('workout_hr_logs')
        .insert({
          user_id: user!.id,
          workout_type: workout_type ?? null,
          duration_min,
          avg_hr: avg_hr ?? null,
          max_hr: wMaxHr ?? null,
          dominant_zone,
          calories: calories ?? null,
          notes: notes ?? null,
        })
        .select()
        .single()

      if (error) return secureErrorResponse('Failed to log workout', 500)
      return secureJsonResponse({ data })
    }

    return secureErrorResponse('Unknown action', 400)
  }
)
