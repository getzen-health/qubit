export interface STOPBANGAnswers {
  snoring: boolean
  tired: boolean
  observed: boolean
  pressure: boolean
  bmi_over_35: boolean
  age_over_50: boolean
  neck_over_40: boolean // or 38 for female
  male: boolean
}

export interface ESS_Answers {
  reading: number // 0-3
  watching_tv: number
  public_inactive: number
  car_passenger: number
  afternoon_lying: number
  talking: number
  after_lunch: number
  traffic: number
}

export interface SleepApneaResult {
  stopbang_score: number // 0-8
  stopbang_risk: 'Low' | 'Intermediate' | 'High'
  ess_score: number // 0-24
  ess_category: 'Normal' | 'Mild' | 'Moderate' | 'Severe'
  combined_recommendation: string
  should_see_doctor: boolean
  resources: { name: string; url: string }[]
}

export function calculateSTOPBANG(answers: STOPBANGAnswers): number {
  return Object.values(answers).filter(Boolean).length
}

export function calculateESS(answers: ESS_Answers): number {
  return Object.values(answers).reduce((sum, v) => sum + v, 0)
}

export function interpretResults(stopbang: number, ess: number): SleepApneaResult {
  const stopbang_risk: SleepApneaResult['stopbang_risk'] =
    stopbang <= 2 ? 'Low' : stopbang <= 4 ? 'Intermediate' : 'High'

  const ess_category: SleepApneaResult['ess_category'] =
    ess <= 10 ? 'Normal' : ess <= 12 ? 'Mild' : ess <= 15 ? 'Moderate' : 'Severe'

  const should_see_doctor = stopbang >= 5 || ess >= 11

  let combined_recommendation: string
  if (stopbang >= 5 && ess >= 11) {
    combined_recommendation =
      'Your STOP-BANG score indicates high OSA risk and your Epworth score shows significant daytime sleepiness. Please consult a sleep specialist promptly. A formal sleep study (polysomnography) is strongly recommended.'
  } else if (stopbang >= 5) {
    combined_recommendation =
      'Your STOP-BANG score indicates high OSA risk. Although your daytime sleepiness is manageable, a sleep physician evaluation and possible overnight sleep study are recommended.'
  } else if (ess >= 11) {
    combined_recommendation =
      'Your Epworth score suggests significant daytime sleepiness. Even with a lower STOP-BANG score, please discuss your sleepiness with your doctor to rule out sleep disorders or other causes.'
  } else if (stopbang >= 3) {
    combined_recommendation =
      'You have an intermediate OSA risk. Maintain good sleep hygiene, avoid alcohol near bedtime, and monitor for worsening symptoms. Discuss with your doctor at your next routine visit.'
  } else {
    combined_recommendation =
      'Your scores suggest a low risk of sleep apnea and normal daytime alertness. Continue good sleep habits and repeat this screen if symptoms change.'
  }

  return {
    stopbang_score: stopbang,
    stopbang_risk,
    ess_score: ess,
    ess_category,
    combined_recommendation,
    should_see_doctor,
    resources: [
      {
        name: 'AASM Sleep Center Finder',
        url: 'https://sleepeducation.org/sleep-center/',
      },
      {
        name: 'What is Obstructive Sleep Apnea? (AASM)',
        url: 'https://sleepeducation.org/sleep-disorders/obstructive-sleep-apnea/',
      },
      {
        name: 'Understanding Sleep Studies',
        url: 'https://sleepeducation.org/sleep-disorders/obstructive-sleep-apnea/diagnosis/',
      },
    ],
  }
}
