import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const since = new Date()
  since.setDate(since.getDate() - 180)

  const [{ data: logs, error: logsError }, { data: settings, error: settingsError }] = await Promise.all([
    supabase
      .from('biometric_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', since.toISOString().split('T')[0])
      .order('date', { ascending: true }),
    supabase
      .from('biometric_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  if (logsError) return NextResponse.json({ error: logsError.message }, { status: 500 })
  if (settingsError) return NextResponse.json({ error: settingsError.message }, { status: 500 })

  return NextResponse.json({ logs: logs ?? [], settings: settings ?? null })
}

export async function POST(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  if (body.type === 'settings') {
    const { type: _t, ...fields } = body
    const { data, error } = await supabase
      .from('biometric_settings')
      .upsert({ user_id: user.id, ...fields, updated_at: new Date().toISOString() })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ settings: data })
  }

  // Default: upsert a biometric log entry
  const {
    date,
    weight_kg,
    body_fat_pct,
    waist_cm,
    hip_cm,
    neck_cm,
    chest_cm,
    arm_cm,
    thigh_cm,
    calf_cm,
    notes,
  } = body

  if (!date) return NextResponse.json({ error: 'date is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('biometric_logs')
    .upsert(
      {
        user_id: user.id,
        date,
        weight_kg: weight_kg ?? null,
        body_fat_pct: body_fat_pct ?? null,
        waist_cm: waist_cm ?? null,
        hip_cm: hip_cm ?? null,
        neck_cm: neck_cm ?? null,
        chest_cm: chest_cm ?? null,
        arm_cm: arm_cm ?? null,
        thigh_cm: thigh_cm ?? null,
        calf_cm: calf_cm ?? null,
        notes: notes ?? null,
      },
      { onConflict: 'user_id,date' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ log: data })
}
