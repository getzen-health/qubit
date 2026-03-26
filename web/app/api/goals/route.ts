import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { data, error } = await supabase
    .from('user_goals')
    .select('*')
    .eq('user_id', user.id)
    .single()
  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  // Defaults if not set
  const defaults = {
    daily_steps: 10000,
    sleep_hours: 8.0,
    water_liters: 2.5,
    target_weight_kg: null,
    calorie_budget: 2000
  }
      return NextResponse.json(data ? data : { ...defaults, user_id: user.id })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json()
  const { daily_steps, sleep_hours, water_liters, target_weight_kg, calorie_budget } = body
  const { error } = await supabase
    .from('user_goals')
    .upsert({
      user_id: user.id,
      daily_steps,
      sleep_hours,
      water_liters,
      target_weight_kg,
      calorie_budget,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
      return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
