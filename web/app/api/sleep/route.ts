import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rateLimitResult = await checkRateLimit(user.id, 'healthData')
  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }
  const { bedtime, wake_time, quality } = await request.json()
  if (!bedtime || !wake_time) return NextResponse.json({ error: 'bedtime and wake_time required' }, { status: 400 })
  const duration_minutes = Math.round((new Date(wake_time).getTime() - new Date(bedtime).getTime()) / 60000)
  const { data, error } = await supabase
    .from('sleep_records')
    .insert({ user_id: user.id, start_time: bedtime, end_time: wake_time, duration_minutes, quality: quality || null, source: 'manual' })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
