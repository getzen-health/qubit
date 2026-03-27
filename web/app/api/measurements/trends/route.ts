import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') ?? '30')
    const since = new Date(Date.now() - days * 86400000).toISOString()

    const { data, error } = await supabase
      .from('body_measurements')
      .select('measured_at, weight_kg, bmi, body_fat_pct, waist_cm, hip_cm, chest_cm')
      .eq('user_id', user.id)
      .gte('measured_at', since)
      .order('measured_at', { ascending: true })

    if (error) throw error

    const { data: settingsData } = await supabase
      .from('user_settings')
      .select('goal_weight_kg')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      data: data ?? [],
      goalWeight: settingsData?.goal_weight_kg ?? null,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
