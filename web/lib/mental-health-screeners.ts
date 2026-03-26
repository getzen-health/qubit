export interface ScreenerQuestion {
  id: string
  text: string
  options: Array<{ label: string; value: number }>
}

// PHQ-9 (Kroenke et al. 2001) — free to use
const FREQ_OPTIONS = [
  { label: 'Not at all', value: 0 },
  { label: 'Several days', value: 1 },
  { label: 'More than half the days', value: 2 },
  { label: 'Nearly every day', value: 3 },
]

export const PHQ9_QUESTIONS: ScreenerQuestion[] = [
  { id: 'phq1', text: 'Little interest or pleasure in doing things', options: FREQ_OPTIONS },
  { id: 'phq2', text: 'Feeling down, depressed, or hopeless', options: FREQ_OPTIONS },
  { id: 'phq3', text: 'Trouble falling or staying asleep, or sleeping too much', options: FREQ_OPTIONS },
  { id: 'phq4', text: 'Feeling tired or having little energy', options: FREQ_OPTIONS },
  { id: 'phq5', text: 'Poor appetite or overeating', options: FREQ_OPTIONS },
  { id: 'phq6', text: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down', options: FREQ_OPTIONS },
  { id: 'phq7', text: 'Trouble concentrating on things, such as reading the newspaper or watching television', options: FREQ_OPTIONS },
  { id: 'phq8', text: 'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual', options: FREQ_OPTIONS },
  { id: 'phq9', text: 'Thoughts that you would be better off dead, or of hurting yourself in some way', options: FREQ_OPTIONS },
]

// GAD-7 (Spitzer et al. 2006) — free to use
export const GAD7_QUESTIONS: ScreenerQuestion[] = [
  { id: 'gad1', text: 'Feeling nervous, anxious, or on edge', options: FREQ_OPTIONS },
  { id: 'gad2', text: 'Not being able to stop or control worrying', options: FREQ_OPTIONS },
  { id: 'gad3', text: 'Worrying too much about different things', options: FREQ_OPTIONS },
  { id: 'gad4', text: 'Trouble relaxing', options: FREQ_OPTIONS },
  { id: 'gad5', text: 'Being so restless that it is hard to sit still', options: FREQ_OPTIONS },
  { id: 'gad6', text: 'Becoming easily annoyed or irritable', options: FREQ_OPTIONS },
  { id: 'gad7', text: 'Feeling afraid as if something awful might happen', options: FREQ_OPTIONS },
]

// PSS-4 (Cohen et al. 1983) — free to use
const PSS_FREQ = [
  { label: 'Never', value: 0 },
  { label: 'Almost never', value: 1 },
  { label: 'Sometimes', value: 2 },
  { label: 'Fairly often', value: 3 },
  { label: 'Very often', value: 4 },
]
const PSS_REVERSE = [
  { label: 'Never', value: 4 },
  { label: 'Almost never', value: 3 },
  { label: 'Sometimes', value: 2 },
  { label: 'Fairly often', value: 1 },
  { label: 'Very often', value: 0 },
]

export const PSS4_QUESTIONS: ScreenerQuestion[] = [
  { id: 'pss1', text: 'In the last month, how often have you felt that you were unable to control the important things in your life?', options: PSS_FREQ },
  { id: 'pss2', text: 'In the last month, how often have you felt confident about your ability to handle your personal problems?', options: PSS_REVERSE },
  { id: 'pss3', text: 'In the last month, how often have you felt that things were going your way?', options: PSS_REVERSE },
  { id: 'pss4', text: 'In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?', options: PSS_FREQ },
]

export interface ScoreInterpretation {
  range: string; label: string; color: string; description: string; showCrisis: boolean
}

export const PHQ9_INTERPRETATION = (score: number): ScoreInterpretation => {
  if (score <= 4) return { range: '0-4', label: 'Minimal', color: 'green', description: 'Minimal symptoms. Keep up your self-care routine.', showCrisis: false }
  if (score <= 9) return { range: '5-9', label: 'Mild', color: 'yellow', description: 'Mild symptoms. Consider talking to someone you trust or a counselor.', showCrisis: false }
  if (score <= 14) return { range: '10-14', label: 'Moderate', color: 'orange', description: 'Moderate symptoms. Consider speaking with a healthcare provider.', showCrisis: true }
  if (score <= 19) return { range: '15-19', label: 'Moderately Severe', color: 'red', description: 'Moderately severe symptoms. We recommend speaking with a mental health professional.', showCrisis: true }
  return { range: '20-27', label: 'Severe', color: 'red', description: 'Severe symptoms. Please reach out to a mental health professional or crisis line.', showCrisis: true }
}

export const GAD7_INTERPRETATION = (score: number): ScoreInterpretation => {
  if (score <= 4) return { range: '0-4', label: 'Minimal', color: 'green', description: 'Minimal anxiety symptoms.', showCrisis: false }
  if (score <= 9) return { range: '5-9', label: 'Mild', color: 'yellow', description: 'Mild anxiety. Breathing exercises and physical activity can help.', showCrisis: false }
  if (score <= 14) return { range: '10-14', label: 'Moderate', color: 'orange', description: 'Moderate anxiety. Consider speaking with a healthcare provider.', showCrisis: true }
  return { range: '15-21', label: 'Severe', color: 'red', description: 'Severe anxiety symptoms. Please consider reaching out to a professional.', showCrisis: true }
}

export const PSS4_INTERPRETATION = (score: number): ScoreInterpretation => {
  if (score <= 4) return { range: '0-4', label: 'Low Stress', color: 'green', description: 'Low perceived stress. You are coping well.', showCrisis: false }
  if (score <= 7) return { range: '5-7', label: 'Moderate Stress', color: 'yellow', description: 'Moderate stress. Regular self-care and social connection can help.', showCrisis: false }
  return { range: '8-16', label: 'High Stress', color: 'red', description: 'Elevated stress levels. Consider stress management strategies or professional support.', showCrisis: true }
}
