import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('hydration_reminder_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(
    data || {
      enabled: true,
      start_hour: 8,
      end_hour: 20,
      interval_hours: 2
    }
  )
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { enabled, start_hour, end_hour, interval_hours } = body

  const { error } = await supabase
    .from('hydration_reminder_settings')
    .upsert({
      user_id: user.id,
      enabled,
      start_hour,
      end_hour,
      interval_hours,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
