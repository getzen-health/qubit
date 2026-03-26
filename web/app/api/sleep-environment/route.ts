import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'
import { calculateSleepEnvironmentScore, type SleepEnvironmentLog } from '@/lib/sleep-environment'

export async function GET(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: logs, error } = await supabase
    .from('sleep_environment_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const scoredLogs = (logs ?? []).map((log: SleepEnvironmentLog) => ({
    ...log,
    score: calculateSleepEnvironmentScore(log),
  }))

  // 7-day score trend (ascending for chart)
  const trend = scoredLogs
    .slice(0, 7)
    .reverse()
    .map(l => ({ date: l.date, score: l.score.total, grade: l.score.grade }))

  // Sleep onset correlation: group by score bucket
  const onsetCorrelation = scoredLogs
    .filter((l): l is typeof l & { sleep_onset_min: number } => l.sleep_onset_min != null)
    .map(l => ({ score: l.score.total, onset: l.sleep_onset_min, date: l.date }))

  // Quality correlation
  const qualityCorrelation = scoredLogs
    .filter(l => l.perceived_sleep_quality != null)
    .map(l => ({ score: l.score.total, quality: l.perceived_sleep_quality, date: l.date }))

  // Average sleep onset by score tier
  const avgOnsetByTier = computeAvgOnsetByTier(onsetCorrelation)

  return NextResponse.json({
    logs: scoredLogs,
    trend,
    onsetCorrelation,
    qualityCorrelation,
    avgOnsetByTier,
  })
}

export async function POST(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body: Partial<SleepEnvironmentLog>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const { id: _id, user_id: _uid, created_at: _ca, ...fields } = body

  const { data, error } = await supabase
    .from('sleep_environment_logs')
    .upsert({ ...fields, user_id: user.id }, { onConflict: 'user_id,date' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const score = calculateSleepEnvironmentScore(data as SleepEnvironmentLog)
  return NextResponse.json({ log: data, score })
}

function computeAvgOnsetByTier(
  data: { score: number; onset: number }[]
): { tier: string; avgOnset: number; count: number }[] {
  const tiers: Record<string, { sum: number; count: number }> = {
    'Optimal (85+)': { sum: 0, count: 0 },
    'Good (65-84)': { sum: 0, count: 0 },
    'Fair (45-64)': { sum: 0, count: 0 },
    'Poor (<45)': { sum: 0, count: 0 },
  }
  for (const { score, onset } of data) {
    const tier =
      score >= 85 ? 'Optimal (85+)'
      : score >= 65 ? 'Good (65-84)'
      : score >= 45 ? 'Fair (45-64)'
      : 'Poor (<45)'
    tiers[tier].sum += onset
    tiers[tier].count++
  }
  return Object.entries(tiers)
    .filter(([, v]) => v.count > 0)
    .map(([tier, v]) => ({ tier, avgOnset: Math.round(v.sum / v.count), count: v.count }))
}
