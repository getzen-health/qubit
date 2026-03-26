import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get last 7 days of step data to calculate streak
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: steps } = await supabase
    .from('health_metrics')
    .select('value, recorded_at')
    .eq('user_id', user.id)
    .eq('metric_type', 'steps')
    .gte('recorded_at', sevenDaysAgo.toISOString())
    .order('recorded_at', { ascending: false })

  const todaySteps = steps?.[0]?.value ?? 0
  const streak = steps?.length ?? 0

  return NextResponse.json({ streak, steps: todaySteps })
}
