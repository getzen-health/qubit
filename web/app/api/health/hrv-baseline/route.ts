import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const d30 = new Date(Date.now() - 30 * 86400000).toISOString()
  const { data } = await supabase
    .from('health_records')
    .select('value,recorded_at')
    .eq('user_id', user.id)
    .eq('metric_type', 'heartRateVariabilitySDNN')
    .gte('recorded_at', d30)
    .order('recorded_at', { ascending: true })

  const values = (data ?? []).map(r => Number(r.value)).filter(v => v > 0)
  const baseline = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null
  const stdDev = baseline && values.length > 1
    ? Math.round(Math.sqrt(values.reduce((a, b) => a + Math.pow(b - baseline, 2), 0) / values.length))
    : null

  return NextResponse.json({
    baseline,
    stdDev,
    upperBand: baseline && stdDev ? baseline + stdDev : null,
    lowerBand: baseline && stdDev ? baseline - stdDev : null,
    dataPoints: values.length,
    daily: (data ?? []).map(r => ({ date: r.recorded_at.split('T')[0], hrv: Number(r.value) })),
  })
}
