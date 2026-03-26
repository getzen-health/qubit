import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'
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

export async function GET(_request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('vo2max_tests')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const tests = (data ?? []) as VO2MaxTest[]
  const latest = tests[0] ?? null
  const analysis = latest ? analyzeVO2Max(latest) : null

  return NextResponse.json({ tests, latest, analysis })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimitResult = await checkRateLimit(user.id, 'healthData')
  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

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
    return NextResponse.json({ error: 'method and date are required' }, { status: 400 })
  }

  let vo2max_estimated: number

  if (method === 'cooper_12min') {
    if (!distance_meters) return NextResponse.json({ error: 'distance_meters required' }, { status: 400 })
    vo2max_estimated = estimateCooper(Number(distance_meters))
  } else if (method === 'resting_hr') {
    if (!resting_hr || !max_hr)
      return NextResponse.json({ error: 'resting_hr and max_hr required' }, { status: 400 })
    vo2max_estimated = estimateRestingHR(Number(resting_hr), Number(max_hr))
  } else if (method === 'one_mile_walk') {
    if (!walk_time_min || !walk_end_hr || !weight_lbs || !age || !sex)
      return NextResponse.json(
        { error: 'walk_time_min, walk_end_hr, weight_lbs, age, sex required' },
        { status: 400 }
      )
    vo2max_estimated = estimateOneMileWalk({
      timeMins: Number(walk_time_min),
      endHR: Number(walk_end_hr),
      weightLbs: Number(weight_lbs),
      age: Number(age),
      sex: sex as Sex,
    })
  } else {
    return NextResponse.json({ error: 'Invalid method' }, { status: 400 })
  }

  const resolvedAge = Number(age) || 30
  const resolvedSex: Sex = sex === 'female' ? 'female' : 'male'
  const crf_category = getCRFCategory(vo2max_estimated, resolvedAge, resolvedSex)
  const met_capacity = Math.round((vo2max_estimated / 3.5) * 10) / 10
  const percentile = getPercentile(vo2max_estimated, resolvedAge, resolvedSex)

  const { data, error } = await supabase
    .from('vo2max_tests')
    .insert({
      user_id: user.id,
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const test = data as VO2MaxTest
  const analysis = analyzeVO2Max(test)

  return NextResponse.json({ test, analysis }, { status: 201 })
}
