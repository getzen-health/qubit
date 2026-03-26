export type BreakType = 'movement' | 'eye_rest' | 'hydration' | 'stretch' | 'posture_check' | 'pomodoro'

export interface BreakActivity {
  type: BreakType
  label: string
  emoji: string
  durationSec: number
  instructions: string[]
  research: string
}

export const BREAK_ACTIVITIES: BreakActivity[] = [
  {
    type: 'movement',
    label: 'Movement Break',
    emoji: '🚶',
    durationSec: 120,
    instructions: [
      'Stand up and shake out your legs',
      'Walk to get water or around the room',
      'Do 10 standing calf raises',
      'March in place for 60 seconds',
    ],
    research: 'Diaz et al. Ann Intern Med 2017 — 2 min walks every 30 min reduce sitting harm',
  },
  {
    type: 'eye_rest',
    label: '20-20-20 Eye Rest',
    emoji: '👁️',
    durationSec: 20,
    instructions: [
      'Look away from your screen',
      'Find something 20 feet (6 meters) away',
      'Focus on it for 20 seconds',
      'Blink several times to re-moisten eyes',
    ],
    research: 'American Optometric Association: reduces digital eye strain significantly',
  },
  {
    type: 'stretch',
    label: 'Desk Stretches',
    emoji: '🧘',
    durationSec: 180,
    instructions: [
      'Neck rolls: slowly roll head in each direction ×5',
      'Shoulder shrugs: up, hold 3s, release ×10',
      'Chest opener: clasp hands behind back, lift slightly',
      'Hip flexor: stand, step forward into lunge, hold 20s each side',
      'Wrist circles: 10 each direction',
    ],
    research: 'Galinsky et al. HFES 2000 — microbreaks reduce MSK symptoms 40%',
  },
  {
    type: 'posture_check',
    label: 'Posture Reset',
    emoji: '🪑',
    durationSec: 30,
    instructions: [
      'Sit back fully in your chair',
      'Feet flat on floor, knees at 90°',
      "Screen at eye level, arm's length away",
      'Shoulders relaxed, not hunched',
      'Take 3 deep breaths in this position',
    ],
    research: 'OSHA ergonomics guidelines for seated workstation',
  },
  {
    type: 'hydration',
    label: 'Hydration Check',
    emoji: '💧',
    durationSec: 60,
    instructions: [
      'Get up and walk to get water',
      'Drink at least 250ml now',
      'Check: is your urine pale yellow? ✅',
      ",Dark yellow means you're behind on fluids",
    ],
    research: 'EFSA 2023: 35ml/kg/day — most people forget to drink when sitting',
  },
]

export interface BreakInterval {
  minutes: number
  label: string
  description: string
}

export const BREAK_INTERVALS: BreakInterval[] = [
  { minutes: 20, label: 'Every 20 min', description: 'Optimal for eye health (20-20-20 rule)' },
  { minutes: 25, label: 'Pomodoro (25 min)', description: '25 min focus + 5 min break cycle' },
  { minutes: 30, label: 'Every 30 min', description: 'Recommended for cardiovascular health' },
  { minutes: 45, label: 'Every 45 min', description: 'Good balance of focus and recovery' },
  { minutes: 60, label: 'Every hour', description: 'Minimum recommended interval' },
]

export function getNextBreakActivity(lastBreakType?: BreakType): BreakActivity {
  // Rotate through types
  const rotation: BreakType[] = ['movement', 'eye_rest', 'stretch', 'posture_check', 'hydration']
  if (!lastBreakType) return BREAK_ACTIVITIES[0]
  const idx = rotation.indexOf(lastBreakType)
  return BREAK_ACTIVITIES.find(a => a.type === rotation[(idx + 1) % rotation.length]) ?? BREAK_ACTIVITIES[0]
}
