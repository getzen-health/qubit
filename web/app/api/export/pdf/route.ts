import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const from = searchParams.get('from') || new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0]
  const to = searchParams.get('to') || new Date().toISOString().split('T')[0]

  // Fetch data in parallel
  const [metrics, sleepData, medications] = await Promise.all([
    supabase.from('health_metrics').select('*').eq('user_id', user.id).gte('recorded_at', from).lte('recorded_at', to).order('recorded_at'),
    supabase.from('sleep_records').select('*').eq('user_id', user.id).gte('sleep_start', from).lte('sleep_start', to).order('sleep_start'),
    supabase.from('medications').select('*').eq('user_id', user.id).eq('is_active', true),
  ])

  // Build a structured JSON report
  const report = {
    generated_at: new Date().toISOString(),
    period: { from, to },
    user_id: user.id,
    summary: {
      total_days: Math.round((new Date(to).getTime() - new Date(from).getTime()) / (1000*60*60*24)) + 1,
      metrics_recorded: metrics.data?.length ?? 0,
      sleep_sessions: sleepData.data?.length ?? 0,
      active_medications: medications.data?.length ?? 0,
    },
    health_metrics: metrics.data ?? [],
    sleep_records: sleepData.data ?? [],
    medications: medications.data ?? [],
  }

  // Return as JSON with a special header that triggers the web page to generate PDF client-side
  // (Server-side PDF generation with jspdf requires dynamic import which can be complex)
  // Instead: return the data and let the client page generate PDF using jspdf
  return NextResponse.json(report)
}
