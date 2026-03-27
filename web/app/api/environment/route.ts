import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const { searchParams } = request.nextUrl
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')

    let outdoorAQI = null
    let pm25 = null
    let pm10 = null
    let uvIndex = null
    let uvCategory: string | null = null

    if (lat && lon) {
      try {
        // Fetch air quality + UV index in parallel
        const [aqRes, uvRes] = await Promise.all([
          fetch(
            `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,european_aqi,us_aqi&timezone=auto`,
            { next: { revalidate: 1800 } }
          ),
          fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=uv_index&timezone=auto`,
            { next: { revalidate: 1800 } }
          ),
        ])
        const aqData = await aqRes.json()
        const uvData = await uvRes.json()
        outdoorAQI = aqData?.current?.us_aqi ?? null
        pm25 = aqData?.current?.pm2_5 ?? null
        pm10 = aqData?.current?.pm10 ?? null
        uvIndex = uvData?.current?.uv_index ?? null
        if (uvIndex !== null) {
          if (uvIndex < 3) uvCategory = 'Low'
          else if (uvIndex < 6) uvCategory = 'Moderate'
          else if (uvIndex < 8) uvCategory = 'High'
          else if (uvIndex < 11) uvCategory = 'Very High'
          else uvCategory = 'Extreme'
        }
      } catch { /* ignore fetch errors */ }
    }

    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const { data: indoorLogs } = await supabase
      .from('environment_logs')
      .select('*')
      .eq('user_id', user!.id)
      .gte('logged_at', sevenDaysAgo.toISOString())
      .order('logged_at', { ascending: false })

    return secureJsonResponse({ outdoorAQI, pm25, pm10, uvIndex, uvCategory, indoorLogs: indoorLogs ?? [] })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const body = await request.json()
    const { data, error } = await supabase.from('environment_logs').insert({ ...body, user_id: user!.id }).select().single()
    if (error) return secureErrorResponse('Failed to log environment data', 400)
    return secureJsonResponse(data)
  }
)
