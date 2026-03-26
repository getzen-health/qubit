import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
  try {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]
  const d7 = new Date(Date.now() - 7 * 86400000).toISOString()

  const [{ data: sleep }, { data: hrv }, { data: steps }] = await Promise.all([
    supabase.from('sleep_records').select('duration_minutes').eq('user_id', user.id).eq('date', today).single(),
    supabase.from('health_records').select('value').eq('user_id', user.id).eq('metric_type', 'heartRateVariabilitySDNN').gte('recorded_at', d7).order('recorded_at', { ascending: false }).limit(1).single(),
    supabase.from('health_records').select('value').eq('user_id', user.id).eq('metric_type', 'stepCount').gte('recorded_at', d7).order('recorded_at', { ascending: false }).limit(1).single(),
  ])

  const recommendations: { type: string; message: string; priority: 'high' | 'medium' | 'low' }[] = []

  const sleepHours = sleep ? Number(sleep.duration_minutes) / 60 : null
  if (sleepHours !== null && sleepHours < 7) {
    recommendations.push({ type: 'sleep', message: `Sleep was ${sleepHours.toFixed(1)}h — aim for 7-8h tonight. Consider a lighter workout today.`, priority: 'high' })
  }

  const hrvVal = hrv ? Number(hrv.value) : null
  if (hrvVal !== null && hrvVal > 50) {
    recommendations.push({ type: 'training', message: 'HRV is strong — your body is ready for a challenging workout today.', priority: 'medium' })
  } else if (hrvVal !== null && hrvVal < 30) {
    recommendations.push({ type: 'recovery', message: 'HRV is low — focus on recovery today. Light walk or stretching recommended.', priority: 'high' })
  }

  const stepsVal = steps ? Number(steps.value) : null
  if (stepsVal !== null && stepsVal < 5000) {
    recommendations.push({ type: 'activity', message: 'Step count is low this week. Aim for 8,000+ steps today.', priority: 'medium' })
  }

  if (recommendations.length === 0) {
    recommendations.push({ type: 'general', message: 'Great consistency! Keep up your current routine.', priority: 'low' })
  }

  return NextResponse.json({ recommendations, generatedAt: new Date().toISOString() })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 })
  }
}
