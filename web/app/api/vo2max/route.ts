import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'
import {
  estimateCooper,
  estimateRestingHR,
  estimateOneMileWalk,
  getCRFCategory,
  getPercentile,
  analyzeVO2Max,
  type VO2MaxTest,
  type Sex,
} from '@/lib/vo2max'

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_request, { user, supabase }) => {
    const { data, error } = await supabase
      .from('vo2max_tests')
      .select('*')
      .eq('user_id', user!.id)
      .order('date', { ascending: false })
      .limit(50)

    if (error) return secureErrorResponse('Failed to fetch VO2max tests', 500)

    const tests = (data ?? []) as VO2MaxTest[]
    const latest = tests[0] ?? null
    const analysis = latest ? analyzeVO2Max(latest) : null

    return secureJsonResponse({ tests, latest, analysis })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (request, { user, supabase }) => {
    const body = await request.json()
    const {
      date,
      method,
      distance_meters,
      resting_hr,
      max_hr,
      walk_time_min,
      walk_end_hr,
      weight_lbs,
      age,
      sex,
      notes,
    } = body

    if (!method || !date) {
      return secureErrorResponse('method and date are required', 400)
    }

    let vo2max_estimated: number

    if (method === 'cooper_12min') {
      if (!distance_meters) return secureErrorResponse('distance_meters required', 400)
      vo2max_estimated = estimateCooper(Number(distance_meters))
    } else if (method === 'resting_hr') {
      if (!resting_hr || !max_hr)
        return secureErrorResponse('resting_hr and max_hr required', 400)
      vo2max_estimated = estimateRestingHR(Number(resting_hr), Number(max_hr))
    } else if (method === 'one_mile_walk') {
      if (!walk_time_min || !walk_end_hr || !weight_lbs || !age || !sex)
        return secureErrorResponse(
          'walk_time_min, walk_end_hr, weight_lbs, age, sex required',
          400
        )
      vo2max_estimated = estimateOneMileWalk({
        timeMins: Number(walk_time_min),
        endHR: Number(walk_end_hr),
        weightLbs: Number(weight_lbs),
        age: Number(age),
        sex: sex as Sex,
      })
    } else {
      return secureErrorResponse('Invalid method', 400)
    }

    const resolvedAge = Number(age) || 30
    const resolvedSex: Sex = sex === 'female' ? 'female' : 'male'
    const crf_category = getCRFCategory(vo2max_estimated, resolvedAge, resolvedSex)
    const met_capacity = Math.round((vo2max_estimated / 3.5) * 10) / 10
    const percentile = getPercentile(vo2max_estimated, resolvedAge, resolvedSex)

    const { data, error } = await supabase
      .from('vo2max_tests')
      .insert({
        user_id: user!.id,
        date,
        method,
        distance_meters: distance_meters ? Number(distance_meters) : null,
        resting_hr: resting_hr ? Number(resting_hr) : null,
        max_hr: max_hr ? Number(max_hr) : null,
        walk_time_min: walk_time_min ? Number(walk_time_min) : null,
        walk_end_hr: walk_end_hr ? Number(walk_end_hr) : null,
        weight_lbs: weight_lbs ? Number(weight_lbs) : null,
        age: age ? Number(age) : null,
        sex: sex ?? null,
        vo2max_estimated,
        crf_category,
        met_capacity,
        percentile,
        notes: notes ?? null,
      })
      .select()
      .single()

    if (error) return secureErrorResponse('Failed to save VO2max test', 500)

    const test = data as VO2MaxTest
    const analysis = analyzeVO2Max(test)

    return secureJsonResponse({ test, analysis }, 201)
  }
)
