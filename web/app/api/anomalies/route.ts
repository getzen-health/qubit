import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch unacknowledged anomalies from last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: anomalies, error } = await supabase
    .from('anomalies')
    .select('id, metric, value, avg_value, deviation, severity, claude_explanation, detected_at, dismissed_at')
    .eq('user_id', user.id)
    .is('dismissed_at', null)
    .gte('detected_at', sevenDaysAgo.toISOString())
    .order('detected_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    anomalies: anomalies ?? [],
    count: (anomalies ?? []).length,
  })
}
