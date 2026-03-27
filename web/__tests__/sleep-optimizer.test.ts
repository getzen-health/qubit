import { describe, it, expect } from 'vitest'
import {
  scoreMEQ,
  scoreToChronotype,
  socialJetLag,
  calculateSleepDebt,
  caffeineModel,
  caffeineAtBedtime,
  caffeineHourlyCurve,
  generateSleepSchedule,
  twoProcessModel,
  CHRONOTYPE_PROFILES,
  MEQ_QUESTIONS,
  SLEEP_HYGIENE_TIPS,
} from '../../lib/sleep-optimizer'

describe('scoreToChronotype', () => {
  it('score ≥ 22 → definite_morning', () => {
    expect(scoreToChronotype(22)).toBe('definite_morning')
    expect(scoreToChronotype(28)).toBe('definite_morning')
  })

  it('score 18–21 → moderate_morning', () => {
    expect(scoreToChronotype(18)).toBe('moderate_morning')
    expect(scoreToChronotype(21)).toBe('moderate_morning')
  })

  it('score 12–17 → intermediate', () => {
    expect(scoreToChronotype(14)).toBe('intermediate')
  })

  it('score 8–11 → moderate_evening', () => {
    expect(scoreToChronotype(10)).toBe('moderate_evening')
  })

  it('score < 8 → definite_evening', () => {
    expect(scoreToChronotype(3)).toBe('definite_evening')
    expect(scoreToChronotype(0)).toBe('definite_evening')
  })
})

describe('scoreMEQ', () => {
  it('all max scores → definite_morning', () => {
    const maxAnswers: Record<number, number> = { 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4, 7: 4 }
    const result = scoreMEQ(maxAnswers)
    expect(result.total).toBe(28)
    expect(result.chronotype).toBe('definite_morning')
  })

  it('all min scores → definite_evening', () => {
    const minAnswers: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 }
    const result = scoreMEQ(minAnswers)
    expect(result.total).toBe(0)
    expect(result.chronotype).toBe('definite_evening')
  })

  it('returns total as sum of answer scores', () => {
    const answers: Record<number, number> = { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 7: 2 }
    const result = scoreMEQ(answers)
    expect(result.total).toBe(14)
  })
})

describe('socialJetLag', () => {
  it('delta < 0.5 → none severity', () => {
    const result = socialJetLag('07:00', '07:15')
    expect(result.severity).toBe('none')
  })

  it('delta 0.5–1h → mild severity', () => {
    const result = socialJetLag('07:00', '07:45') // delta = 0.75h
    expect(result.severity).toBe('mild')
  })

  it('delta 1–2h → moderate severity', () => {
    const result = socialJetLag('06:00', '07:30') // delta = 1.5h
    expect(result.severity).toBe('moderate')
  })

  it('delta ≥ 2h → severe severity', () => {
    const result = socialJetLag('06:00', '10:00')
    expect(result.severity).toBe('severe')
    expect(result.deltaHours).toBeCloseTo(4, 0)
  })

  it('returns delta in hours rounded to 1 decimal', () => {
    const result = socialJetLag('07:00', '08:30')
    expect(result.deltaHours).toBe(1.5)
  })
})

describe('calculateSleepDebt', () => {
  it('returns zero debt for empty logs', () => {
    const result = calculateSleepDebt([])
    expect(result.totalDebt14d).toBe(0)
    expect(result.avgDuration).toBe(0)
  })

  it('calculates debt correctly for consistent short sleeper', () => {
    const logs = Array.from({ length: 7 }, (_, i) => ({
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      durationH: 6,
    }))
    const result = calculateSleepDebt(logs, 8)
    expect(result.totalDebt14d).toBeGreaterThan(0)
    expect(result.deficitDays).toBe(7)
    expect(result.surplusDays).toBe(0)
  })

  it('calculates no debt for consistent adequate sleeper', () => {
    const logs = Array.from({ length: 7 }, (_, i) => ({
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      durationH: 8,
    }))
    const result = calculateSleepDebt(logs, 8)
    expect(result.totalDebt14d).toBe(0)
    expect(result.surplusDays).toBe(7)
  })

  it('trend is improving when recent nights have more sleep', () => {
    const logs = [
      { date: '2024-01-01', durationH: 5 },
      { date: '2024-01-02', durationH: 5 },
      { date: '2024-01-03', durationH: 5 },
      { date: '2024-01-04', durationH: 8 },
      { date: '2024-01-05', durationH: 8 },
      { date: '2024-01-06', durationH: 8 },
    ]
    const result = calculateSleepDebt(logs, 8)
    expect(result.trend).toBe('improving')
  })
})

describe('caffeineModel', () => {
  it('returns 0 blood level with no doses', () => {
    const result = caffeineModel([], 14)
    expect(result.bloodLevelMg).toBe(0)
  })

  it('level at time of dose equals dose amount', () => {
    const result = caffeineModel([{ timeHour: 8, mgAmount: 100 }], 8)
    expect(result.bloodLevelMg).toBeCloseTo(100, 0)
  })

  it('level decreases over time (half-life = 5.5h)', () => {
    const atDose = caffeineModel([{ timeHour: 8, mgAmount: 200 }], 8)
    const fiveHoursLater = caffeineModel([{ timeHour: 8, mgAmount: 200 }], 13.5)
    expect(fiveHoursLater.bloodLevelMg).toBeLessThan(atDose.bloodLevelMg)
    expect(fiveHoursLater.bloodLevelMg).toBeCloseTo(100, 10) // ~half-life
  })

  it('multiple doses accumulate', () => {
    const twoDoses = caffeineModel([
      { timeHour: 8, mgAmount: 100 },
      { timeHour: 10, mgAmount: 100 },
    ], 10)
    const oneDose = caffeineModel([{ timeHour: 10, mgAmount: 100 }], 10)
    expect(twoDoses.bloodLevelMg).toBeGreaterThan(oneDose.bloodLevelMg)
  })
})

describe('caffeineAtBedtime', () => {
  it('returns no disruption warning with no caffeine', () => {
    const result = caffeineAtBedtime([], 22)
    expect(result.disruptionWarning).toBe(false)
  })

  it('returns disruption warning with high caffeine at bedtime', () => {
    const result = caffeineAtBedtime([{ timeHour: 21.5, mgAmount: 200 }], 22)
    expect(result.disruptionWarning).toBe(true)
  })
})

describe('caffeineHourlyCurve', () => {
  it('returns 24 data points', () => {
    const curve = caffeineHourlyCurve([{ timeHour: 8, mgAmount: 200 }])
    expect(curve).toHaveLength(24)
    expect(curve[0].hour).toBe(0)
    expect(curve[23].hour).toBe(23)
  })
})

describe('generateSleepSchedule', () => {
  it('returns a schedule object with all required keys', () => {
    const schedule = generateSleepSchedule('intermediate', '07:00')
    expect(schedule).toHaveProperty('bedtime')
    expect(schedule).toHaveProperty('windDownStart')
    expect(schedule).toHaveProperty('lightsOut')
    expect(schedule).toHaveProperty('lightExposureTime')
    expect(schedule).toHaveProperty('caffeineLastTime')
    expect(schedule).toHaveProperty('exerciseWindow')
    expect(schedule).toHaveProperty('mealLastTime')
    expect(schedule).toHaveProperty('anchorHabits')
  })

  it('bedtime is 8h before wake time', () => {
    const schedule = generateSleepSchedule('intermediate', '07:00')
    expect(schedule.bedtime).toBe('23:00')
  })

  it('wind-down starts 1h before bedtime', () => {
    const schedule = generateSleepSchedule('intermediate', '08:00')
    expect(schedule.windDownStart).toBe('23:00')
  })

  it('anchor habits array is non-empty', () => {
    const schedule = generateSleepSchedule('definite_evening', '09:00')
    expect(schedule.anchorHabits.length).toBeGreaterThan(0)
  })
})

describe('twoProcessModel', () => {
  it('process S increases with hours awake', () => {
    const early = twoProcessModel(2, 'intermediate')
    const late = twoProcessModel(16, 'intermediate')
    expect(late.processS).toBeGreaterThan(early.processS)
  })

  it('returns values between 0 and 10', () => {
    const result = twoProcessModel(8, 'definite_morning')
    expect(result.processS).toBeGreaterThanOrEqual(0)
    expect(result.processS).toBeLessThanOrEqual(10)
    expect(result.processC).toBeGreaterThanOrEqual(0)
    expect(result.processC).toBeLessThanOrEqual(10)
    expect(result.sleepiness).toBeGreaterThanOrEqual(0)
    expect(result.sleepiness).toBeLessThanOrEqual(10)
  })

  it('returns a non-empty interpretation string', () => {
    const result = twoProcessModel(18, 'definite_evening')
    expect(result.interpretation.length).toBeGreaterThan(0)
  })
})

describe('CHRONOTYPE_PROFILES', () => {
  it('has all 5 chronotype keys', () => {
    const keys = Object.keys(CHRONOTYPE_PROFILES)
    expect(keys).toContain('definite_morning')
    expect(keys).toContain('moderate_morning')
    expect(keys).toContain('intermediate')
    expect(keys).toContain('moderate_evening')
    expect(keys).toContain('definite_evening')
  })
})

describe('SLEEP_HYGIENE_TIPS', () => {
  it('contains Grade A evidence tips', () => {
    const gradeA = SLEEP_HYGIENE_TIPS.filter(t => t.evidenceGrade === 'A')
    expect(gradeA.length).toBeGreaterThan(0)
  })
})

describe('MEQ_QUESTIONS', () => {
  it('has 7 questions', () => {
    expect(MEQ_QUESTIONS).toHaveLength(7)
  })
})
