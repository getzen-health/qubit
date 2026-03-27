import { describe, it, expect } from 'vitest'
import {
  calculateSessionLoad,
  calculateTrainingMetrics,
  predictRaceTime,
  getRacePredictions,
  SPORTS,
  MESOCYCLE_TEMPLATES,
  RPE_LABELS,
  type TrainingSession,
} from '../../lib/athletic-performance'

describe('calculateSessionLoad', () => {
  it('load = duration × RPE', () => {
    expect(calculateSessionLoad(60, 7)).toBe(420)
    expect(calculateSessionLoad(30, 5)).toBe(150)
    expect(calculateSessionLoad(90, 8)).toBe(720)
  })

  it('zero duration → zero load', () => {
    expect(calculateSessionLoad(0, 8)).toBe(0)
  })

  it('zero RPE → zero load', () => {
    expect(calculateSessionLoad(45, 0)).toBe(0)
  })
})

describe('calculateTrainingMetrics', () => {
  it('returns all-zeros metrics for empty sessions', () => {
    const result = calculateTrainingMetrics([])
    expect(result.atl).toBe(0)
    expect(result.ctl).toBe(0)
    expect(result.tsb).toBe(0)
    expect(result.trainingStatus).toBe('fresh')
    expect(result.atlHistory).toHaveLength(0)
  })

  it('recent heavy training moves status toward tired', () => {
    const today = new Date()
    const sessions: TrainingSession[] = Array.from({ length: 20 }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      return {
        date: d.toISOString().slice(0, 10),
        sport: 'running',
        durationMin: 90,
        rpe: 8,
        workoutType: 'hard',
      }
    })
    const result = calculateTrainingMetrics(sessions)
    expect(result.atl).toBeGreaterThan(0)
    expect(result.ctl).toBeGreaterThan(0)
    expect(['optimal', 'tired', 'overreached']).toContain(result.trainingStatus)
  })

  it('ATL always >= 0', () => {
    const today = new Date()
    const sessions: TrainingSession[] = [
      { date: today.toISOString().slice(0, 10), sport: 'running', durationMin: 30, rpe: 5, workoutType: 'easy' }
    ]
    const result = calculateTrainingMetrics(sessions)
    expect(result.atl).toBeGreaterThanOrEqual(0)
    expect(result.ctl).toBeGreaterThanOrEqual(0)
  })

  it('atlHistory contains last 30 days', () => {
    const today = new Date()
    const session: TrainingSession = {
      date: today.toISOString().slice(0, 10),
      sport: 'cycling',
      durationMin: 60,
      rpe: 6,
      workoutType: 'moderate',
    }
    const result = calculateTrainingMetrics([session])
    expect(result.atlHistory.length).toBeLessThanOrEqual(30)
  })

  it('TSB = CTL - ATL', () => {
    const today = new Date()
    const sessions: TrainingSession[] = Array.from({ length: 10 }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      return {
        date: d.toISOString().slice(0, 10),
        sport: 'running',
        durationMin: 45,
        rpe: 6,
        workoutType: 'moderate',
      }
    })
    const result = calculateTrainingMetrics(sessions)
    expect(result.tsb).toBeCloseTo(result.ctl - result.atl, 1)
  })

  it('respects sessionLoad if pre-calculated', () => {
    const today = new Date().toISOString().slice(0, 10)
    const sessions: TrainingSession[] = [
      { date: today, sport: 'running', durationMin: 60, rpe: 7, workoutType: 'hard', sessionLoad: 500 }
    ]
    const result = calculateTrainingMetrics(sessions)
    expect(result.atl).toBeGreaterThan(0)
  })
})

describe('predictRaceTime', () => {
  it('same distance returns same time', () => {
    expect(predictRaceTime(10, 3600, 10)).toBeCloseTo(3600, 0)
  })

  it('longer distance returns longer time', () => {
    const t5k = predictRaceTime(5, 1200, 5)
    const t10k = predictRaceTime(5, 1200, 10)
    expect(t10k).toBeGreaterThan(t5k)
  })

  it('Riegel formula: 10k from 5k time', () => {
    // Known result: 5k in 20min (1200s) → 10k ≈ 41:41 (2501s approx)
    const predicted = predictRaceTime(5, 1200, 10)
    expect(predicted).toBeGreaterThan(2400)
    expect(predicted).toBeLessThan(2600)
  })
})

describe('getRacePredictions', () => {
  it('returns predictions for all standard distances', () => {
    const predictions = getRacePredictions(10, 3600)
    const distances = predictions.map(p => p.distance)
    expect(distances).toContain('5K')
    expect(distances).toContain('10K')
    expect(distances).toContain('Half Marathon')
    expect(distances).toContain('Marathon')
  })

  it('each prediction has formatted time and pace', () => {
    const predictions = getRacePredictions(10, 3600)
    predictions.forEach(p => {
      expect(p.predictedFormatted).toBeTruthy()
      expect(p.pace).toContain('/km')
    })
  })

  it('marathon prediction is longer than half-marathon', () => {
    const predictions = getRacePredictions(10, 3600)
    const half = predictions.find(p => p.distance === 'Half Marathon')!
    const full = predictions.find(p => p.distance === 'Marathon')!
    expect(full.predictedSeconds).toBeGreaterThan(half.predictedSeconds)
  })
})

describe('SPORTS catalogue', () => {
  it('contains at least 10 sports', () => {
    expect(SPORTS.length).toBeGreaterThanOrEqual(10)
  })

  it('each sport has id, name, icon, and category', () => {
    SPORTS.forEach(s => {
      expect(s.id).toBeTruthy()
      expect(s.name).toBeTruthy()
      expect(s.icon).toBeTruthy()
      expect(['endurance', 'strength', 'team', 'combat', 'flexibility']).toContain(s.category)
    })
  })

  it('includes running and cycling', () => {
    const ids = SPORTS.map(s => s.id)
    expect(ids).toContain('running')
    expect(ids).toContain('cycling')
  })
})

describe('MESOCYCLE_TEMPLATES', () => {
  it('has at least one template', () => {
    expect(MESOCYCLE_TEMPLATES.length).toBeGreaterThan(0)
  })

  it('each template has phases covering all weeks', () => {
    MESOCYCLE_TEMPLATES.forEach(t => {
      expect(t.phases).toHaveLength(t.weeks)
    })
  })
})

describe('RPE_LABELS', () => {
  it('has labels for RPE 1–10', () => {
    for (let i = 1; i <= 10; i++) {
      expect(RPE_LABELS[i]).toBeTruthy()
    }
  })
})
