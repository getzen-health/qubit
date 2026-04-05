import { describe, it, expect } from 'vitest'
import {
  calculateChronotype,
  calculateSocialJetLag,
  CHRONOTYPES,
} from '../lib/chronotype'

describe('calculateChronotype', () => {
  it('returns lion for avg <= 1.8 (extreme early answers)', () => {
    const answers = {
      wake_time: 1,
      sleep_time: 1,
      peak_energy: 1,
      morning_feel: 1,
      sleep_quality: 3,
      weekend_shift: 1,
    }
    expect(calculateChronotype(answers)).toBe('lion')
  })

  it('returns bear for avg between 1.8 and 3.2', () => {
    const answers = {
      wake_time: 3,
      sleep_time: 3,
      peak_energy: 3,
      morning_feel: 3,
      sleep_quality: 3,
      weekend_shift: 3,
    }
    expect(calculateChronotype(answers)).toBe('bear')
  })

  it('returns wolf for avg > 3.2', () => {
    const answers = {
      wake_time: 5,
      sleep_time: 5,
      peak_energy: 5,
      morning_feel: 5,
      sleep_quality: 3,
      weekend_shift: 3,
    }
    expect(calculateChronotype(answers)).toBe('wolf')
  })

  it('returns dolphin when weekend_shift >= 4 AND sleep_quality >= 4', () => {
    const answers = {
      wake_time: 3,
      sleep_time: 3,
      peak_energy: 3,
      morning_feel: 3,
      sleep_quality: 4,
      weekend_shift: 4,
    }
    expect(calculateChronotype(answers)).toBe('dolphin')
  })

  it('dolphin takes priority over average-based classification', () => {
    // avg would be ~1.8 (lion territory) but dolphin condition is met
    const answers = {
      wake_time: 1,
      sleep_time: 1,
      peak_energy: 1,
      morning_feel: 1,
      sleep_quality: 4,
      weekend_shift: 4,
    }
    expect(calculateChronotype(answers)).toBe('dolphin')
  })

  it('bear boundary: avg exactly 3.2 → bear', () => {
    // 6 values averaging to 3.2: total = 19.2
    // Use values that average exactly to 3.2, none trigger dolphin
    const answers = {
      wake_time: 3,
      sleep_time: 3,
      peak_energy: 4,
      morning_feel: 3,
      sleep_quality: 3,
      weekend_shift: 3,
    }
    // avg = (3+3+4+3+3+3)/6 = 19/6 ≈ 3.17 ≤ 3.2 → bear
    expect(calculateChronotype(answers)).toBe('bear')
  })

  it('wolf boundary: avg just above 3.2', () => {
    const answers = {
      wake_time: 4,
      sleep_time: 4,
      peak_energy: 3,
      morning_feel: 3,
      sleep_quality: 3,
      weekend_shift: 3,
    }
    // avg = 20/6 ≈ 3.33 > 3.2 → wolf
    expect(calculateChronotype(answers)).toBe('wolf')
  })

  it('does not classify as dolphin if only one condition met', () => {
    const answers = {
      wake_time: 5,
      sleep_time: 5,
      peak_energy: 5,
      morning_feel: 5,
      sleep_quality: 2, // not >= 4
      weekend_shift: 5,
    }
    expect(calculateChronotype(answers)).not.toBe('dolphin')
  })
})

describe('calculateSocialJetLag', () => {
  it('returns 0 for identical wake times', () => {
    expect(calculateSocialJetLag('07:00', '07:00')).toBe(0)
  })

  it('returns 2 hours for 07:00 vs 09:00', () => {
    expect(calculateSocialJetLag('07:00', '09:00')).toBe(2)
  })

  it('returns 1.5 hours for 06:30 vs 08:00', () => {
    expect(calculateSocialJetLag('06:30', '08:00')).toBe(1.5)
  })

  it('handles when free day is earlier than work day', () => {
    expect(calculateSocialJetLag('08:00', '06:00')).toBe(2)
  })
})

describe('CHRONOTYPES constant', () => {
  it('has all four chronotype profiles defined', () => {
    expect(Object.keys(CHRONOTYPES)).toEqual(['lion', 'bear', 'wolf', 'dolphin'])
  })

  it('each profile has required fields', () => {
    for (const profile of Object.values(CHRONOTYPES)) {
      expect(profile.emoji).toBeTruthy()
      expect(profile.optimalWake).toBeTruthy()
      expect(profile.optimalSleep).toBeTruthy()
      expect(profile.strengths.length).toBeGreaterThan(0)
      expect(profile.tips.length).toBeGreaterThan(0)
    }
  })
})
