export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'premenstrual'

export interface PhaseInfo {
  name: string
  emoji: string
  color: string
  dayRange: string
  energyLevel: 'low' | 'rising' | 'peak' | 'high' | 'declining'
  workout: string
  nutrition: string
  sleep: string
  mood: string
  tips: string[]
}

export const PHASE_INFO: Record<CyclePhase, PhaseInfo> = {
  menstrual: {
    name: 'Menstrual Phase',
    emoji: '🌑',
    color: '#ef4444',
    dayRange: 'Days 1–5',
    energyLevel: 'low',
    workout: 'Gentle movement: walking, yoga, stretching. Respect your body\'s need for rest.',
    nutrition: 'Iron-rich foods (lentils, spinach, lean red meat). Magnesium for cramps. Avoid inflammatory foods.',
    sleep: 'Sleep need often higher. Allow extra rest. Heating pad can reduce cramps.',
    mood: 'Introspective, possibly lower energy. Good time for reflection and planning.',
    tips: [
      'Iron: 18mg/day during period to replace losses',
      'Ginger tea or NSAIDs can reduce prostaglandin-related cramps',
      'Anti-inflammatory diet: omega-3s, turmeric',
    ],
  },
  follicular: {
    name: 'Follicular Phase',
    emoji: '🌒',
    color: '#f59e0b',
    dayRange: 'Days 6–13',
    energyLevel: 'rising',
    workout: 'Best phase for new skills, strength training, HIIT. Estrogen enhances muscle repair.',
    nutrition: 'Complex carbs fuel rising energy. Phytoestrogens (flax, soy) support estrogen metabolism.',
    sleep: 'Sleep quality improves as estrogen rises. Body temperature slightly lower.',
    mood: 'Rising optimism, creativity, social energy. Great for learning new things.',
    tips: [
      'Start new workout programs in this phase',
      'Best time for cognitive-demanding work',
      'Social energy peaks — schedule important meetings',
    ],
  },
  ovulatory: {
    name: 'Ovulatory Phase',
    emoji: '🌕',
    color: '#22c55e',
    dayRange: 'Days 14–16',
    energyLevel: 'peak',
    workout: 'Peak performance phase. High-intensity, PR attempts, competitions. Testosterone + estrogen both high.',
    nutrition: 'Antioxidant-rich foods (berries, leafy greens) to support egg health. Light, easily digestible meals.',
    sleep: 'May experience slightly lighter sleep around ovulation due to LH surge.',
    mood: 'Confidence, assertiveness, charisma at peak. Best days for presentations, social events.',
    tips: [
      'Schedule your hardest workouts and biggest challenges now',
      'LH surge: basal body temp rises slightly',
      'Cervical mucus becomes egg-white consistency — fertility window',
    ],
  },
  luteal: {
    name: 'Luteal Phase',
    emoji: '🌖',
    color: '#8b5cf6',
    dayRange: 'Days 17–23',
    energyLevel: 'high',
    workout: 'Shift to moderate steady-state cardio, pilates, swimming. Body temp ~0.3°C higher affects endurance.',
    nutrition: 'Increase complex carbs (progesterone raises metabolism ~150 cal/day). Calcium + Vitamin B6 for PMS.',
    sleep: 'Higher progesterone can cause vivid dreams. Sleep onset may be harder. Magnesium at bedtime helps.',
    mood: 'Detail-oriented, analytical. May be more inward. Progesterone has calming effect.',
    tips: [
      'Caloric needs ~150-300 kcal/day higher — honor this',
      'Magnesium glycinate 300mg before bed',
      'Reduce caffeine and alcohol — both worsen PMS symptoms',
    ],
  },
  premenstrual: {
    name: 'Premenstrual Phase',
    emoji: '🌘',
    color: '#f97316',
    dayRange: 'Days 24–28',
    energyLevel: 'declining',
    workout: 'Lower intensity. Yoga, walking, gentle strength. Listen to your body — forced training backfires.',
    nutrition: 'Reduce salt (bloating), increase B6 (mood), serotonin-boosting carbs. Avoid sugar spikes.',
    sleep: 'Sleep disruption common (lower progesterone, temperature changes). Strict sleep schedule helps.',
    mood: 'Serotonin declining. Emotional sensitivity higher. Set boundaries, practice self-compassion.',
    tips: [
      'Evening primrose oil may reduce breast tenderness',
      'Chasteberry (vitex) has evidence for PMS symptom reduction (Schellenberg 2001)',
      'Regular aerobic exercise reduces PMS severity significantly',
    ],
  },
}

export function estimateCurrentPhase(lastPeriodStart: Date, cycleLength = 28): CyclePhase {
  const today = new Date()
  const dayOfCycle = Math.floor((today.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24)) % cycleLength + 1

  if (dayOfCycle <= 5) return 'menstrual'
  if (dayOfCycle <= 13) return 'follicular'
  if (dayOfCycle <= 16) return 'ovulatory'
  if (dayOfCycle <= 23) return 'luteal'
  return 'premenstrual'
}

export function estimateCycleDay(lastPeriodStart: Date, cycleLength = 28): number {
  const today = new Date()
  const day = Math.floor((today.getTime() - lastPeriodStart.getTime()) / (1000 * 60 * 60 * 24)) % cycleLength + 1
  return Math.max(1, Math.min(day, cycleLength))
}

export function estimateNextPeriod(lastPeriodStart: Date, cycleLength = 28): Date {
  const next = new Date(lastPeriodStart)
  next.setDate(next.getDate() + cycleLength)
  if (next < new Date()) {
    // Advance by full cycles until future
    while (next < new Date()) next.setDate(next.getDate() + cycleLength)
  }
  return next
}

export function estimateFertileWindow(lastPeriodStart: Date, cycleLength = 28): { start: Date; end: Date } {
  const ovulation = new Date(lastPeriodStart)
  ovulation.setDate(ovulation.getDate() + cycleLength - 14)
  const start = new Date(ovulation); start.setDate(start.getDate() - 5)
  const end = new Date(ovulation); end.setDate(end.getDate() + 1)
  return { start, end }
}
