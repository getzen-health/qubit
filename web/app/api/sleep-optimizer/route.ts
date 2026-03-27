import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    // Fetch optimizer settings
    const { data: settings } = await supabase
      .from('sleep_optimizer_settings')
      .select('*')
      .eq('user_id', user!.id)
      .single()

    // Fetch last 14 days of sleep from sleep_records
    const since = new Date()
    since.setDate(since.getDate() - 14)

    const { data: sleepRecords } = await supabase
      .from('sleep_records')
      .select('start_time, end_time, duration_minutes, quality')
      .eq('user_id', user!.id)
      .gte('start_time', since.toISOString())
      .order('start_time', { ascending: true })

    const sleepLogs = (sleepRecords ?? []).map((r) => ({
      date: r.start_time ? r.start_time.split('T')[0] : '',
      durationH: r.duration_minutes ? r.duration_minutes / 60 : 0,
      quality: r.quality ?? null,
    }))

    return secureJsonResponse({ settings: settings ?? null, sleepLogs })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const {
      chronotype,
      meq_score,
      meq_answers,
      target_wake_time,
      target_bed_time,
      sleep_goal_hours,
      caffeine_sensitivity,
      weekday_wake_time,
      weekend_wake_time,
    } = await request.json()

    const { data, error } = await supabase
      .from('sleep_optimizer_settings')
      .upsert(
        {
          user_id: user!.id,
          ...(chronotype !== undefined && { chronotype }),
          ...(meq_score !== undefined && { meq_score }),
          ...(meq_answers !== undefined && { meq_answers }),
          ...(target_wake_time !== undefined && { target_wake_time }),
          ...(target_bed_time !== undefined && { target_bed_time }),
          ...(sleep_goal_hours !== undefined && { sleep_goal_hours }),
          ...(caffeine_sensitivity !== undefined && { caffeine_sensitivity }),
          ...(weekday_wake_time !== undefined && { weekday_wake_time }),
          ...(weekend_wake_time !== undefined && { weekend_wake_time }),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ data })
  }
)
