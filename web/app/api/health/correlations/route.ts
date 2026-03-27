import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { getServerCache } from '@/lib/server-cache'

export const dynamic = 'force-dynamic'

interface CorrelationMatrix {
  metrics: string[]
  values: number[][]
  data_points: number
  date_range: { start: string; end: string }
}

// Pearson correlation coefficient
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length < 2 || y.length < 2 || x.length !== y.length) return 0

  const n = x.length
  const meanX = x.reduce((a, b) => a + b, 0) / n
  const meanY = y.reduce((a, b) => a + b, 0) / n

  const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0)
  const denomX = Math.sqrt(x.reduce((sum, xi) => sum + (xi - meanX) ** 2, 0))
  const denomY = Math.sqrt(y.reduce((sum, yi) => sum + (yi - meanY) ** 2, 0))

  if (denomX === 0 || denomY === 0) return 0
  return numerator / (denomX * denomY)
}

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '90', 10)

    if (![30, 90, 180, 365].includes(days)) {
      return secureErrorResponse('Days must be 30, 90, 180, or 365', 400)
    }

    // Check cache first
    const cache = getServerCache()
    const cacheKey = `correlations:${user!.id}:${days}`
    const cached = cache.get(cacheKey)
    if (cached) {
      const response = secureJsonResponse(cached as CorrelationMatrix)
      response.headers.set('X-Cache', 'HIT')
      response.headers.set('Cache-Control', 'max-age=3600, s-maxage=3600')
      return response
    }

    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - days * 24 * 3600 * 1000)
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    // Fetch daily summaries with all relevant metrics
    const { data: dailyData, error } = await supabase
      .from('daily_summaries')
      .select(
        'date,steps,active_calories,distance_meters,resting_heart_rate,avg_hrv,sleep_duration_minutes,recovery_score'
      )
      .eq('user_id', user!.id)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: true })

    if (error || !dailyData || dailyData.length < 10) {
      return secureJsonResponse({
        metrics: ['steps', 'sleep', 'hrv', 'resting_hr', 'calories'],
        values: [[], [], [], [], []],
        data_points: 0,
        date_range: { start: startDateStr, end: endDateStr },
      })
    }

    const metricNames = ['steps', 'sleep', 'hrv', 'resting_hr', 'calories', 'recovery_score']

    const metricArrays = metricNames.map(name => ({
      name,
      values: dailyData
        .map(d => {
          if (name === 'steps') return d.steps
          if (name === 'sleep') return d.sleep_duration_minutes
          if (name === 'hrv') return d.avg_hrv
          if (name === 'resting_hr') return d.resting_heart_rate
          if (name === 'calories') return d.active_calories
          if (name === 'recovery_score') return d.recovery_score
          return null
        })
        .map(v => v === null ? undefined : v) as (number | undefined)[],
    }))

    const correlationMatrix: number[][] = []

    for (let i = 0; i < metricNames.length; i++) {
      correlationMatrix[i] = []
      for (let j = 0; j < metricNames.length; j++) {
        if (i === j) {
          correlationMatrix[i][j] = 1
        } else {
          const aligned = { x: [] as number[], y: [] as number[] }
          for (let k = 0; k < dailyData.length; k++) {
            const xVal = metricArrays[i].values[k]
            const yVal = metricArrays[j].values[k]
            if (xVal !== undefined && xVal !== null && yVal !== undefined && yVal !== null) {
              aligned.x.push(xVal)
              aligned.y.push(yVal)
            }
          }
          correlationMatrix[i][j] = aligned.x.length > 0 ? calculateCorrelation(aligned.x, aligned.y) : 0
        }
      }
    }

    const result: CorrelationMatrix = {
      metrics: metricNames,
      values: correlationMatrix,
      data_points: dailyData.length,
      date_range: { start: startDateStr, end: endDateStr },
    }

    cache.set(cacheKey, result, 3600)

    const response = secureJsonResponse(result)
    response.headers.set('X-Cache', 'MISS')
    response.headers.set('Cache-Control', 'max-age=3600, s-maxage=3600')
    return response
  }
)
