export interface RecoveryInput {
  hrv_ms?: number
  resting_hr?: number
  sleep_hours?: number
  sleep_quality?: number
  soreness?: number
  mood?: number
  acute_load?: number
  chronic_load?: number
}

export interface RecoveryResult {
  score: number
  grade: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Very Poor'
  color: string
  acwr: number
  acwr_zone: 'Optimal' | 'Caution' | 'Overreach' | 'Undertraining'
  hrv_status: 'High' | 'Normal' | 'Low' | 'Unknown'
  recommendations: string[]
  components: {
    hrv_score: number
    sleep_score: number
    subjective_score: number
    load_score: number
  }
}

export function hrvStatus(hrv: number, baseline: number): RecoveryResult['hrv_status'] {
  const ratio = hrv / baseline
  if (ratio > 1.05) return 'High'
  if (ratio >= 0.95) return 'Normal'
  return 'Low'
}

export function acwrZone(acwr: number): RecoveryResult['acwr_zone'] {
  if (acwr < 0.6) return 'Undertraining'
  if (acwr < 0.8) return 'Caution'
  if (acwr <= 1.3) return 'Optimal'
  if (acwr <= 1.5) return 'Caution'
  return 'Overreach'
}

export function calculateRecovery(
  input: RecoveryInput,
  baseline?: { hrv: number; hr: number },
): RecoveryResult {
  // ── HRV component (0–25 pts) ──────────────────────────────────────────────
  let hrv_score = 12
  let hrv_status: RecoveryResult['hrv_status'] = 'Unknown'

  if (input.hrv_ms && baseline?.hrv) {
    hrv_status = hrvStatus(input.hrv_ms, baseline.hrv)
    const ratio = input.hrv_ms / baseline.hrv
    if (ratio > 1.05) hrv_score = 25
    else if (ratio >= 0.95) hrv_score = 17
    else hrv_score = 7
  } else if (input.hrv_ms) {
    hrv_score = 14
  }

  // ── Sleep component (0–30 pts) ────────────────────────────────────────────
  let sleep_score = 15
  if (input.sleep_hours !== undefined) {
    let base: number
    if (input.sleep_hours >= 8) base = 30
    else if (input.sleep_hours >= 7) base = 24
    else if (input.sleep_hours >= 6) base = 16
    else if (input.sleep_hours >= 5) base = 10
    else base = 5

    if (input.sleep_quality !== undefined) {
      base = base * (1 + (input.sleep_quality / 10) * 0.3)
    }
    sleep_score = Math.min(30, Math.round(base))
  }

  // ── Subjective component (0–25 pts) ───────────────────────────────────────
  let subjective_score = 12
  const subValues: number[] = []
  if (input.soreness !== undefined) subValues.push(10 - input.soreness)
  if (input.mood !== undefined) subValues.push(input.mood)
  if (subValues.length > 0) {
    const avg = subValues.reduce((a, b) => a + b, 0) / subValues.length
    subjective_score = Math.round((avg / 10) * 25)
  }

  // ── Load component (0–20 pts) ─────────────────────────────────────────────
  let load_score = 15
  let acwr = 0

  if (
    input.acute_load !== undefined &&
    input.chronic_load !== undefined &&
    input.chronic_load > 0
  ) {
    acwr = input.acute_load / input.chronic_load
    if (acwr >= 0.8 && acwr <= 1.3) load_score = 20
    else if (acwr > 1.3 && acwr <= 1.5) load_score = 12
    else if (acwr > 1.5) load_score = 5
    else if (acwr >= 0.6) load_score = 14
    else load_score = 8
  }

  const score = Math.min(100, hrv_score + sleep_score + subjective_score + load_score)

  let grade: RecoveryResult['grade']
  let color: string
  if (score >= 85) { grade = 'Excellent'; color = 'text-green-500' }
  else if (score >= 70) { grade = 'Good'; color = 'text-teal-500' }
  else if (score >= 50) { grade = 'Fair'; color = 'text-yellow-500' }
  else if (score >= 30) { grade = 'Poor'; color = 'text-orange-500' }
  else { grade = 'Very Poor'; color = 'text-red-500' }

  const zone = acwr > 0 ? acwrZone(acwr) : 'Optimal'

  // ── Recommendations ───────────────────────────────────────────────────────
  const recs: string[] = []

  if (hrv_status === 'Low') {
    recs.push('HRV is suppressed — reduce training intensity today and prioritize active recovery or rest (Kiviniemi et al., 2007).')
  }
  if (hrv_status === 'High' && zone === 'Optimal') {
    recs.push('HRV is elevated and load is optimal — excellent conditions for a high-intensity session or PR attempt.')
  }
  if (input.sleep_hours !== undefined && input.sleep_hours < 7) {
    recs.push('Aim for 7–9 hours of sleep; even 30 extra minutes can measurably improve athletic performance (Mah et al., 2011).')
  }
  if (acwr > 1.5) {
    recs.push('Acute:Chronic workload ratio exceeds 1.5 — reduce training volume 30–40 % to lower injury risk (Gabbett, 2016).')
  } else if (acwr > 1.3) {
    recs.push('ACWR is in the caution zone (1.3–1.5). Consider a lighter session or extra rest day today.')
  } else if (acwr > 0 && acwr < 0.6) {
    recs.push('Workload is very low (ACWR <0.6). Gradually build training volume to stimulate fitness adaptations.')
  }
  if (input.soreness !== undefined && input.soreness >= 7) {
    recs.push('High muscle soreness detected. Foam rolling, contrast therapy, or light aerobic movement can accelerate recovery.')
  }
  if (input.mood !== undefined && input.mood <= 4) {
    recs.push('Low mood or motivation can signal accumulated fatigue. A rest day or deload week is worth considering.')
  }

  if (recs.length === 0) {
    recs.push('Recovery metrics are well-balanced. Maintain your current training structure and sleep habits.')
    recs.push('Keep monitoring morning HRV trends to detect fatigue before it accumulates (Buchheit, 2014).')
    recs.push('Consistent sleep timing supports circadian rhythm and improves next-day HRV readings.')
  }

  return {
    score,
    grade,
    color,
    acwr,
    acwr_zone: zone,
    hrv_status,
    recommendations: recs.slice(0, 5),
    components: { hrv_score, sleep_score, subjective_score, load_score },
  }
}
