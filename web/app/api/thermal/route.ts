import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { analyzeThermal, type ThermalLog } from '@/lib/thermoregulation'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const since = new Date()
    since.setDate(since.getDate() - 30)
    const sinceStr = since.toISOString().slice(0, 10)

    const { data: logs, error } = await supabase
      .from('thermal_exposure_logs')
      .select('*')
      .eq('user_id', user!.id)
      .gte('date', sinceStr)
      .order('date', { ascending: false })
      .limit(60)

    if (error) return secureErrorResponse('Failed to fetch thermal logs', 500)

    const typedLogs = (logs ?? []) as ThermalLog[]
    const analysis = analyzeThermal(typedLogs)

    const totalColdMin = typedLogs
      .filter(l => l.session_type === 'cold' || l.session_type === 'contrast')
      .reduce((s, l) => s + l.duration_min, 0)
    const totalSaunaMin = typedLogs
      .filter(l => l.session_type === 'sauna' || l.session_type === 'contrast')
      .reduce((s, l) => s + l.duration_min, 0)

    return secureJsonResponse({ logs: typedLogs, analysis, totalColdMin, totalSaunaMin })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const body = await req.json()
    const payload: Omit<ThermalLog, 'id' | 'created_at'> = {
      user_id: user!.id,
      date: body.date ?? new Date().toISOString().slice(0, 10),
      session_type: body.session_type,
      method: body.method ?? '',
      temp_f: Number(body.temp_f ?? 50),
      duration_min: Number(body.duration_min ?? 5),
      protocol: body.protocol ?? '',
      time_of_day: body.time_of_day ?? 'morning',
      alertness_after: Number(body.alertness_after ?? 3),
      mood_after: Number(body.mood_after ?? 3),
      recovery_rating: Number(body.recovery_rating ?? 3),
      sleep_quality_that_night: body.sleep_quality_that_night ? Number(body.sleep_quality_that_night) : null as unknown as number,
      notes: body.notes ?? '',
    }

    const { data, error } = await supabase
      .from('thermal_exposure_logs')
      .insert([payload])
      .select()
      .single()

    if (error) return secureErrorResponse('Failed to save thermal log', 400)
    return secureJsonResponse({ log: data })
  }
)

export const DELETE = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const { id } = await req.json()
    const { error } = await supabase
      .from('thermal_exposure_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id)

    if (error) return secureErrorResponse('Failed to delete thermal log', 400)
    return secureJsonResponse({ success: true })
  }
)
