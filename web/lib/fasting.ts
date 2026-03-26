export interface FastingProtocol {
  id: string
  name: string
  description: string
  fastHours: number
  eatHours: number
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  benefits: string[]
  research: string
}

export const FASTING_PROTOCOLS: FastingProtocol[] = [
  {
    id: '12:12',
    name: '12:12',
    description: 'Gentle daily fasting',
    fastHours: 12,
    eatHours: 12,
    difficulty: 'Beginner',
    benefits: ['Metabolic rest', 'Improved digestion', 'Circadian alignment', 'Stable blood sugar'],
    research: 'Longo & Panda (Cell Metabolism, 2016) — aligned with circadian biology',
  },
  {
    id: '16:8',
    name: '16:8 (Leangains)',
    description: '16h fast, 8h eating window',
    fastHours: 16,
    eatHours: 8,
    difficulty: 'Intermediate',
    benefits: ['Fat loss', 'Autophagy initiation', 'Insulin sensitivity', 'Muscle preservation'],
    research: 'Moro et al. (J Transl Med, 2016) — body composition improvements in resistance-trained males',
  },
  {
    id: '18:6',
    name: '18:6',
    description: '18h fast, 6h eating window',
    fastHours: 18,
    eatHours: 6,
    difficulty: 'Intermediate',
    benefits: ['Enhanced autophagy', 'Peak fat oxidation', 'Ketone production', 'Reduced inflammation'],
    research: 'Anton et al. (Obesity, 2018) — alternate day fasting and fat burning optimization',
  },
  {
    id: '20:4',
    name: '20:4 (Warrior)',
    description: '20h fast, 4h eating window',
    fastHours: 20,
    eatHours: 4,
    difficulty: 'Advanced',
    benefits: ['Deep ketosis', 'Maximum autophagy', 'GH spike', 'Mental clarity', 'Reduced inflammation'],
    research: 'Ori Hofmekler — Warrior Diet; supported by Mattson et al. (NEJM, 2019)',
  },
  {
    id: 'OMAD',
    name: 'OMAD',
    description: 'One meal a day (23h fast)',
    fastHours: 23,
    eatHours: 1,
    difficulty: 'Advanced',
    benefits: ['Extended autophagy', 'Metabolic flexibility', 'Simplified eating', 'Insulin reset'],
    research: 'Mattson et al. (NEJM, 2019) — extended fasting health and aging benefits',
  },
  {
    id: '5:2',
    name: '5:2 (Mosley)',
    description: '5 normal days, 2 days restricted',
    fastHours: 36,
    eatHours: 12,
    difficulty: 'Intermediate',
    benefits: ['Cellular renewal', 'Immune reset', 'Metabolic reset', 'Flexibility on normal days'],
    research: 'Mosley & Spencer — The Fast Diet; Mattson et al. (NEJM, 2019)',
  },
  {
    id: '36h',
    name: '36-Hour Fast',
    description: 'Extended fast for deep cellular renewal',
    fastHours: 36,
    eatHours: 12,
    difficulty: 'Advanced',
    benefits: ['Immune stem cell regeneration', '5× GH surge', 'Deep autophagy', 'Full glycogen reset'],
    research: 'Cheng et al. (Cell Stem Cell, 2014) — prolonged fasting reduces PKA and triggers immune regeneration',
  },
]

export interface FastingMilestone {
  hours: number
  title: string
  description: string
  icon: string
  category: 'metabolic' | 'cellular' | 'hormonal' | 'neurological'
}

export const FASTING_MILESTONES: FastingMilestone[] = [
  {
    hours: 0,
    title: 'Fast Begins',
    description: 'Your fasting journey starts. Last meal digesting.',
    icon: '🚀',
    category: 'metabolic',
  },
  {
    hours: 4,
    title: 'Insulin Drops',
    description: 'Postprandial insulin returns to baseline. Fat storage halts.',
    icon: '📉',
    category: 'metabolic',
  },
  {
    hours: 8,
    title: 'Glycogen Depleting',
    description: 'Liver glycogen ~75% depleted. Body shifts toward fat oxidation.',
    icon: '🔋',
    category: 'metabolic',
  },
  {
    hours: 12,
    title: 'Metabolic Switch',
    description: 'Ketogenesis begins. Beta-hydroxybutyrate (BHB) starts rising.',
    icon: '🔥',
    category: 'metabolic',
  },
  {
    hours: 16,
    title: 'Autophagy Peaks',
    description: 'Cellular cleanup accelerates. Damaged proteins and organelles recycled.',
    icon: '♻️',
    category: 'cellular',
  },
  {
    hours: 18,
    title: 'Fat Burning Optimized',
    description: 'Peak lipolysis. Ketones reach therapeutic range 0.5–3 mM.',
    icon: '⚡',
    category: 'metabolic',
  },
  {
    hours: 24,
    title: 'Deep Ketosis',
    description: 'Full metabolic switch complete. Brain running efficiently on ketones.',
    icon: '💫',
    category: 'metabolic',
  },
  {
    hours: 36,
    title: 'Growth Hormone Surge',
    description: '5× GH increase documented. Muscle preservation and repair enhanced.',
    icon: '💪',
    category: 'hormonal',
  },
  {
    hours: 48,
    title: 'Immune Reset Begins',
    description: 'Stem cell regeneration signals activated. Old immune cells cleared.',
    icon: '🛡️',
    category: 'cellular',
  },
  {
    hours: 72,
    title: 'Deep Autophagy',
    description: 'Maximum cellular renewal. Full immune system regeneration underway.',
    icon: '🌟',
    category: 'cellular',
  },
]

export interface ActiveFast {
  startTime: Date
  protocol: FastingProtocol
  elapsedHours: number
  percentComplete: number
  nextMilestone: FastingMilestone | null
  achievedMilestones: FastingMilestone[]
  currentPhase: string
  currentBenefits: string[]
  estimatedEndTime: Date
}

export function calculateActiveFast(startTime: Date, protocol: FastingProtocol): ActiveFast {
  const now = new Date()
  const elapsedMs = now.getTime() - startTime.getTime()
  const elapsedHours = Math.max(0, elapsedMs / (1000 * 60 * 60))
  const percentComplete = Math.min(100, (elapsedHours / protocol.fastHours) * 100)

  // hour 0 milestone (fast begins) is always achieved, exclude it from the "achieved" list to avoid clutter
  const achievedMilestones = FASTING_MILESTONES.filter(
    (m) => m.hours > 0 && m.hours <= elapsedHours
  )
  const nextMilestone = FASTING_MILESTONES.find((m) => m.hours > elapsedHours) ?? null
  const estimatedEndTime = new Date(startTime.getTime() + protocol.fastHours * 60 * 60 * 1000)

  let currentPhase = 'Fed State'
  let currentBenefits: string[] = ['Digestion active', 'Insulin processing food', 'Energy from carbs']

  if (elapsedHours >= 72) {
    currentPhase = 'Deep Autophagy'
    currentBenefits = ['Maximum cellular renewal', 'Full immune reset underway', 'Peak ketone production']
  } else if (elapsedHours >= 48) {
    currentPhase = 'Immune Reset'
    currentBenefits = ['Stem cell regeneration active', 'Immune system renewal', 'Accelerated autophagy']
  } else if (elapsedHours >= 36) {
    currentPhase = 'GH Surge'
    currentBenefits = ['Growth hormone elevated 5×', 'Muscle preservation active', 'Deep ketosis maintained']
  } else if (elapsedHours >= 24) {
    currentPhase = 'Deep Ketosis'
    currentBenefits = ['Brain fueled by ketones', 'Fat burning maximized', 'Autophagy active']
  } else if (elapsedHours >= 18) {
    currentPhase = 'Fat Burning Optimized'
    currentBenefits = ['Peak lipolysis', 'Ketones 0.5–3 mM', 'Autophagy accelerating']
  } else if (elapsedHours >= 16) {
    currentPhase = 'Autophagy Active'
    currentBenefits = ['Cellular cleanup accelerating', 'Fat burning elevated', 'Insulin at baseline']
  } else if (elapsedHours >= 12) {
    currentPhase = 'Metabolic Switch'
    currentBenefits = ['Ketogenesis beginning', 'Glycogen nearly depleted', 'Fat as primary fuel']
  } else if (elapsedHours >= 8) {
    currentPhase = 'Glycogen Depleting'
    currentBenefits = ['Liver glycogen low', 'Transitioning to fat oxidation', 'Insulin dropping']
  } else if (elapsedHours >= 4) {
    currentPhase = 'Early Fasting'
    currentBenefits = ['Insulin normalizing', 'Digestive rest beginning', 'Metabolic transition']
  }

  return {
    startTime,
    protocol,
    elapsedHours,
    percentComplete,
    nextMilestone,
    achievedMilestones,
    currentPhase,
    currentBenefits,
    estimatedEndTime,
  }
}

/** Format fractional hours as "16h 30m" or "45m" */
export function formatDuration(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.floor((hours - h) * 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/** Format elapsed hours as "16h 30m 22s" live timer string */
export function formatLiveTimer(hours: number): string {
  const totalSeconds = Math.floor(hours * 3600)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`
  return `${m}m ${s.toString().padStart(2, '0')}s`
}

/** Category color mapping for milestone badges */
export const MILESTONE_CATEGORY_COLOR: Record<FastingMilestone['category'], string> = {
  metabolic: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  cellular: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  hormonal: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  neurological: 'text-green-400 bg-green-400/10 border-green-400/20',
}
