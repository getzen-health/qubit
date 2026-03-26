/**
 * injury-risk Edge Function
 *
 * Calculates injury risk score and recommendations based on user workout, HRV, and sleep data.
 *
 * @param {Request} req - HTTP request
 * @returns {Response} JSON response
 *
 * Environment variables required:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

interface RiskFactors {
  acuteChronicRatio: number
  hrvTrend: number
  sleepDebt: number
}

function calculateRiskScore(factors: RiskFactors): { score: number; level: 'low' | 'moderate' | 'high'; recommendations: string[] } {
  let score = 0
  const recs: string[] = []

  if (factors.acuteChronicRatio > 1.5) { score += 40; recs.push('Reduce training load by 30% this week') }
  else if (factors.acuteChronicRatio > 1.3) { score += 20; recs.push('Maintain current training load') }

  if (factors.hrvTrend < -20) { score += 30; recs.push('Take 2 full rest days') }
  else if (factors.hrvTrend < -10) { score += 15; recs.push('Consider a deload day') }

  if (factors.sleepDebt > 10) { score += 20; recs.push('Prioritize 8h sleep for recovery') }
  else if (factors.sleepDebt > 5) { score += 10; recs.push('Aim for 7-8h sleep') }

  const level = score >= 50 ? 'high' : score >= 25 ? 'moderate' : 'low'
  if (recs.length === 0) recs.push('You are recovering well - maintain current routine')
  return { score: Math.min(100, score), level, recommendations: recs }
}

Deno.serve(async (req) => {
  try {
    const { userId } = await req.json()
    if (!userId) return new Response(JSON.stringify({ error: 'userId required' }), { status: 400 })

    const now = new Date()
    const d7 = new Date(now.getTime() - 7 * 86400000).toISOString()
    const d28 = new Date(now.getTime() - 28 * 86400000).toISOString()

    const { data: workouts7d } = await supabase
      .from('health_records')
      .select('value')
      .eq('user_id', userId)
      .eq('metric_type', 'activeEnergyBurned')
      .gte('recorded_at', d7)

    const { data: workouts28d } = await supabase
      .from('health_records')
      .select('value')
      .eq('user_id', userId)
      .eq('metric_type', 'activeEnergyBurned')
      .gte('recorded_at', d28)
      .lt('recorded_at', d7)

    const load7d = (workouts7d ?? []).reduce((s, r) => s + Number(r.value), 0)
    const load28dAvg = (workouts28d ?? []).reduce((s, r) => s + Number(r.value), 0) / 3

    const { data: hrvData } = await supabase
      .from('health_records')
      .select('value,recorded_at')
      .eq('user_id', userId)
      .eq('metric_type', 'heartRateVariabilitySDNN')
      .gte('recorded_at', d7)
      .order('recorded_at', { ascending: true })

    const hrvStart = Number(hrvData?.[0]?.value ?? 50)
    const hrvEnd = Number(hrvData?.[hrvData.length - 1]?.value ?? 50)
    const hrvTrend = hrvStart > 0 ? ((hrvEnd - hrvStart) / hrvStart) * 100 : 0

    const { data: sleepData } = await supabase
      .from('sleep_records')
      .select('duration_minutes')
      .eq('user_id', userId)
      .gte('date', d7.split('T')[0])

    const sleepDebt = (sleepData ?? []).reduce((s, r) => {
      const hours = Number(r.duration_minutes) / 60
      return s + Math.max(0, 7 - hours)
    }, 0)

    const factors: RiskFactors = {
      acuteChronicRatio: load28dAvg > 0 ? load7d / load28dAvg : 1.0,
      hrvTrend,
      sleepDebt
    }

    const result = calculateRiskScore(factors)

    return new Response(JSON.stringify({ ...result, factors, userId }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
