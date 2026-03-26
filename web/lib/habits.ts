// Habit tracking library — behavioral science-backed (Lally 2010, Fogg 2020, Duhigg 2012)

export interface HabitTemplate {
  id: string
  name: string
  emoji: string
  category: 'morning' | 'fitness' | 'nutrition' | 'sleep' | 'mental' | 'social' | 'custom'
  default_frequency: 'daily' | 'weekdays' | 'weekly'
  anchor_suggestion: string
  tiny_version: string
  science_note: string
}

export const HABIT_TEMPLATES: HabitTemplate[] = [
  // Morning
  {
    id: 'morning-sunlight',
    name: 'Morning sunlight',
    emoji: '☀️',
    category: 'morning',
    default_frequency: 'daily',
    anchor_suggestion: 'After getting dressed',
    tiny_version: 'Stand outside for 30 seconds',
    science_note: 'Light anchors circadian rhythm; cortisol spike supports wakefulness (Huberman 2021)',
  },
  {
    id: 'water-on-wake',
    name: 'Drink water on wake',
    emoji: '💧',
    category: 'morning',
    default_frequency: 'daily',
    anchor_suggestion: 'Before making coffee',
    tiny_version: 'One sip of water',
    science_note: 'Rehydrates after 6–8h of fluid loss; aids cognitive performance (Adan 2012)',
  },
  {
    id: 'morning-stretch',
    name: '5-min morning stretch',
    emoji: '🧘',
    category: 'morning',
    default_frequency: 'daily',
    anchor_suggestion: 'Right after getting out of bed',
    tiny_version: 'One cat-cow pose',
    science_note: 'Reduces injury risk; improves range of motion (Page 2012)',
  },
  {
    id: 'cold-shower',
    name: 'Cold shower',
    emoji: '🚿',
    category: 'morning',
    default_frequency: 'daily',
    anchor_suggestion: 'After your regular shower',
    tiny_version: '5 seconds of cold at the end',
    science_note: 'Norepinephrine surge improves alertness; brown fat activation (Søberg 2021)',
  },
  {
    id: 'gratitude-journal',
    name: 'Gratitude journal',
    emoji: '📓',
    category: 'morning',
    default_frequency: 'daily',
    anchor_suggestion: 'While drinking morning coffee',
    tiny_version: 'Write one thing you are grateful for',
    science_note: 'Gratitude practice reduces cortisol 23%; improves sleep (Emmons & McCullough 2003)',
  },
  {
    id: 'no-phone-morning',
    name: 'No phone for 30min after waking',
    emoji: '📵',
    category: 'morning',
    default_frequency: 'daily',
    anchor_suggestion: 'Before first phone check',
    tiny_version: 'Wait 5 minutes before checking phone',
    science_note: 'Reduces reactive mode and cortisol spike from social comparison (Newport 2019)',
  },
  {
    id: 'make-bed',
    name: 'Make your bed',
    emoji: '🛏️',
    category: 'morning',
    default_frequency: 'daily',
    anchor_suggestion: 'After getting up',
    tiny_version: 'Pull up the blanket',
    science_note: 'Completion loop signals productivity; correlates with better sleep quality (Admiral McRaven)',
  },
  // Fitness
  {
    id: 'daily-walk',
    name: '30-min walk',
    emoji: '🚶',
    category: 'fitness',
    default_frequency: 'daily',
    anchor_suggestion: 'After lunch',
    tiny_version: 'Walk to the mailbox and back',
    science_note: '45% lower all-cause mortality vs sedentary; zone-2 base building (Woolf-May 1999)',
  },
  {
    id: 'zone2-cardio',
    name: '20-min zone 2 cardio',
    emoji: '🏃',
    category: 'fitness',
    default_frequency: 'daily',
    anchor_suggestion: 'Before dinner',
    tiny_version: 'Walk briskly for 5 minutes',
    science_note: 'Zone 2 improves mitochondrial density, VO2max, and metabolic health (Seiler 2010)',
  },
  {
    id: 'strength-training',
    name: 'Strength training',
    emoji: '🏋️',
    category: 'fitness',
    default_frequency: 'weekly',
    anchor_suggestion: 'After work on Mon/Wed/Fri',
    tiny_version: 'Do 5 push-ups',
    science_note: 'Resistance training 3×/wk reduces mortality risk 22% (Saeidifard 2019)',
  },
  {
    id: 'steps-10k',
    name: '10,000 steps',
    emoji: '👟',
    category: 'fitness',
    default_frequency: 'daily',
    anchor_suggestion: 'Track throughout the day',
    tiny_version: 'Take stairs instead of elevator once',
    science_note: '8,000+ daily steps cuts cardiovascular mortality 51% (Saint-Maurice 2020)',
  },
  {
    id: 'core-plank',
    name: '5-min core work',
    emoji: '💪',
    category: 'fitness',
    default_frequency: 'daily',
    anchor_suggestion: 'Before showering',
    tiny_version: 'Hold plank for 10 seconds',
    science_note: 'Core stability reduces back pain risk and improves athletic performance',
  },
  // Nutrition
  {
    id: 'log-food',
    name: 'Log food intake',
    emoji: '🍽️',
    category: 'nutrition',
    default_frequency: 'daily',
    anchor_suggestion: 'Right after each meal',
    tiny_version: 'Log just breakfast',
    science_note: 'Food logging doubles weight-loss success; raises dietary awareness (Hollis 2008)',
  },
  {
    id: 'take-vitamins',
    name: 'Take vitamins/supplements',
    emoji: '💊',
    category: 'nutrition',
    default_frequency: 'daily',
    anchor_suggestion: 'With breakfast',
    tiny_version: 'Keep vitamins next to coffee maker',
    science_note: 'Vitamin D3+K2 and Omega-3 have strongest longevity evidence (Rizzoli 2013)',
  },
  {
    id: 'no-alcohol-weekdays',
    name: 'No alcohol on weekdays',
    emoji: '🚫',
    category: 'nutrition',
    default_frequency: 'weekdays',
    anchor_suggestion: 'When reaching for a drink after work',
    tiny_version: 'Replace with sparkling water + lime',
    science_note: 'Even light daily drinking raises breast cancer risk 7% (IARC 2010)',
  },
  {
    id: 'meal-prep',
    name: 'Meal prep Sunday',
    emoji: '🥗',
    category: 'nutrition',
    default_frequency: 'weekly',
    anchor_suggestion: 'Sunday afternoon',
    tiny_version: 'Chop vegetables for the week',
    science_note: 'Meal planning reduces takeaway spending and improves dietary quality (Ducrot 2017)',
  },
  {
    id: 'veggies-5-servings',
    name: 'Eat 5 vegetable servings',
    emoji: '🥦',
    category: 'nutrition',
    default_frequency: 'daily',
    anchor_suggestion: 'Add vegetables to each meal',
    tiny_version: 'Add spinach to one meal',
    science_note: '5+ servings/day lowers all-cause mortality 13% (Wang 2021)',
  },
  {
    id: 'water-8-glasses',
    name: 'Drink 8 glasses of water',
    emoji: '🥤',
    category: 'nutrition',
    default_frequency: 'daily',
    anchor_suggestion: 'Set hourly reminders',
    tiny_version: 'Drink a glass with each meal',
    science_note: 'Adequate hydration improves cognition, energy, and kidney function',
  },
  {
    id: 'no-sugar-evening',
    name: 'No sugar after 6pm',
    emoji: '🍬',
    category: 'nutrition',
    default_frequency: 'daily',
    anchor_suggestion: 'After dinner',
    tiny_version: 'Skip dessert just one night',
    science_note: 'Evening carbs cause greater insulin spike; disrupts sleep architecture (Afaghi 2007)',
  },
  // Sleep
  {
    id: 'no-phone-before-bed',
    name: 'No phone 1h before bed',
    emoji: '🌙',
    category: 'sleep',
    default_frequency: 'daily',
    anchor_suggestion: 'When brushing teeth',
    tiny_version: 'Put phone in another room 15min before bed',
    science_note: 'Blue light delays melatonin by 90min; screen content raises arousal (Chang 2015)',
  },
  {
    id: 'sleep-8h',
    name: '8-hour sleep target',
    emoji: '😴',
    category: 'sleep',
    default_frequency: 'daily',
    anchor_suggestion: 'Set a consistent bedtime alarm',
    tiny_version: 'Go to bed 15min earlier',
    science_note: '<6h sleep triples cold risk; impairs insulin sensitivity (Prather 2015)',
  },
  {
    id: 'consistent-wake-time',
    name: 'Consistent wake time (±30min)',
    emoji: '⏰',
    category: 'sleep',
    default_frequency: 'daily',
    anchor_suggestion: 'Same alarm every day including weekends',
    tiny_version: 'Wake within 1h of target this weekend',
    science_note: 'Sleep regularity index predicts mortality better than total duration (Phillips 2023)',
  },
  {
    id: 'no-caffeine-afternoon',
    name: 'No caffeine after 2pm',
    emoji: '☕',
    category: 'sleep',
    default_frequency: 'daily',
    anchor_suggestion: 'After lunchtime coffee',
    tiny_version: 'Switch to decaf after noon',
    science_note: 'Caffeine half-life 5–7h; 400mg at noon ≈ 200mg at bedtime (Drake 2013)',
  },
  {
    id: 'wind-down-routine',
    name: 'Wind-down routine',
    emoji: '🕯️',
    category: 'sleep',
    default_frequency: 'daily',
    anchor_suggestion: '45 minutes before target bedtime',
    tiny_version: 'Dim lights for 10 minutes',
    science_note: 'Pre-sleep rituals signal sleep onset; dim light supports melatonin rise',
  },
  // Mental
  {
    id: 'meditation',
    name: '10-min meditation',
    emoji: '🧘',
    category: 'mental',
    default_frequency: 'daily',
    anchor_suggestion: 'After morning coffee',
    tiny_version: '1-minute breathing exercise',
    science_note: 'MBSR reduces anxiety 38%, depression 30%; changes cortical thickness (Hölzel 2011)',
  },
  {
    id: 'read-10-pages',
    name: 'Read 10 pages',
    emoji: '📚',
    category: 'mental',
    default_frequency: 'daily',
    anchor_suggestion: 'Before bed instead of phone',
    tiny_version: 'Read 1 page',
    science_note: 'Reading reduces stress 68% in 6min; active cognition delays dementia (Lewis 2009)',
  },
  {
    id: 'journaling',
    name: 'Journaling',
    emoji: '✍️',
    category: 'mental',
    default_frequency: 'daily',
    anchor_suggestion: 'Before bed',
    tiny_version: 'Write one sentence about today',
    science_note: 'Expressive writing reduces trauma symptoms, improves immune function (Pennebaker 1997)',
  },
  {
    id: 'digital-detox',
    name: 'Digital detox 1h',
    emoji: '🔕',
    category: 'mental',
    default_frequency: 'daily',
    anchor_suggestion: 'During dinner',
    tiny_version: 'Eat one meal without screens',
    science_note: 'Screen breaks reduce cortisol, restore attentional capacity (Ophir 2009)',
  },
  {
    id: 'deep-breathing',
    name: 'Deep breathing 5min',
    emoji: '🫁',
    category: 'mental',
    default_frequency: 'daily',
    anchor_suggestion: 'When feeling stressed',
    tiny_version: '3 slow deep breaths',
    science_note: '4-7-8 breathing activates parasympathetic; reduces HR, BP (Zaccaro 2018)',
  },
  // Social
  {
    id: 'call-friend',
    name: 'Call a friend',
    emoji: '📞',
    category: 'social',
    default_frequency: 'weekly',
    anchor_suggestion: 'During your commute or walk',
    tiny_version: 'Send a voice note',
    science_note: 'Strong social ties reduce mortality risk 50% (Holt-Lunstad 2010)',
  },
  {
    id: 'appreciation-text',
    name: 'Send an appreciation message',
    emoji: '💌',
    category: 'social',
    default_frequency: 'daily',
    anchor_suggestion: 'After morning coffee',
    tiny_version: 'Send a thumbs-up emoji to someone',
    science_note: 'Expressing gratitude to others boosts both giver and receiver well-being (Boehm 2011)',
  },
  {
    id: 'family-dinner',
    name: 'Family dinner (no phones)',
    emoji: '🍜',
    category: 'social',
    default_frequency: 'weekly',
    anchor_suggestion: 'Weeknight dinners',
    tiny_version: 'Have one meal together this week',
    science_note: 'Family meals correlated with lower adolescent risk behaviors and adult loneliness',
  },
]

export interface Habit {
  id: string
  user_id: string
  name: string
  emoji: string
  category: string
  frequency: 'daily' | 'weekdays' | 'custom'
  custom_days?: number[]
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'anytime'
  anchor: string
  tiny_version: string
  target_streak: number
  xp_per_completion: number
  is_active: boolean
  created_at: string
}

export interface HabitLog {
  id?: string
  habit_id: string
  user_id?: string
  completed_at: string
  note?: string
  skipped?: boolean
  xp_earned?: number
}

export interface HabitStreak {
  current: number
  best: number
  total_completions: number
  completion_rate_7d: number
  completion_rate_30d: number
}

export interface UserLevel {
  total_xp: number
  level: number
  level_name: string
  xp_to_next: number
  achievements: Achievement[]
}

export interface Achievement {
  id: string
  name: string
  emoji: string
  description: string
  unlocked_at?: string
}

// XP required to reach each level (index = level-1, so index 0 = level 1)
const LEVEL_XP_THRESHOLDS = [
  0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11500,
  16000, 21500, 28500, 37000, 47000, 59000, 73500, 91000, 112000, 137000,
  166000, 200000, 240000, 286000, 339000, 400000, 470000, 550000, 641000, 744000,
  860000, 991000, 1138000, 1302000, 1485000, 1689000, 1915000, 2165000, 2441000, 2745000,
  3079000, 3445000, 3845000, 4282000, 4758000, 5276000, 5839000, 6450000, 7112000, 7828000,
]

const LEVEL_NAMES = [
  'Health Rookie', 'Health Rookie', 'Health Rookie', 'Health Rookie', 'Health Rookie',
  'Habit Builder', 'Habit Builder', 'Habit Builder', 'Habit Builder', 'Habit Builder',
  'Streak Starter', 'Streak Starter', 'Streak Starter', 'Streak Starter', 'Streak Starter',
  'Consistency Champion', 'Consistency Champion', 'Consistency Champion', 'Consistency Champion', 'Consistency Champion',
  'Wellness Warrior', 'Wellness Warrior', 'Wellness Warrior', 'Wellness Warrior', 'Wellness Warrior',
  'Vitality Master', 'Vitality Master', 'Vitality Master', 'Vitality Master', 'Vitality Master',
  'Peak Performer', 'Peak Performer', 'Peak Performer', 'Peak Performer', 'Peak Performer',
  'Biohacker', 'Biohacker', 'Biohacker', 'Biohacker', 'Biohacker',
  'Longevity Legend', 'Longevity Legend', 'Longevity Legend', 'Longevity Legend', 'Longevity Legend',
  'Wellness Immortal', 'Wellness Immortal', 'Wellness Immortal', 'Wellness Immortal', 'Wellness Immortal',
]

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-step', name: 'First Step', emoji: '👣', description: 'Complete your first habit' },
  { id: 'week-warrior', name: '7-Day Warrior', emoji: '🔥', description: 'Maintain a 7-day streak on any habit' },
  { id: 'monthly-champion', name: '30-Day Champion', emoji: '🏆', description: 'Maintain a 30-day streak on any habit' },
  { id: 'century-streak', name: 'Century Club', emoji: '💯', description: 'Reach a 100-day streak' },
  { id: 'early-bird', name: 'Early Bird', emoji: '🐦', description: 'Complete 7 morning habits in a row' },
  { id: 'night-owl', name: 'Night Owl', emoji: '🦉', description: 'Complete 7 evening habits in a row' },
  { id: 'triple-threat', name: 'Triple Threat', emoji: '⚡', description: 'Complete 3 habits on the same day' },
  { id: 'perfect-week', name: 'Perfect Week', emoji: '✨', description: 'Complete all habits for 7 days straight' },
  { id: 'centurion', name: 'Centurion', emoji: '🎖️', description: 'Log 100 total habit completions' },
  { id: 'collector', name: 'Collector', emoji: '🗂️', description: 'Add 5 or more habits' },
  { id: 'veteran', name: 'Veteran', emoji: '🎗️', description: 'Reach 66 days on any habit (avg formation time per Lally 2010)' },
  { id: 'tiny-habits', name: 'Tiny Habits Pioneer', emoji: '🌱', description: 'Complete 5 consecutive days using tiny version' },
  { id: 'level-5', name: 'Rising Star', emoji: '⭐', description: 'Reach Level 5' },
  { id: 'level-10', name: 'Top 10', emoji: '🌟', description: 'Reach Level 10' },
  { id: 'level-20', name: 'Elite', emoji: '💫', description: 'Reach Level 20' },
  { id: 'morning-master', name: 'Morning Master', emoji: '🌅', description: 'Complete all morning habits for 14 days' },
  { id: 'social-butterfly', name: 'Social Butterfly', emoji: '🦋', description: 'Complete 10 social habits' },
  { id: 'fitness-fiend', name: 'Fitness Fiend', emoji: '💪', description: 'Complete 30 fitness habits' },
  { id: 'mindful-month', name: 'Mindful Month', emoji: '🧘', description: 'Complete 30 mental habits' },
  { id: 'xp-500', name: 'XP Grinder', emoji: '🎮', description: 'Earn 500 total XP' },
  { id: 'xp-5000', name: 'XP Master', emoji: '👑', description: 'Earn 5000 total XP' },
  { id: 'comeback-kid', name: 'Comeback Kid', emoji: '🔄', description: 'Resume a habit after missing 3+ days' },
]

export function isHabitDueToday(habit: Habit, today: Date): boolean {
  const dayOfWeek = today.getDay() // 0=Sun, 1=Mon, ..., 6=Sat

  if (habit.frequency === 'daily') return true

  if (habit.frequency === 'weekdays') {
    return dayOfWeek >= 1 && dayOfWeek <= 5
  }

  if (habit.frequency === 'custom' && habit.custom_days?.length) {
    return habit.custom_days.includes(dayOfWeek)
  }

  return true
}

export function getTodayHabits(habits: Habit[], today: Date): Habit[] {
  return habits.filter(h => h.is_active && isHabitDueToday(h, today))
}

export function calculateStreak(
  logs: HabitLog[],
  frequency: Habit['frequency'],
  custom_days?: number[]
): HabitStreak {
  const completedDates = new Set(
    logs.filter(l => !l.skipped).map(l => l.completed_at.slice(0, 10))
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Calculate which days the habit was due (last 100 days)
  function isDue(date: Date): boolean {
    const dow = date.getDay()
    if (frequency === 'daily') return true
    if (frequency === 'weekdays') return dow >= 1 && dow <= 5
    if (frequency === 'custom' && custom_days?.length) return custom_days.includes(dow)
    return true
  }

  function dateKey(d: Date): string {
    return d.toISOString().slice(0, 10)
  }

  // Current streak — walk backwards from today
  let current = 0
  const cursor = new Date(today)
  while (true) {
    if (isDue(cursor)) {
      if (completedDates.has(dateKey(cursor))) {
        current++
      } else {
        // If today is not yet logged, skip today and check yesterday
        if (dateKey(cursor) === dateKey(today)) {
          cursor.setDate(cursor.getDate() - 1)
          continue
        }
        break
      }
    }
    cursor.setDate(cursor.getDate() - 1)
    if (current > 0 && current > 200) break // safety cap
    // Stop after going back 200 days to prevent infinite loop
    const daysBack = Math.floor((today.getTime() - cursor.getTime()) / 86400000)
    if (daysBack > 200) break
  }

  // Best streak — walk all 100 days
  let best = 0
  let runningBest = 0
  const allCursor = new Date(today)
  for (let i = 0; i < 100; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    if (isDue(d)) {
      if (completedDates.has(dateKey(d))) {
        runningBest++
        if (runningBest > best) best = runningBest
      } else {
        runningBest = 0
      }
    }
  }
  if (current > best) best = current

  const total_completions = completedDates.size

  // 7-day completion rate
  let due7 = 0, done7 = 0
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    if (isDue(d)) {
      due7++
      if (completedDates.has(dateKey(d))) done7++
    }
  }
  const completion_rate_7d = due7 > 0 ? Math.round((done7 / due7) * 100) : 0

  // 30-day completion rate
  let due30 = 0, done30 = 0
  for (let i = 0; i < 30; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    if (isDue(d)) {
      due30++
      if (completedDates.has(dateKey(d))) done30++
    }
  }
  const completion_rate_30d = due30 > 0 ? Math.round((done30 / due30) * 100) : 0

  void allCursor

  return { current, best, total_completions, completion_rate_7d, completion_rate_30d }
}

export function calculateLevel(total_xp: number): UserLevel {
  let level = 1
  for (let i = LEVEL_XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (total_xp >= LEVEL_XP_THRESHOLDS[i]) {
      level = i + 1
      break
    }
  }
  level = Math.min(level, 50)

  const xp_to_next =
    level < 50
      ? LEVEL_XP_THRESHOLDS[level] - total_xp
      : 0

  return {
    total_xp,
    level,
    level_name: LEVEL_NAMES[level - 1] ?? 'Wellness Immortal',
    xp_to_next,
    achievements: [],
  }
}

export function checkAchievements(
  habits: Habit[],
  logs: HabitLog[],
  existing: Achievement[]
): Achievement[] {
  const existingIds = new Set(existing.map(a => a.id))
  const newAchievements: Achievement[] = []

  function unlock(id: string) {
    if (existingIds.has(id)) return
    const tmpl = ACHIEVEMENTS.find(a => a.id === id)
    if (tmpl) {
      existingIds.add(id)
      newAchievements.push({ ...tmpl, unlocked_at: new Date().toISOString() })
    }
  }

  const completedLogs = logs.filter(l => !l.skipped)
  const totalCompletions = completedLogs.length

  // First step
  if (totalCompletions >= 1) unlock('first-step')

  // 100 total completions
  if (totalCompletions >= 100) unlock('centurion')

  // 5+ habits added
  if (habits.length >= 5) unlock('collector')

  // Triple threat: 3 habits on same day
  const byDate: Record<string, number> = {}
  for (const l of completedLogs) {
    const d = l.completed_at.slice(0, 10)
    byDate[d] = (byDate[d] || 0) + 1
  }
  if (Object.values(byDate).some(v => v >= 3)) unlock('triple-threat')

  // XP milestones
  const totalXp = completedLogs.reduce((s, l) => s + (l.xp_earned || 10), 0)
  if (totalXp >= 500) unlock('xp-500')
  if (totalXp >= 5000) unlock('xp-5000')

  // Level achievements
  const lvl = calculateLevel(totalXp)
  if (lvl.level >= 5) unlock('level-5')
  if (lvl.level >= 10) unlock('level-10')
  if (lvl.level >= 20) unlock('level-20')

  // Streak achievements per habit
  for (const habit of habits) {
    const habitLogs = logs.filter(l => l.habit_id === habit.id)
    const streak = calculateStreak(habitLogs, habit.frequency, habit.custom_days)
    if (streak.current >= 7) unlock('week-warrior')
    if (streak.current >= 30) unlock('monthly-champion')
    if (streak.current >= 66) unlock('veteran')
    if (streak.current >= 100) unlock('century-streak')

    // Early bird / night owl
    if (habit.time_of_day === 'morning' && streak.current >= 7) unlock('early-bird')
    if (habit.time_of_day === 'evening' && streak.current >= 7) unlock('night-owl')
  }

  // Fitness completions
  const fitnessCount = completedLogs.filter(l => {
    const h = habits.find(h => h.id === l.habit_id)
    return h?.category === 'fitness'
  }).length
  if (fitnessCount >= 30) unlock('fitness-fiend')

  // Mental completions
  const mentalCount = completedLogs.filter(l => {
    const h = habits.find(h => h.id === l.habit_id)
    return h?.category === 'mental'
  }).length
  if (mentalCount >= 30) unlock('mindful-month')

  // Social completions
  const socialCount = completedLogs.filter(l => {
    const h = habits.find(h => h.id === l.habit_id)
    return h?.category === 'social'
  }).length
  if (socialCount >= 10) unlock('social-butterfly')

  return newAchievements
}
