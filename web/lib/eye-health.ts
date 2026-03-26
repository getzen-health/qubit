// Eye Health & Digital Wellness
// Research basis:
//   AOA 2016: 20-20-20 rule reduces CVS
//   Sheedy et al. Optometry 2003: CVS affects 90% of computer users
//   Sherwin et al. Ophthalmology 2012: 2h/day outdoors reduces myopia risk 23%
//   Bhavsar et al. IOVS 2016: blink rate drops 66% during screen use
//   Holden et al. Ophthalmology 2016: 50% global myopia prevalence by 2050

export interface EyeHealthLog {
  date: string
  screen_hours: number
  outdoor_minutes: number
  breaks_taken: number
  breaks_target: number
  symptoms: string[]
  blink_reminder_used: boolean
}

export interface EyeHealthScore {
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  break_compliance: number
  outdoor_score: number
  symptom_penalty: number
  trend_7d: 'improving' | 'stable' | 'worsening'
  recommendations: string[]
}

export interface VisionExercise {
  id: string
  name: string
  duration_min: number
  instructions: string[]
  benefit: string
  frequency: string
}

export const VISION_EXERCISES: VisionExercise[] = [
  {
    id: 'palming',
    name: 'Palming',
    duration_min: 2,
    instructions: [
      'Rub your palms together briskly until warm',
      'Cup your palms gently over closed eyes — no pressure on the eyeballs',
      'Let warmth and darkness relax the eye muscles',
      'Breathe slowly and deeply for 2 minutes',
    ],
    benefit: 'Relaxes ciliary muscles, reduces eye fatigue from prolonged near work',
    frequency: '3×/day',
  },
  {
    id: 'near-far',
    name: 'Near-Far Focusing',
    duration_min: 2,
    instructions: [
      'Hold your thumb 30 cm (12 in) from your face',
      'Focus clearly on your thumb for 5 seconds',
      'Shift focus to an object at least 6 m (20 ft) away',
      'Hold for 5 seconds, then return to thumb',
      'Repeat 10 times without rushing',
    ],
    benefit: 'Exercises the ciliary muscle, prevents accommodation spasm from screen use',
    frequency: '3×/day',
  },
  {
    id: 'figure-8',
    name: 'Figure-8 Tracing',
    duration_min: 1,
    instructions: [
      'Imagine a large figure-8 lying on its side (∞) about 3 m away',
      'Slowly trace the figure-8 with your eyes — no head movement',
      'Go clockwise for 30 seconds, then counter-clockwise for 30 seconds',
      'Keep movement smooth and unhurried',
    ],
    benefit: 'Strengthens extraocular muscles and improves smooth pursuit eye movement',
    frequency: '2×/day',
  },
  {
    id: 'eye-rolling',
    name: 'Eye Rolling',
    duration_min: 1,
    instructions: [
      'Sit comfortably with your head still',
      'Slowly roll eyes clockwise — up, right, down, left — for 30 seconds',
      'Pause, blink a few times',
      'Roll counter-clockwise for 30 seconds',
    ],
    benefit: 'Lubricates eyes, stretches extraocular muscles, reduces tension',
    frequency: '2×/day',
  },
  {
    id: '20-20-20',
    name: '20-20-20 Rule',
    duration_min: 0.5,
    instructions: [
      'Every 20 minutes, stop screen work',
      'Look at something 20 feet (6 m) away',
      'Hold focus for at least 20 seconds',
      'Blink several times to re-moisten your eyes',
    ],
    benefit: 'Primary prevention of Computer Vision Syndrome (AOA 2016)',
    frequency: 'Every 20 min',
  },
  {
    id: 'pencil-pushups',
    name: 'Pencil Push-Ups',
    duration_min: 5,
    instructions: [
      'Hold a pencil at arm\'s length, tip pointing up',
      'Focus on the tip until it is sharp and single',
      'Slowly bring the pencil toward your nose, keeping focus',
      'Stop when the tip first doubles',
      'Move it back out and repeat — 10 reps',
    ],
    benefit: 'Convergence training; reduces eye strain from prolonged near work',
    frequency: 'Once/day',
  },
  {
    id: 'blinking',
    name: 'Conscious Blinking',
    duration_min: 1,
    instructions: [
      'Close eyes fully and squeeze gently for 2 seconds',
      'Open fully — this is one blink',
      'Repeat slow blinks every 4 seconds for 1 minute',
      'Notice how much clearer and more comfortable your vision feels',
    ],
    benefit: 'Restores tear film; blink rate drops 66% during screen use (Bhavsar et al. 2016)',
    frequency: '3×/day',
  },
]

export const EYE_SYMPTOMS = [
  { id: 'eye_strain', label: 'Eye Strain', penalty: 10 },
  { id: 'headache', label: 'Headache', penalty: 8 },
  { id: 'dry_eyes', label: 'Dry Eyes', penalty: 8 },
  { id: 'blurry', label: 'Blurry Vision', penalty: 12 },
  { id: 'double_vision', label: 'Double Vision', penalty: 15 },
]

export function breaksTarget(screen_hours: number): number {
  // Every 20 minutes = 3 breaks per hour
  return Math.round(screen_hours * 3)
}

export function blueLightExposure(
  screen_hours: number,
  evening_hours: number
): 'Low' | 'Moderate' | 'High' {
  // Evening hours (after 6pm) carry higher weight
  const weighted = screen_hours + evening_hours * 1.5
  if (weighted < 4) return 'Low'
  if (weighted < 8) return 'Moderate'
  return 'High'
}

export function calculateEyeScore(logs: EyeHealthLog[]): EyeHealthScore {
  if (!logs.length) {
    return {
      score: 0,
      grade: 'F',
      break_compliance: 0,
      outdoor_score: 0,
      symptom_penalty: 0,
      trend_7d: 'stable',
      recommendations: ['Start logging your screen time and breaks to get a score'],
    }
  }

  const recent = logs.slice(0, 7)
  const latest = recent[0]

  // Break compliance (0–50 pts)
  const target = latest.breaks_target || breaksTarget(latest.screen_hours || 0)
  const break_compliance =
    target > 0 ? Math.min(1, (latest.breaks_taken || 0) / target) : 1
  const breakScore = break_compliance * 50

  // Outdoor score (0–30 pts): Sherwin et al. — 2h (120 min) = full score
  const outdoor_score = Math.min(30, ((latest.outdoor_minutes || 0) / 120) * 30)

  // Symptom penalty (0–30 pts deducted)
  const symptom_penalty = (latest.symptoms || []).reduce((acc, s) => {
    const found = EYE_SYMPTOMS.find((x) => x.id === s)
    return acc + (found?.penalty ?? 5)
  }, 0)

  // Blink reminder bonus (up to 5 pts)
  const blinkBonus = latest.blink_reminder_used ? 5 : 0

  const raw = Math.max(0, breakScore + outdoor_score - symptom_penalty + blinkBonus)
  const score = Math.min(100, Math.round(raw))

  const grade =
    score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 45 ? 'D' : 'F'

  // 7-day trend
  let trend_7d: EyeHealthScore['trend_7d'] = 'stable'
  if (recent.length >= 4) {
    const half = Math.floor(recent.length / 2)
    const avg = (arr: EyeHealthLog[]) =>
      arr.reduce((s, l) => s + (l.breaks_taken / Math.max(1, l.breaks_target)), 0) / arr.length
    const newHalf = avg(recent.slice(0, half))
    const oldHalf = avg(recent.slice(half))
    const diff = newHalf - oldHalf
    if (diff > 0.1) trend_7d = 'improving'
    else if (diff < -0.1) trend_7d = 'worsening'
  }

  const recommendations: string[] = []

  if (break_compliance < 0.5) {
    recommendations.push('Take more 20-20-20 breaks — aim for one every 20 minutes')
  }
  if ((latest.outdoor_minutes || 0) < 30) {
    recommendations.push('Get outside for at least 30 minutes today to protect against myopia')
  }
  if ((latest.symptoms || []).includes('dry_eyes')) {
    recommendations.push('Blink consciously every 4 seconds; consider lubricating eye drops')
  }
  if ((latest.symptoms || []).includes('blurry')) {
    recommendations.push('Blurry vision may indicate eye strain — rest and see an optometrist if it persists')
  }
  if ((latest.screen_hours || 0) > 8) {
    recommendations.push('Screen time over 8h/day significantly increases CVS risk')
  }
  if (recommendations.length === 0) {
    recommendations.push('Great eye health habits! Keep up the 20-20-20 routine.')
  }

  return {
    score,
    grade,
    break_compliance: Math.round(break_compliance * 100),
    outdoor_score: Math.round(outdoor_score),
    symptom_penalty,
    trend_7d,
    recommendations,
  }
}
