import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'
import { calculateFinancialWellness, pearsonCorrelation } from '@/lib/financial-wellness'
import type { FinancialWellnessLog } from '@/lib/financial-wellness'

// GET /api/financial — last 30 logs + composite score + health correlations
export async function GET(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const since30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

  const [{ data: logs, error: logsError }, { data: summaries }] = await Promise.all([
    supabase
      .from('financial_wellness_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', since30)
      .order('date', { ascending: false })
      .limit(30),
    supabase
      .from('daily_summaries')
      .select('date, avg_mood, sleep_quality, avg_stress')
      .eq('user_id', user.id)
      .gte('date', since30)
      .order('date', { ascending: false })
      .limit(30),
  ])

  if (logsError) return NextResponse.json({ error: logsError.message }, { status: 500 })

  const typedLogs = (logs ?? []) as FinancialWellnessLog[]

  // Latest score
  const latestScore = typedLogs.length > 0 ? calculateFinancialWellness(typedLogs[0]) : null

  // 30-day trend: [{date, total, cfpbScore, financial_stress}]
  const trend = [...typedLogs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((l) => {
      const s = calculateFinancialWellness(l)
      return {
        date: l.date,
        total: s.total,
        cfpbScore: s.cfpbScore,
        financial_stress: l.financial_stress,
        positive_money_thoughts: l.positive_money_thoughts,
      }
    })

  // Worry topic frequency over last 30 days
  const worryFreq: Record<string, number> = {}
  for (const log of typedLogs) {
    for (const topic of log.financial_worry_topics ?? []) {
      worryFreq[topic] = (worryFreq[topic] ?? 0) + 1
    }
  }

  // Correlate financial wellness score with health metrics
  const correlations = computeCorrelations(typedLogs, summaries ?? [])

  return NextResponse.json({ logs: typedLogs, latestScore, trend, worryFreq, correlations })
}

// POST /api/financial — upsert one daily log
export async function POST(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    date,
    cfpb_q1, cfpb_q2, cfpb_q3, cfpb_q4, cfpb_q5,
    financial_stress,
    emergency_fund_months,
    positive_money_thoughts,
    financial_worry_topics,
    coping_techniques_used,
    notes,
  } = body

  // Validate required CFPB fields
  for (const [key, val] of Object.entries({ cfpb_q1, cfpb_q2, cfpb_q3, cfpb_q4, cfpb_q5 })) {
    if (!val || (val as number) < 1 || (val as number) > 5) {
      return NextResponse.json({ error: `${key} must be 1-5` }, { status: 400 })
    }
  }
  if (!financial_stress || financial_stress < 1 || financial_stress > 10) {
    return NextResponse.json({ error: 'financial_stress must be 1-10' }, { status: 400 })
  }
  if (!positive_money_thoughts || positive_money_thoughts < 1 || positive_money_thoughts > 10) {
    return NextResponse.json({ error: 'positive_money_thoughts must be 1-10' }, { status: 400 })
  }

  const logDate: string = date || new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('financial_wellness_logs')
    .upsert(
      {
        user_id: user.id,
        date: logDate,
        cfpb_q1: Number(cfpb_q1),
        cfpb_q2: Number(cfpb_q2),
        cfpb_q3: Number(cfpb_q3),
        cfpb_q4: Number(cfpb_q4),
        cfpb_q5: Number(cfpb_q5),
        financial_stress: Number(financial_stress),
        emergency_fund_months: Number(emergency_fund_months ?? 0),
        positive_money_thoughts: Number(positive_money_thoughts),
        financial_worry_topics: Array.isArray(financial_worry_topics) ? financial_worry_topics : [],
        coping_techniques_used: Array.isArray(coping_techniques_used) ? coping_techniques_used : [],
        notes: notes ?? null,
      },
      { onConflict: 'user_id,date', ignoreDuplicates: false }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const score = calculateFinancialWellness(data as FinancialWellnessLog)
  return NextResponse.json({ data, score }, { status: 201 })
}

type SummaryRow = { date: string; avg_mood?: number | null; sleep_quality?: number | null; avg_stress?: number | null }

function computeCorrelations(logs: FinancialWellnessLog[], summaries: SummaryRow[]) {
  if (logs.length < 5) return []

  const summaryByDate = Object.fromEntries(summaries.map((s) => [s.date, s]))

  const matchedDates = logs
    .map((l) => ({ log: l, summary: summaryByDate[l.date] }))
    .filter((p) => p.summary)

  if (matchedDates.length < 5) return []

  const wellnessScores = matchedDates.map((p) => calculateFinancialWellness(p.log).total)
  const results = []

  const metrics: { key: keyof SummaryRow; label: string; metric: string }[] = [
    { key: 'avg_mood', label: 'Mood', metric: 'mood' },
    { key: 'sleep_quality', label: 'Sleep quality', metric: 'sleep' },
    { key: 'avg_stress', label: 'Stress level', metric: 'stress' },
  ]

  for (const { key, label, metric } of metrics) {
    const healthVals = matchedDates.map((p) => (p.summary[key] as number | null) ?? null).filter((v) => v !== null) as number[]
    if (healthVals.length < 5) continue
    const fwVals = matchedDates
      .filter((p) => (p.summary[key] as number | null) !== null)
      .map((p) => calculateFinancialWellness(p.log).total)

    const r = pearsonCorrelation(fwVals, healthVals)
    if (Math.abs(r) > 0.3) {
      results.push({
        metric,
        label,
        coefficient: Math.round(r * 100) / 100,
        significant: Math.abs(r) > 0.5,
        direction: r > 0 ? 'positive' : 'negative',
      })
    }
  }

  return results
}
