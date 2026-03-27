import { describe, it, expect, vi } from 'vitest'
import {
  getProgressPct,
  isOnTrack,
  analyzeGoal,
  getDailyQuote,
  MOTIVATIONAL_QUOTES,
  GOAL_CATEGORY_CONFIG,
  type HealthGoal,
  type GoalCheckin,
} from '../../lib/health-goals'

function makeGoal(overrides: Partial<HealthGoal> = {}): HealthGoal {
  const today = new Date()
  const start = new Date(today)
  start.setDate(start.getDate() - 15)
  const end = new Date(today)
  end.setDate(today.getDate() + 15)
  return {
    title: 'Run 5k in 25 min',
    category: 'cardio_fitness',
    specific: 'Run a sub-25 minute 5K',
    metric: 'run_time_min',
    target_value: 100,
    current_value: 50,
    unit: 'pts',
    start_date: start.toISOString().slice(0, 10),
    target_date: end.toISOString().slice(0, 10),
    wish: 'Become a runner',
    outcome: 'Better cardiovascular health',
    obstacle: 'Lack of time',
    plan: 'If I skip a run, I will do it the next morning.',
    status: 'active',
    motivation_level: 8,
    ...overrides,
  }
}

function makeCheckin(overrides: Partial<GoalCheckin> = {}): GoalCheckin {
  return {
    goal_id: 'goal-1',
    date: new Date().toISOString().slice(0, 10),
    current_value: 60,
    progress_rating: 4,
    plan_executed: true,
    motivation_level: 7,
    ...overrides,
  }
}

describe('getProgressPct', () => {
  it('50 out of 100 → 50%', () => {
    expect(getProgressPct(makeGoal({ current_value: 50, target_value: 100 }))).toBe(50)
  })

  it('100 out of 100 → 100%', () => {
    expect(getProgressPct(makeGoal({ current_value: 100, target_value: 100 }))).toBe(100)
  })

  it('exceeding target is capped at 100%', () => {
    expect(getProgressPct(makeGoal({ current_value: 150, target_value: 100 }))).toBe(100)
  })

  it('target_value = 0 → 0%', () => {
    expect(getProgressPct(makeGoal({ current_value: 50, target_value: 0 }))).toBe(0)
  })

  it('0 progress → 0%', () => {
    expect(getProgressPct(makeGoal({ current_value: 0, target_value: 100 }))).toBe(0)
  })
})

describe('isOnTrack', () => {
  it('goal 50% through with 50% progress → on track', () => {
    // start 15 days ago, end 15 days from now = 30 day goal, 50% elapsed
    const goal = makeGoal({ current_value: 50, target_value: 100 })
    // On track expects pct ≥ elapsedPct * 0.85
    // 50% progress ≥ 50% elapsed * 0.85 = 42.5% → true
    expect(isOnTrack(goal)).toBe(true)
  })

  it('goal with 0 progress halfway through → not on track', () => {
    const goal = makeGoal({ current_value: 0, target_value: 100 })
    // 0% progress < 50% elapsed * 0.85 = 42.5% → false
    expect(isOnTrack(goal)).toBe(false)
  })

  it('returns boolean', () => {
    expect(typeof isOnTrack(makeGoal())).toBe('boolean')
  })
})

describe('analyzeGoal', () => {
  it('returns all required fields', () => {
    const result = analyzeGoal(makeGoal(), [])
    expect(result).toHaveProperty('progressPct')
    expect(result).toHaveProperty('daysRemaining')
    expect(result).toHaveProperty('onTrack')
    expect(result).toHaveProperty('avgMotivation')
    expect(result).toHaveProperty('checkInStreak')
    expect(result).toHaveProperty('recommendations')
  })

  it('daysRemaining is non-negative', () => {
    const result = analyzeGoal(makeGoal(), [])
    expect(result.daysRemaining).toBeGreaterThanOrEqual(0)
  })

  it('avgMotivation reflects checkin values', () => {
    const checkins: GoalCheckin[] = [
      makeCheckin({ motivation_level: 10 }),
    ]
    const goal = makeGoal({ motivation_level: 5 })
    const result = analyzeGoal(goal, checkins)
    // avg of [5, 10] = 7.5
    expect(result.avgMotivation).toBeCloseTo(7.5, 1)
  })

  it('recommendations includes off-track message when behind', () => {
    const goal = makeGoal({ current_value: 0, target_value: 100 })
    const result = analyzeGoal(goal, [])
    expect(result.recommendations.length).toBeGreaterThan(0)
    expect(result.recommendations[0]).toContain('behind')
  })

  it('checkInStreak is 0 when no checkins today', () => {
    const result = analyzeGoal(makeGoal(), [])
    expect(result.checkInStreak).toBe(0)
  })

  it('checkInStreak counts consecutive days from today', () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    const checkins: GoalCheckin[] = [
      makeCheckin({ date: today.toISOString().slice(0, 10) }),
      makeCheckin({ date: yesterday.toISOString().slice(0, 10) }),
    ]
    const result = analyzeGoal(makeGoal(), checkins)
    expect(result.checkInStreak).toBe(2)
  })

  it('completed goal adds celebration recommendation', () => {
    const goal = makeGoal({ current_value: 100, target_value: 100 })
    const result = analyzeGoal(goal, [])
    expect(result.recommendations.some(r => r.includes('🎉'))).toBe(true)
  })

  it('projectedCompletion is set when enough checkins with positive velocity', () => {
    const older = new Date()
    older.setDate(older.getDate() - 7)
    const checkins: GoalCheckin[] = [
      makeCheckin({ date: older.toISOString().slice(0, 10), current_value: 20 }),
      makeCheckin({ date: new Date().toISOString().slice(0, 10), current_value: 50 }),
    ]
    const result = analyzeGoal(makeGoal(), checkins)
    expect(result.projectedCompletion).toBeTruthy()
  })
})

describe('getDailyQuote', () => {
  it('returns an object with quote and author', () => {
    const q = getDailyQuote()
    expect(q).toHaveProperty('quote')
    expect(q).toHaveProperty('author')
  })

  it('quote and author are non-empty strings', () => {
    const q = getDailyQuote()
    expect(q.quote.length).toBeGreaterThan(0)
    expect(q.author.length).toBeGreaterThan(0)
  })

  it('result is always from MOTIVATIONAL_QUOTES', () => {
    const q = getDailyQuote()
    const found = MOTIVATIONAL_QUOTES.find(mq => mq.quote === q.quote)
    expect(found).toBeTruthy()
  })
})

describe('MOTIVATIONAL_QUOTES', () => {
  it('has at least 10 quotes', () => {
    expect(MOTIVATIONAL_QUOTES.length).toBeGreaterThanOrEqual(10)
  })

  it('each quote has non-empty quote and author', () => {
    MOTIVATIONAL_QUOTES.forEach(q => {
      expect(q.quote.length).toBeGreaterThan(0)
      expect(q.author.length).toBeGreaterThan(0)
    })
  })
})

describe('GOAL_CATEGORY_CONFIG', () => {
  it('has all 11 goal categories', () => {
    const keys = Object.keys(GOAL_CATEGORY_CONFIG)
    expect(keys.length).toBe(11)
    expect(keys).toContain('weight_loss')
    expect(keys).toContain('muscle_gain')
    expect(keys).toContain('cardio_fitness')
    expect(keys).toContain('sleep')
    expect(keys).toContain('custom')
  })

  it('each category has label, icon, color, gradient, and examples', () => {
    Object.values(GOAL_CATEGORY_CONFIG).forEach(config => {
      expect(config.label).toBeTruthy()
      expect(config.icon).toBeTruthy()
      expect(config.color).toBeTruthy()
      expect(config.gradient).toBeTruthy()
      expect(config.examples.length).toBeGreaterThan(0)
    })
  })
})
