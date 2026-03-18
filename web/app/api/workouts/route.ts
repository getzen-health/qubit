import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    workout_type,
    duration_minutes,
    active_calories,
    distance_meters,
    avg_heart_rate,
    notes,
    start_time,
  } = body

  if (!workout_type || !duration_minutes || duration_minutes <= 0) {
    return NextResponse.json({ error: 'workout_type and duration_minutes are required' }, { status: 400 })
  }

  const startTime = start_time ? new Date(start_time) : new Date()
  const endTime = new Date(startTime.getTime() + duration_minutes * 60 * 1000)

  // Compute pace if distance provided
  let avg_pace_per_km: number | null = null
  if (distance_meters && distance_meters > 0 && duration_minutes > 0) {
    const distanceKm = distance_meters / 1000
    const durationSecs = duration_minutes * 60
    avg_pace_per_km = durationSecs / distanceKm
  }

  const { data: workout, error } = await supabase
    .from('workout_records')
    .insert({
      user_id: user.id,
      workout_type,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      duration_minutes: Math.round(duration_minutes),
      active_calories: active_calories || null,
      distance_meters: distance_meters || null,
      avg_heart_rate: avg_heart_rate || null,
      avg_pace_per_km,
      source: 'manual',
      metadata: notes ? { notes } : {},
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating workout:', error)
    return NextResponse.json({ error: 'Failed to create workout' }, { status: 500 })
  }

  return NextResponse.json({ workout }, { status: 201 })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('workout_records')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'Failed to delete workout' }, { status: 500 })

  return NextResponse.json({ success: true })
}
