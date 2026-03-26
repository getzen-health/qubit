import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getServerCache } from '@/lib/server-cache'

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const rangeParam = searchParams.get('range') ?? '24h'

  let rangeMs = 86400000 // default 24h
  if (rangeParam === '7d') rangeMs = 7 * 86400000
  if (rangeParam === '30d') rangeMs = 30 * 86400000

  // Check cache first
  const cache = getServerCache()
  const cacheKey = `glucose:${user.id}:${rangeParam}`
  const cached = cache.get(cacheKey)
  if (cached) {
    return NextResponse.json(cached, {
      headers: { 'X-Cache': 'HIT', 'Cache-Control': 'max-age=300, s-maxage=300' },
    })
  }

  const startTime = new Date(Date.now() - rangeMs).toISOString()

  const { data: records, error } = await supabase
    .from('health_records')
    .select('value, start_time')
    .eq('user_id', user.id)
    .eq('type', 'blood_glucose')
    .gte('start_time', startTime)
    .gt('value', 0)
    .order('start_time', { ascending: true })
    .limit(288)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch glucose data' }, { status: 500 })
  }

  const readings = (records ?? [])
    .filter((r) => r.value > 30 && r.value < 600)
    .map((r) => ({
      timestamp: r.start_time,
      mgdl: Math.round(r.value),
      mmol: +(r.value / 18.0).toFixed(1),
      hour: new Date(r.start_time).getHours(),
    }))

  const result = { readings }

  // Cache for 5 minutes
  cache.set(cacheKey, result, 300)

  return NextResponse.json(result, {
    headers: { 'X-Cache': 'MISS', 'Cache-Control': 'max-age=300, s-maxage=300' },
  })
}
