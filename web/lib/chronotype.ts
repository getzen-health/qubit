export type ChronotypeAnimal = 'lion' | 'bear' | 'wolf' | 'dolphin'

export interface ChronotypeProfile {
  animal: ChronotypeAnimal
  label: string
  emoji: string
  population: string // % of population
  optimalWake: string
  optimalSleep: string
  optimalMealWindow: string // eating window
  optimalWorkoutWindow: string
  optimalFocusWindow: string
  description: string
  strengths: string[]
  challenges: string[]
  tips: string[]
}

export const CHRONOTYPES: Record<ChronotypeAnimal, ChronotypeProfile> = {
  lion: {
    animal: 'lion',
    label: 'Lion (Early Bird)',
    emoji: '🦁',
    population: '15%',
    optimalWake: '5:30–6:00 AM',
    optimalSleep: '9:30–10:00 PM',
    optimalMealWindow: '7:00 AM – 7:00 PM',
    optimalWorkoutWindow: '5:00–7:00 AM',
    optimalFocusWindow: '8:00 AM – 12:00 PM',
    description: 'Early risers who dominate mornings. Peak energy and focus before noon. Strong willpower and discipline.',
    strengths: ['High morning productivity', 'Consistent sleep schedule', 'Better metabolic health'],
    challenges: ['Fade by evening', 'Miss social night events', 'Conflict with late-night culture'],
    tips: ['Schedule deep work before noon', 'Avoid caffeine after 2pm', 'Plan social events for early evening'],
  },
  bear: {
    animal: 'bear',
    label: 'Bear (Intermediate)',
    emoji: '🐻',
    population: '55%',
    optimalWake: '7:00–7:30 AM',
    optimalSleep: '11:00 PM',
    optimalMealWindow: '8:00 AM – 8:00 PM',
    optimalWorkoutWindow: '10:00 AM – 2:00 PM',
    optimalFocusWindow: '10:00 AM – 2:00 PM',
    description: 'The most common type. Follow the solar cycle. Peak productivity mid-morning and early afternoon.',
    strengths: ['Aligned with typical work schedules', 'Stable energy throughout day', 'Good sleep quality'],
    challenges: ['Afternoon slump 2-3pm', 'Moderate social jet lag on weekends'],
    tips: ['Use 20-min nap between 1-3pm', 'Protect morning for cognitive work', 'Consistency is key'],
  },
  wolf: {
    animal: 'wolf',
    label: 'Wolf (Night Owl)',
    emoji: '🐺',
    population: '15%',
    optimalWake: '7:30–9:00 AM',
    optimalSleep: '12:00–1:00 AM',
    optimalMealWindow: '10:00 AM – 10:00 PM',
    optimalWorkoutWindow: '5:00–7:00 PM',
    optimalFocusWindow: '5:00–9:00 PM',
    description: 'Creative night owls. Hit peak energy in the evenings. Often misunderstood by society.',
    strengths: ['Peak creativity at night', 'Strong social energy in evenings', 'Good at pattern recognition'],
    challenges: ['High social jet lag', 'Forced early wake causes chronic sleep deprivation', 'Higher metabolic risk from misalignment'],
    tips: ['Get morning light ASAP after waking', 'Avoid blue light 90 min before bed', 'If possible, shift work to later hours'],
  },
  dolphin: {
    animal: 'dolphin',
    label: 'Dolphin (Light Sleeper)',
    emoji: '🐬',
    population: '10%',
    optimalWake: '6:30–7:00 AM',
    optimalSleep: '11:30 PM',
    optimalMealWindow: '8:00 AM – 7:00 PM',
    optimalWorkoutWindow: '7:00–9:00 AM',
    optimalFocusWindow: '3:00–9:00 PM',
    description: 'Light, irregular sleepers. Often perfectionists who sleep lightly. Peak focus in mid to late afternoon.',
    strengths: ['Strong alertness in afternoon', 'Highly detail-oriented', 'Often high achievers'],
    challenges: ['Poor sleep quality', 'Irregular schedule', 'Prone to anxiety and overthinking'],
    tips: ['Strict sleep hygiene essential', 'Limit naps to 20 min before 3pm', 'Reduce evening stimulation'],
  },
}

// Simplified 6-question chronotype quiz (derived from MCTQ principles)
export interface ChronotypeQuestion {
  id: string
  question: string
  options: Array<{ label: string; value: number }> // value: 1=extreme early, 5=extreme late
}

export const CHRONOTYPE_QUIZ: ChronotypeQuestion[] = [
  {
    id: 'wake_time',
    question: 'On free days (no obligations), when do you naturally wake up?',
    options: [
      { label: 'Before 5:30 AM', value: 1 },
      { label: '5:30–6:30 AM', value: 2 },
      { label: '6:30–8:00 AM', value: 3 },
      { label: '8:00–9:30 AM', value: 4 },
      { label: 'After 9:30 AM', value: 5 },
    ],
  },
  {
    id: 'sleep_time',
    question: 'On free days, when do you naturally fall asleep?',
    options: [
      { label: 'Before 9:00 PM', value: 1 },
      { label: '9:00–10:30 PM', value: 2 },
      { label: '10:30 PM–12:00 AM', value: 3 },
      { label: '12:00–1:30 AM', value: 4 },
      { label: 'After 1:30 AM', value: 5 },
    ],
  },
  {
    id: 'peak_energy',
    question: 'When do you feel most alert and energetic?',
    options: [
      { label: 'Very early morning (5–8 AM)', value: 1 },
      { label: 'Morning (8–10 AM)', value: 2 },
      { label: 'Midday (10 AM–2 PM)', value: 3 },
      { label: 'Afternoon (2–6 PM)', value: 4 },
      { label: 'Evening/night (6 PM+)', value: 5 },
    ],
  },
  {
    id: 'morning_feel',
    question: 'If you had to wake up at 6 AM, how would you feel in the first 30 minutes?',
    options: [
      { label: 'Fully awake and sharp', value: 1 },
      { label: 'Reasonably alert', value: 2 },
      { label: 'Somewhat groggy', value: 3 },
      { label: 'Quite tired', value: 4 },
      { label: 'Very tired, barely functional', value: 5 },
    ],
  },
  {
    id: 'sleep_quality',
    question: 'How would you describe your typical sleep quality?',
    options: [
      { label: 'Very deep and solid', value: 3 }, // dolphin scores differently
      { label: 'Good, usually restful', value: 2 },
      { label: 'Average', value: 3 },
      { label: 'Light, often disturbed', value: 4 },
      { label: 'Very light, frequently wake', value: 5 },
    ],
  },
  {
    id: 'weekend_shift',
    question: 'How much later do you sleep on weekends vs workdays?',
    options: [
      { label: 'Same time or earlier', value: 1 },
      { label: '30–60 min later', value: 2 },
      { label: '1–2 hours later', value: 3 },
      { label: '2–3 hours later', value: 4 },
      { label: 'More than 3 hours later', value: 5 },
    ],
  },
]

export function calculateChronotype(answers: Record<string, number>): ChronotypeAnimal {
  const values = Object.values(answers)
  const avg = values.reduce((a, b) => a + b, 0) / values.length

  // Check for dolphin: high weekend shift + poor sleep quality
  if ((answers.weekend_shift ?? 0) >= 4 && (answers.sleep_quality ?? 0) >= 4) return 'dolphin'
  if (avg <= 1.8) return 'lion'
  if (avg <= 3.2) return 'bear'
  return 'wolf'
}

export function calculateSocialJetLag(
  workdayWake: string,  // "HH:MM"
  freedayWake: string
): number {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }
  return Math.abs(toMinutes(freedayWake) - toMinutes(workdayWake)) / 60
}
