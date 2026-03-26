import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'
import { analyzeFunctionalFitness, type FunctionalFitnessTest } from '@/lib/functional-fitness'

export async function GET(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)

  const { data, error } = await supabase
    .from('functional_fitness_tests')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const tests = (data ?? []) as FunctionalFitnessTest[]
  const analysed = tests.map(t => ({ test: t, analysis: analyzeFunctionalFitness(t) }))

  return NextResponse.json({ tests: analysed, count: analysed.length })
}

export async function POST(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json() as Partial<FunctionalFitnessTest>

  if (!body.age || !body.sex || !body.date) {
    return NextResponse.json({ error: 'age, sex, and date are required' }, { status: 400 })
  }

  // Compute gait speed from distance/time if not provided
  let gait_speed_mps = body.gait_speed_mps
  if (!gait_speed_mps && body.gait_distance_m && body.gait_time_sec && body.gait_time_sec > 0) {
    gait_speed_mps = Number((body.gait_distance_m / body.gait_time_sec).toFixed(3))
  }

  const payload = {
    user_id: user.id,
    date: body.date,
    age: body.age,
    sex: body.sex,
    height_cm: body.height_cm ?? null,
    weight_kg: body.weight_kg ?? null,
    grip_strength_kg: body.grip_strength_kg ?? null,
    gait_speed_mps: gait_speed_mps ?? null,
    gait_distance_m: body.gait_distance_m ?? null,
    gait_time_sec: body.gait_time_sec ?? null,
    chair_stand_reps: body.chair_stand_reps ?? null,
    balance_eyes_open_sec: body.balance_eyes_open_sec ?? null,
    balance_eyes_closed_sec: body.balance_eyes_closed_sec ?? null,
    walk_6min_meters: body.walk_6min_meters ?? null,
    notes: body.notes ?? null,
  }

  const { data, error } = await supabase
    .from('functional_fitness_tests')
    .insert(payload)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const analysis = analyzeFunctionalFitness(data as FunctionalFitnessTest)
  return NextResponse.json({ test: data, analysis }, { status: 201 })
}
