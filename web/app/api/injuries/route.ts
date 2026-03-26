import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: logs } = await supabase
    .from('pain_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('logged_at', { ascending: false })
    .limit(100)

  // Group by body region — most recent entry per region
  const byRegion: Record<string, any> = {}
  for (const log of (logs ?? [])) {
    if (!byRegion[log.body_region]) byRegion[log.body_region] = log
  }

  // Recovery status: days since last pain log per region
  const regionSummary = Object.entries(byRegion).map(([region, log]: [string, any]) => {
    const daysSince = Math.floor((Date.now() - new Date(log.logged_at).getTime()) / (1000 * 60 * 60 * 24))
    const status = log.pain_level <= 3 ? 'green' : log.pain_level <= 6 ? 'yellow' : 'red'
    return { region, latestLevel: log.pain_level, daysSince, status, log }
  })

  return NextResponse.json({ logs: logs ?? [], regionSummary })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { data, error } = await supabase.from('pain_logs').insert({ ...body, user_id: user.id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ log: data })
}
