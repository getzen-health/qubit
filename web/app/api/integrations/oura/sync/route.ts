import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: integration } = await supabase
    .from('integrations')
    .select('access_token')
    .eq('user_id', user.id)
    .eq('provider', 'oura')
    .single()

  if (!integration?.access_token) {
    return NextResponse.json({ error: 'Oura not connected' }, { status: 400 })
  }

  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

  const sleepRes = await fetch(
    `https://api.ouraring.com/v2/usercollection/daily_sleep?start_date=${startDate}&end_date=${endDate}`,
    { headers: { 'Authorization': `Bearer ${integration.access_token}` } }
  )

  if (!sleepRes.ok) return NextResponse.json({ error: 'Failed to fetch Oura sleep data' }, { status: 502 })
  const sleepData = await sleepRes.json()

  const records = (sleepData.data ?? []).map((d: Record<string, unknown>) => ({
    user_id: user.id,
    date: d.day,
    duration_minutes: Math.round(Number(d.total_sleep_duration ?? 0) / 60),
    source: 'oura'
  }))

  if (records.length > 0) {
    await supabase.from('sleep_records').upsert(records, { onConflict: 'user_id,date' })
  }

  return NextResponse.json({ synced: records.length })
}
