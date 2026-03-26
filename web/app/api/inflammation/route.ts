import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'
import { calcInflammationScore } from '@/lib/inflammation'
import type { InflammationLog } from '@/lib/inflammation'

export async function GET(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: logs, error } = await supabase
    .from('inflammation_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const today = new Date().toISOString().slice(0, 10)
  const todayLog = logs?.find((l) => l.date === today) ?? null
  const currentScore = todayLog ? calcInflammationScore(todayLog as InflammationLog) : null

  const trend = (logs ?? []).slice(0, 30).map((l) => {
    const s = calcInflammationScore(l as InflammationLog)
    return {
      date: l.date,
      crp_proxy: s.crp_proxy,
      diet_score: s.anti_inflammatory_diet_score,
      omega_ratio: s.omega_ratio,
      dii_category: s.dii_category,
    }
  })

  return NextResponse.json({ logs: logs ?? [], currentScore, trend, todayLog })
}

export async function POST(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json()
  const today = new Date().toISOString().slice(0, 10)

  const payload = {
    user_id: user.id,
    date: today,
    omega3_servings: Number(body.omega3_servings ?? 0),
    vegetables_servings: Number(body.vegetables_servings ?? 0),
    berries_servings: Number(body.berries_servings ?? 0),
    turmeric_used: Boolean(body.turmeric_used),
    ginger_used: Boolean(body.ginger_used),
    green_tea_cups: Number(body.green_tea_cups ?? 0),
    fiber_g: Number(body.fiber_g ?? 0),
    sugar_drinks: Number(body.sugar_drinks ?? 0),
    processed_meat: Number(body.processed_meat ?? 0),
    trans_fat_items: Number(body.trans_fat_items ?? 0),
    cooking_oil_servings: Number(body.cooking_oil_servings ?? 0),
    processed_snacks: Number(body.processed_snacks ?? 0),
    grain_fed_meat: Number(body.grain_fed_meat ?? 0),
    fatty_fish_servings: Number(body.fatty_fish_servings ?? 0),
    omega3_supplement: Boolean(body.omega3_supplement),
    flax_chia_servings: Number(body.flax_chia_servings ?? 0),
    walnuts_servings: Number(body.walnuts_servings ?? 0),
    sleep_hours: Number(body.sleep_hours ?? 7),
    stress_level: Math.max(1, Math.min(10, Number(body.stress_level ?? 5))),
    exercise_minutes_week: Number(body.exercise_minutes_week ?? 0),
    waist_cm: body.waist_cm ? Number(body.waist_cm) : null,
    biological_sex: body.biological_sex ?? null,
    smoking_status: body.smoking_status ?? 'never',
    notes: body.notes ?? null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('inflammation_logs')
    .upsert(payload, { onConflict: 'user_id,date' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const score = calcInflammationScore(data as InflammationLog)
  return NextResponse.json({ log: data, score })
}
