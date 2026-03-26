import { createClient } from '@/lib/supabase/server'
import { apiResponse } from '@/lib/api-response'
import { getServerCache } from '@/lib/server-cache'
import { trackApiCall } from '@/lib/monitoring'

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

export async function GET(request: Request) {
  const startTime = Date.now()
  let statusCode = 200
  const user_id = (await createClient()).auth.getUser().then(r => r.data.user?.id)

  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '90', 10)

    if (![30, 90, 180, 365].includes(days)) {
      statusCode = 400
      return apiResponse({ error: 'Days must be 30, 90, 180, or 365' }, 400)
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      statusCode = 401
      return apiResponse({ error: 'Unauthorized' }, 401)
    }

    // Check cache first
    const cache = getServerCache()
    const cacheKey = `correlations:${user.id}:${days}`
    const cached = cache.get(cacheKey)
    if (cached) {
      const duration = Date.now() - startTime
      void trackApiCall({
        endpoint: '/api/health/correlations',
        duration_ms: duration,
        status_code: 200,
        user_id: user.id,
      })
      return apiResponse(cached, 200, undefined, { 'X-Cache': 'HIT', 'Cache-Control': 'max-age=3600, s-maxage=3600' })
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
      .eq('user_id', user.id)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: true })

    if (error || !dailyData || dailyData.length < 10) {
      const duration = Date.now() - startTime
      statusCode = 200 // Still valid response with empty data
      void trackApiCall({
        endpoint: '/api/health/correlations',
        duration_ms: duration,
        status_code: statusCode,
        user_id: user.id,
      })
      return apiResponse({
        metrics: ['steps', 'sleep', 'hrv', 'resting_hr', 'calories'],
        values: [[], [], [], [], []],
        data_points: 0,
        date_range: { start: startDateStr, end: endDateStr },
      })
    }

    // Extract metric arrays (filtering out nulls)
    const metrics = {
      steps: dailyData.map(d => d.steps).filter(Boolean) as number[],
      sleep: dailyData.map(d => d.sleep_duration_minutes).filter(Boolean) as number[],
      hrv: dailyData.map(d => d.avg_hrv).filter(Boolean) as number[],
      resting_hr: dailyData.map(d => d.resting_heart_rate).filter(Boolean) as number[],
      calories: dailyData.map(d => d.active_calories).filter(Boolean) as number[],
      recovery_score: dailyData.map(d => d.recovery_score).filter(Boolean) as number[],
    }

    const metricNames = ['steps', 'sleep', 'hrv', 'resting_hr', 'calories', 'recovery_score']
    const metricValues = Object.values(metrics)

    // Calculate correlation matrix
    // All metrics need to be aligned for correlation calculation
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
          // Align arrays to only include entries where both have values
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

    // Cache for 1 hour for correlations
    cache.set(cacheKey, result, 3600)

    const duration = Date.now() - startTime
    void trackApiCall({
      endpoint: '/api/health/correlations',
      duration_ms: duration,
      status_code: 200,
      user_id: user.id,
    })

    return apiResponse(result, 200, undefined, { 'X-Cache': 'MISS', 'Cache-Control': 'max-age=3600, s-maxage=3600' })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('Correlation calculation error:', error)
    void trackApiCall({
      endpoint: '/api/health/correlations',
      duration_ms: duration,
      status_code: 500,
      user_id: user_id,
    })
    return apiResponse(
      { error: 'Failed to calculate correlations' },
      500
    )
  }
}
