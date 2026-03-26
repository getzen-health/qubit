import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIdentifier } from '@/lib/security'
import {
  MICRONUTRIENT_DB,
  analyzeGaps,
  getWeeklyScore,
  type NutrientLog,
} from '@/lib/micronutrients'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0]

  // Fetch user profile for age/sex
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('age, sex')
    .eq('user_id', user.id)
    .single()

  const age = profile?.age ?? 30
  const rawSex = profile?.sex ?? 'male'
  const sex: 'male' | 'female' = rawSex === 'female' ? 'female' : 'male'

  // Fetch today's logs
  const { data: todayData, error: todayErr } = await supabase
    .from('micronutrient_logs')
    .select('logged_at, nutrient_id, amount, source')
    .eq('user_id', user.id)
    .eq('logged_at', date)

  if (todayErr) return NextResponse.json({ error: todayErr.message }, { status: 500 })

  // Fetch last 7 days for trends
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const weekStart = sevenDaysAgo.toISOString().split('T')[0]

  const { data: weekData, error: weekErr } = await supabase
    .from('micronutrient_logs')
    .select('logged_at, nutrient_id, amount, source')
    .eq('user_id', user.id)
    .gte('logged_at', weekStart)
    .lte('logged_at', date)

  if (weekErr) return NextResponse.json({ error: weekErr.message }, { status: 500 })

  const toLog = (row: { logged_at: string; nutrient_id: string; amount: number; source: string }): NutrientLog => ({
    date: row.logged_at,
    nutrient_id: row.nutrient_id,
    amount: Number(row.amount),
    source: row.source as NutrientLog['source'],
  })

  const todayLogs: NutrientLog[] = (todayData ?? []).map(toLog)
  const weekLogs: NutrientLog[] = (weekData ?? []).map(toLog)

  const gapAnalysis = analyzeGaps(todayLogs, age, sex, date)

  // Build 7-day score trend
  const trendDates: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    trendDates.push(d.toISOString().split('T')[0])
  }

  const weeklyTrend = trendDates.map((d) => {
    const dayAnalysis = analyzeGaps(weekLogs, age, sex, d)
    return { date: d, score: getWeeklyScore(dayAnalysis) }
  })

  // Serialize gap analysis (strip full nutrient object to keep response lean)
  const gaps = gapAnalysis.map((g) => ({
    nutrient_id: g.nutrient.id,
    name: g.nutrient.name,
    unit: g.nutrient.unit,
    category: g.nutrient.category,
    logged_amount: g.logged_amount,
    rda: g.rda,
    ul: g.nutrient.ul,
    percentage: Math.round(g.percentage * 10) / 10,
    status: g.status,
    gap_amount: Math.round(g.gap_amount * 100) / 100,
    top_food_suggestions: g.top_food_suggestions,
    functions: g.nutrient.functions,
    deficiencySymptoms: g.nutrient.deficiencySymptoms,
    topFoods: g.nutrient.topFoods,
    interactions: g.nutrient.interactions,
  }))

  return NextResponse.json({
    date,
    age,
    sex,
    todayScore: getWeeklyScore(gapAnalysis),
    gaps,
    weeklyTrend,
    totalNutrients: MICRONUTRIENT_DB.length,
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const identifier = getClientIdentifier(request)
  const { allowed, remaining } = await checkRateLimit(`${user.id}:${identifier}`, 'healthData')
  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, {
      status: 429,
      headers: { 'X-RateLimit-Remaining': '0' },
    })
  }

  const body = await request.json()
  const { nutrient_id, amount, source, food_name, notes, logged_at } = body

  if (!nutrient_id || typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json({ error: 'nutrient_id and a positive amount are required' }, { status: 400 })
  }

  const nutrientExists = MICRONUTRIENT_DB.some((n) => n.id === nutrient_id)
  if (!nutrientExists) {
    return NextResponse.json({ error: `Unknown nutrient_id: ${nutrient_id}` }, { status: 400 })
  }

  const validSources = ['manual', 'food', 'supplement', 'food_scan']
  const resolvedSource = validSources.includes(source) ? source : 'manual'

  const { data, error } = await supabase
    .from('micronutrient_logs')
    .insert({
      user_id: user.id,
      nutrient_id,
      amount,
      source: resolvedSource,
      food_name: food_name ?? null,
      notes: notes ?? null,
      logged_at: logged_at ?? new Date().toISOString().split('T')[0],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data }, {
    headers: { 'X-RateLimit-Remaining': remaining.toString() },
  })
}
