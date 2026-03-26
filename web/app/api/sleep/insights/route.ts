import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch last 7 sleep records
  const { data: sleepRecords } = await supabase
    .from('sleep_records')
    .select('date, duration_hours, quality_score')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(7)

  if (!sleepRecords || sleepRecords.length < 3) {
    return NextResponse.json({ insight: 'Log at least 3 nights of sleep to get insights.', avgDuration: null })
  }

  // Call edge function
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/analyze-sleep`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ sleepRecords, userId: user.id })
  })
  const data = await res.json()
  return NextResponse.json(data)
}
