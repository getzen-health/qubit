import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { estimateVitaminD, getSeasonFromMonth } from '@/lib/vitamin-d'

// GET: Return last 7 days logs and total IU
// POST: Log new exposure
// DELETE: Remove a log by id

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const { data, error } = await supabase
      .from('sun_exposure_logs')
      .select('*')
      .eq('user_id', user!.id)
      .order('logged_at', { ascending: false })
      .limit(7)

    if (error) return secureErrorResponse('Failed to fetch sun exposure logs', 500)

    const totalIU = data?.reduce((sum, log) => sum + (log.estimated_iu || 0), 0) || 0
    return secureJsonResponse({ logs: data, totalIU })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const body = await req.json()
    // Required: duration_min, uv_index, skin_type, body_exposure, spf, latitude, longitude
    const now = new Date()
    const season = getSeasonFromMonth(now.getMonth() + 1)
    const latitudeRisk = Math.abs(body.latitude) > 50 ? 'high' : Math.abs(body.latitude) > 35 ? 'medium' : 'low'
    const estimated_iu = estimateVitaminD({
      durationMin: body.duration_min,
      uvIndex: body.uv_index,
      skinType: body.skin_type,
      bodyExposure: body.body_exposure,
      spf: body.spf,
      season,
      latitudeRisk,
    })
    const { data, error } = await supabase
      .from('sun_exposure_logs')
      .insert([{ ...body, user_id: user!.id, estimated_iu }])
      .select()
      .single()
    if (error) return secureErrorResponse('Failed to save sun exposure log', 500)
    return secureJsonResponse({ log: data })
  }
)

export const DELETE = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const { id } = await req.json()
    if (!id) return secureErrorResponse('Missing id', 400)
    const { error } = await supabase
      .from('sun_exposure_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id)
    if (error) return secureErrorResponse('Failed to delete sun exposure log', 500)
    return secureJsonResponse({ success: true })
  }
)
