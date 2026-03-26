import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase
    .from('body_measurements')
    .select('*')
    .eq('user_id', user.id)
    .order('measured_at', { ascending: false })
    .limit(30)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
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
  const { weight_kg, waist_cm, neck_cm, hips_cm, height_cm } = body
  if (!weight_kg) return NextResponse.json({ error: 'weight_kg required' }, { status: 400 })
  const { data, error } = await supabase
    .from('body_measurements')
    .insert({ user_id: user.id, weight_kg: Number(weight_kg), waist_cm: waist_cm ? Number(waist_cm) : null, neck_cm: neck_cm ? Number(neck_cm) : null, hips_cm: hips_cm ? Number(hips_cm) : null, height_cm: height_cm ? Number(height_cm) : null, measured_at: new Date().toISOString() })
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
  const { error } = await supabase.from('body_measurements').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { weight_kg, waist_cm, neck_cm, hips_cm, height_cm } = body
  if (!weight_kg) return NextResponse.json({ error: 'weight_kg required' }, { status: 400 })
  const { data, error } = await supabase
    .from('body_measurements')
    .insert({ user_id: user.id, weight_kg: Number(weight_kg), waist_cm: waist_cm ? Number(waist_cm) : null, neck_cm: neck_cm ? Number(neck_cm) : null, hips_cm: hips_cm ? Number(hips_cm) : null, height_cm: height_cm ? Number(height_cm) : null, measured_at: new Date().toISOString() })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
