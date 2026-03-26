import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'
import { calculateBPStats } from '@/lib/blood-pressure'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('blood_pressure_logs')
    .select('id, systolic, diastolic, pulse, arm, time_of_day, notes, measured_at')
    .eq('user_id', user.id)
    .order('measured_at', { ascending: false })
    .limit(30)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const readings = (data ?? []).map((r) => ({
    ...r,
    date: r.measured_at?.split('T')[0] ?? '',
    arm: (r.arm ?? 'left') as 'left' | 'right',
    time_of_day: (r.time_of_day ?? 'morning') as 'morning' | 'midday' | 'evening' | 'night',
  }))

  const stats = readings.length > 0 ? calculateBPStats(readings) : null
  return NextResponse.json({ data, stats })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rateLimitResult = await checkRateLimit(user.id, 'healthData')
  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  const body = await request.json()
  const { systolic, diastolic, pulse, arm, time_of_day, notes, measured_at } = body
  if (!systolic || !diastolic) {
    return NextResponse.json({ error: 'systolic and diastolic required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('blood_pressure_logs')
    .insert({
      user_id: user.id,
      systolic: Number(systolic),
      diastolic: Number(diastolic),
      pulse: pulse ? Number(pulse) : null,
      arm: arm ?? 'left',
      time_of_day: time_of_day ?? 'morning',
      notes: notes || null,
      measured_at: measured_at ?? new Date().toISOString(),
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('blood_pressure_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
