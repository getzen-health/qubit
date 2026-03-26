import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'
import { analyzeHydration, type HydrationLog } from '@/lib/hydration-science'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: logs, error } = await supabase
    .from('hydration_v2_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Today's log and analysis
  const today = new Date().toISOString().slice(0, 10)
  const todayLog = (logs ?? []).find((l: HydrationLog) => l.date === today)
  const todayAnalysis = todayLog ? analyzeHydration(todayLog as HydrationLog) : null

  // 7-day trend (last 7 days)
  const trend = (logs ?? []).slice(0, 7).map((l: HydrationLog) => ({
    date: l.date,
    water_ml: l.water_ml,
    urine_color: l.urine_color,
    ...analyzeHydration(l as HydrationLog),
  }))

  // Average urine color
  const avgUrineColor = logs && logs.length > 0
    ? (logs as HydrationLog[]).reduce((s, l) => s + l.urine_color, 0) / logs.length
    : null

  return NextResponse.json({
    logs: logs ?? [],
    todayLog,
    todayAnalysis,
    trend,
    avgUrineColor,
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const rl = await checkRateLimit(user.id, 'healthData')
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const body = await req.json()

  const payload: HydrationLog = {
    water_ml:                 body.water_ml                 ?? 0,
    beverages:                body.beverages                ?? [],
    urine_color:              Math.min(8, Math.max(1, body.urine_color ?? 1)),
    urine_frequency:          body.urine_frequency          ?? 0,
    pre_exercise_weight_kg:   body.pre_exercise_weight_kg   ?? null,
    post_exercise_weight_kg:  body.post_exercise_weight_kg  ?? null,
    exercise_fluid_ml:        body.exercise_fluid_ml        ?? null,
    exercise_duration_min:    body.exercise_duration_min    ?? null,
    sodium_mg:                body.sodium_mg                ?? 0,
    potassium_mg:             body.potassium_mg             ?? 0,
    magnesium_mg:             body.magnesium_mg             ?? 0,
    electrolyte_drink:        body.electrolyte_drink        ?? false,
    exercise_minutes:         body.exercise_minutes         ?? 0,
    exercise_intensity:       body.exercise_intensity       ?? 'none',
    ambient_temp_f:           body.ambient_temp_f           ?? 72,
    altitude_ft:              body.altitude_ft              ?? 0,
    is_pregnant:              body.is_pregnant              ?? false,
    is_breastfeeding:         body.is_breastfeeding         ?? false,
    weight_kg:                body.weight_kg                ?? null,
    caffeine_drinks:          body.caffeine_drinks          ?? 0,
    date:                     body.date                     ?? new Date().toISOString().slice(0, 10),
    user_id:                  user.id,
  }

  const analysis = analyzeHydration(payload)

  const { data, error } = await supabase
    .from('hydration_v2_logs')
    .upsert({ ...payload, beverages: JSON.stringify(payload.beverages) }, { onConflict: 'user_id,date' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ log: data, analysis })
}
