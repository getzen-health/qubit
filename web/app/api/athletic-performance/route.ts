import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'
import { calculateTrainingMetrics, calculateSessionLoad } from '@/lib/athletic-performance'

export async function GET(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const since = new Date()
  since.setDate(since.getDate() - 90)
  const sinceDate = since.toISOString().slice(0, 10)

  const { data: rows, error } = await supabase
    .from('training_sessions')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', sinceDate)
    .order('date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const sessions = (rows ?? []).map((r) => ({
    id: r.id,
    date: r.date,
    sport: r.sport,
    durationMin: r.duration_min,
    rpe: r.rpe,
    sessionLoad: r.session_load,
    workoutType: r.workout_type,
    heartRateAvg: r.heart_rate_avg,
    heartRateMax: r.heart_rate_max,
    distanceKm: r.distance_km,
    elevationM: r.elevation_m,
    notes: r.notes,
  }))

  const metrics = calculateTrainingMetrics(sessions)

  return NextResponse.json({ sessions, metrics })
}

export async function POST(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: {
    date: string
    sport: string
    durationMin: number
    rpe: number
    workoutType?: string
    heartRateAvg?: number
    heartRateMax?: number
    distanceKm?: number
    elevationM?: number
    notes?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }

  const { date, sport, durationMin, rpe, workoutType, heartRateAvg, heartRateMax, distanceKm, elevationM, notes } = body

  if (!date || !sport || !durationMin || !rpe) {
    return NextResponse.json({ error: 'date, sport, durationMin, and rpe are required' }, { status: 400 })
  }

  const sessionLoad = calculateSessionLoad(durationMin, rpe)

  const { data, error } = await supabase
    .from('training_sessions')
    .insert({
      user_id: user.id,
      date,
      sport,
      duration_min: durationMin,
      rpe,
      session_load: sessionLoad,
      workout_type: workoutType ?? 'moderate',
      heart_rate_avg: heartRateAvg ?? null,
      heart_rate_max: heartRateMax ?? null,
      distance_km: distanceKm ?? null,
      elevation_m: elevationM ?? null,
      notes: notes ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ session: data }, { status: 201 })
}
