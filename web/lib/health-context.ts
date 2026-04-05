/**
 * Health Context Compiler
 * Aggregates all available user health data into a structured context
 * for injection into Claude's system prompt.
 */

export interface HealthContext {
  // Last 7-day averages
  avg_steps?: number
  avg_sleep_hours?: number
  avg_sleep_quality?: number
  avg_hrv?: number
  avg_resting_hr?: number
  avg_water_ml?: number
  avg_mood?: number
  avg_stress?: number
  // Latest values
  latest_weight?: number
  latest_bmi?: number
  biological_age?: number
  chronological_age?: number
  recovery_score?: number
  // Active features
  active_goals?: { title: string; progress: number; streak: number }[]
  current_supplements?: string[]
  active_medications?: string[]
  current_fasting_protocol?: string
  chronotype?: string
  // Recent assessments
  fms_score?: number
  fms_risk?: string
  last_mental_health_screen?: { phq9: number; gad7: number }
  sleep_apnea_risk?: string
  // Food scanning
  avg_zen_score?: number
  top_scanned_categories?: string[]
  // Lab results (if any)
  notable_labs?: { name: string; value: number; status: string }[]
}

function numAvg(values: (number | null | undefined)[]): number | undefined {
  const valid = values.filter((v): v is number => v != null && !isNaN(Number(v))).map(Number)
  if (valid.length === 0) return undefined
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

function round1(n: number | undefined): number | undefined {
  return n !== undefined ? Math.round(n * 10) / 10 : undefined
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function compileHealthContext(userId: string, supabase: any): Promise<HealthContext> {
  const since7d = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const since7dDate = new Date(Date.now() - 7 * 86_400_000).toISOString().split('T')[0]
  const ctx: HealthContext = {}

  const [
    { data: summaries },
    { data: checkins },
    { data: waterEntries },
    { data: supplements },
    { data: medications },
    { data: chronotype },
    { data: goals },
    { data: longevity },
    { data: mhScreenings },
    { data: sleepApnea },
    { data: productScans },
    { data: labs },
    { data: fastingLog },
  ] = await Promise.all([
    supabase
      .from('daily_summaries')
      .select('steps, sleep_duration_minutes, sleep_quality_score, resting_heart_rate, avg_hrv, weight_kg, recovery_score, date')
      .eq('user_id', userId)
      .gte('date', since7dDate)
      .order('date', { ascending: false })
      .limit(7),
    supabase
      .from('daily_checkins')
      .select('mood, stress, date')
      .eq('user_id', userId)
      .gte('date', since7dDate)
      .order('date', { ascending: false })
      .limit(7),
    supabase
      .from('water_entries')
      .select('amount_ml')
      .eq('user_id', userId)
      .gte('logged_at', since7d),
    supabase
      .from('user_supplements')
      .select('supplement_name, dosage')
      .eq('user_id', userId)
      .eq('active', true)
      .limit(10),
    supabase
      .from('user_medications')
      .select('medication_name')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(10),
    supabase
      .from('chronotype_assessments')
      .select('chronotype')
      .eq('user_id', userId)
      .order('assessed_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('health_goals')
      .select('title, progress_pct, streak_current')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(5),
    supabase
      .from('longevity_assessments')
      .select('fitness_age')
      .eq('user_id', userId)
      .order('assessed_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('mental_health_screenings')
      .select('screener_type, total_score')
      .eq('user_id', userId)
      .order('screened_at', { ascending: false })
      .limit(4),
    supabase
      .from('sleep_apnea_screens')
      .select('stopbang_risk')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('product_scans')
      .select('health_score')
      .eq('user_id', userId)
      .gte('scanned_at', since7d)
      .not('health_score', 'is', null),
    supabase
      .from('lab_results')
      .select('biomarker_key, value, unit')
      .eq('user_id', userId)
      .order('lab_date', { ascending: false })
      .limit(8),
    supabase
      .from('fasting_logs')
      .select('protocol_id')
      .eq('user_id', userId)
      .is('end_time', null)
      .limit(1)
      .single(),
  ])

  // 7-day averages from daily_summaries
  if (summaries && summaries.length > 0) {
    const stepsAvg = numAvg(summaries.map((s: { steps: number }) => s.steps))
    if (stepsAvg !== undefined) ctx.avg_steps = Math.round(stepsAvg)

    const sleepAvg = numAvg(summaries.map((s: { sleep_duration_minutes: number | null }) =>
      s.sleep_duration_minutes ? s.sleep_duration_minutes / 60 : null))
    ctx.avg_sleep_hours = round1(sleepAvg)

    const qualityAvg = numAvg(summaries.map((s: { sleep_quality_score: number | null }) => s.sleep_quality_score))
    ctx.avg_sleep_quality = round1(qualityAvg)

    const hrvAvg = numAvg(summaries.map((s: { avg_hrv: number | null }) => s.avg_hrv))
    ctx.avg_hrv = round1(hrvAvg)

    const hrAvg = numAvg(summaries.map((s: { resting_heart_rate: number | null }) => s.resting_heart_rate))
    if (hrAvg !== undefined) ctx.avg_resting_hr = Math.round(hrAvg)

    const latest = summaries[0]
    if (latest.weight_kg) ctx.latest_weight = latest.weight_kg
    if (latest.recovery_score) ctx.recovery_score = latest.recovery_score
  }

  // Mood & stress from daily check-ins
  if (checkins && checkins.length > 0) {
    ctx.avg_mood = round1(numAvg(checkins.map((c: { mood: number | null }) => c.mood)))
    ctx.avg_stress = round1(numAvg(checkins.map((c: { stress: number | null }) => c.stress)))
  }

  // Water intake (daily average over 7 days)
  if (waterEntries && waterEntries.length > 0) {
    const totalMl = waterEntries.reduce((sum: number, w: { amount_ml: number }) => sum + (w.amount_ml ?? 0), 0)
    ctx.avg_water_ml = Math.round(totalMl / 7)
  }

  if (supplements && supplements.length > 0) {
    ctx.current_supplements = supplements.map((s: { supplement_name: string; dosage: string }) =>
      s.dosage ? `${s.supplement_name} ${s.dosage}` : s.supplement_name)
  }

  if (medications && medications.length > 0) {
    ctx.active_medications = medications.map((m: { medication_name: string }) => m.medication_name)
  }

  if (chronotype?.chronotype) ctx.chronotype = chronotype.chronotype

  if (goals && goals.length > 0) {
    ctx.active_goals = goals.map((g: { title: string; progress_pct: number | null; streak_current: number | null }) => ({
      title: g.title,
      progress: Math.round(g.progress_pct ?? 0),
      streak: g.streak_current ?? 0,
    }))
  }

  if (longevity?.fitness_age) ctx.biological_age = longevity.fitness_age

  if (mhScreenings && mhScreenings.length > 0) {
    const phq9 = mhScreenings.find((s: { screener_type: string }) => s.screener_type === 'phq9')
    const gad7 = mhScreenings.find((s: { screener_type: string }) => s.screener_type === 'gad7')
    if (phq9 || gad7) {
      ctx.last_mental_health_screen = {
        phq9: phq9?.total_score ?? 0,
        gad7: gad7?.total_score ?? 0,
      }
    }
  }

  if (sleepApnea?.stopbang_risk) ctx.sleep_apnea_risk = sleepApnea.stopbang_risk

  if (productScans && productScans.length > 0) {
    const scores = productScans.map((p: { health_score: number | null }) => p.health_score).filter((s: number | null): s is number => s != null)
    if (scores.length > 0) {
      ctx.avg_zen_score = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
    }
  }

  if (labs && labs.length > 0) {
    ctx.notable_labs = labs.slice(0, 5).map((l: { biomarker_key: string; value: number }) => ({
      name: l.biomarker_key,
      value: l.value,
      status: 'recorded',
    }))
  }

  if (fastingLog?.protocol_id) ctx.current_fasting_protocol = fastingLog.protocol_id

  return ctx
}

const CHRONOTYPE_LABELS: Record<string, string> = {
  lion: 'Lion (early riser, peak 8am–12pm)',
  bear: 'Bear (peak performance 10am–2pm)',
  wolf: 'Wolf (night owl, peak 5pm–9pm)',
  dolphin: 'Dolphin (light sleeper, variable peak)',
}

export function formatContextForClaude(ctx: HealthContext): string {
  const hasData = Object.values(ctx).some(v => v !== undefined && v !== null)
  if (!hasData) {
    return 'No health data available yet. The user has not synced any health data.'
  }

  const lines: string[] = ['## User Health Profile (Last 7 Days)']

  if (ctx.avg_steps !== undefined) {
    lines.push(`- Average steps: ${ctx.avg_steps.toLocaleString()}/day`)
  }
  if (ctx.avg_sleep_hours !== undefined) {
    const quality = ctx.avg_sleep_quality !== undefined ? `, quality ${ctx.avg_sleep_quality}/10` : ''
    lines.push(`- Sleep: ${ctx.avg_sleep_hours}h avg${quality}`)
  }
  if (ctx.avg_hrv !== undefined) {
    lines.push(`- HRV: ${ctx.avg_hrv}ms (7-day avg)`)
  }
  if (ctx.avg_resting_hr !== undefined) {
    lines.push(`- Resting HR: ${ctx.avg_resting_hr}bpm (7-day avg)`)
  }
  if (ctx.recovery_score !== undefined) {
    const label = ctx.recovery_score >= 80 ? 'Excellent' : ctx.recovery_score >= 60 ? 'Good' : ctx.recovery_score >= 40 ? 'Fair' : 'Low'
    lines.push(`- Recovery score: ${ctx.recovery_score}/100 (${label})`)
  }
  if (ctx.avg_water_ml !== undefined) {
    lines.push(`- Water intake: ${(ctx.avg_water_ml / 1000).toFixed(1)}L/day avg`)
  }
  if (ctx.avg_mood !== undefined || ctx.avg_stress !== undefined) {
    const parts: string[] = []
    if (ctx.avg_mood !== undefined) parts.push(`Mood: ${ctx.avg_mood}/5`)
    if (ctx.avg_stress !== undefined) parts.push(`Stress: ${ctx.avg_stress}/5`)
    lines.push(`- Wellbeing: ${parts.join(', ')}`)
  }
  if (ctx.latest_weight !== undefined) {
    lines.push(`- Latest weight: ${ctx.latest_weight}kg`)
  }
  if (ctx.biological_age !== undefined) {
    lines.push(`- Biological/fitness age: ${ctx.biological_age}`)
  }
  if (ctx.active_goals && ctx.active_goals.length > 0) {
    const goalSummary = ctx.active_goals
      .map(g => `${g.title}: ${g.progress}%${g.streak > 0 ? ` (${g.streak}d streak)` : ''}`)
      .join('; ')
    lines.push(`- Active goals (${ctx.active_goals.length}): ${goalSummary}`)
  }
  if (ctx.current_supplements && ctx.current_supplements.length > 0) {
    lines.push(`- Supplements: ${ctx.current_supplements.join(', ')}`)
  }
  if (ctx.active_medications && ctx.active_medications.length > 0) {
    lines.push(`- Medications: ${ctx.active_medications.join(', ')}`)
  }
  if (ctx.chronotype) {
    const label = CHRONOTYPE_LABELS[ctx.chronotype.toLowerCase()] ?? ctx.chronotype
    lines.push(`- Chronotype: ${label}`)
  }
  if (ctx.current_fasting_protocol) {
    lines.push(`- Currently fasting: ${ctx.current_fasting_protocol} protocol`)
  }
  if (ctx.last_mental_health_screen) {
    const { phq9, gad7 } = ctx.last_mental_health_screen
    if (phq9 > 0 || gad7 > 0) {
      lines.push(`- Recent mental health screen: PHQ-9 score ${phq9}, GAD-7 score ${gad7}`)
    }
  }
  if (ctx.sleep_apnea_risk && ctx.sleep_apnea_risk.toLowerCase() !== 'low') {
    lines.push(`- Sleep apnea risk: ${ctx.sleep_apnea_risk}`)
  }
  if (ctx.avg_zen_score !== undefined) {
    lines.push(`- Food quality (ZenScore): avg ${ctx.avg_zen_score}/100 this week`)
  }
  if (ctx.notable_labs && ctx.notable_labs.length > 0) {
    const labSummary = ctx.notable_labs.map(l => `${l.name}: ${l.value}`).join(', ')
    lines.push(`- Recent labs: ${labSummary}`)
  }

  return lines.join('\n')
}
