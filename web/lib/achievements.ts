export const XP_ACTIONS: Record<string, number> = {
  food_scan: 10,
  cosmetics_scan: 10,
  habit_complete: 15,
  journal_entry: 20,
  steps_goal_met: 25,
  sleep_goal_met: 25,
  water_goal_met: 15,
  workout_logged: 30,
  symptom_logged: 10,
  cycle_logged: 10,
  medication_logged: 5,
  scan_favorite: 5,
  profile_completed: 50,
  first_scan: 25,
}

export const LEVELS = [
  { level: 1, name: 'Health Novice',      minXP: 0 },
  { level: 2, name: 'Health Apprentice',  minXP: 200 },
  { level: 3, name: 'Health Practitioner',minXP: 600 },
  { level: 4, name: 'Health Expert',      minXP: 1500 },
  { level: 5, name: 'Health Master',      minXP: 3500 },
  { level: 6, name: 'Health Legend',      minXP: 7500 },
]

export interface Achievement {
  key: string
  name: string
  description: string
  icon: string
  xpReward: number
  category: 'scanning' | 'fitness' | 'nutrition' | 'consistency' | 'milestones'
}

export const ACHIEVEMENTS: Achievement[] = [
  // Scanning
  { key: 'first_scan',          name: 'First Scan',          description: 'Scan your first product',              icon: '🔍', xpReward: 25,  category: 'scanning' },
  { key: 'scan_10',             name: 'Scanner',             description: 'Scan 10 products',                    icon: '📱', xpReward: 50,  category: 'scanning' },
  { key: 'scan_50',             name: 'Label Reader',        description: 'Scan 50 products',                    icon: '🏷️', xpReward: 100, category: 'scanning' },
  { key: 'scan_100',            name: 'Ingredient Expert',   description: 'Scan 100 products',                   icon: '🧪', xpReward: 200, category: 'scanning' },
  { key: 'cosmetics_scan_1',    name: 'Beauty Check',        description: 'Scan your first cosmetic product',    icon: '🧴', xpReward: 25,  category: 'scanning' },
  { key: 'found_a_plus',        name: 'Clean Eater',         description: 'Find a product with A+ ZenScore',   icon: '🌿', xpReward: 30,  category: 'scanning' },
  // Fitness
  { key: 'first_workout',       name: 'First Steps',         description: 'Log your first workout',              icon: '🏃', xpReward: 25,  category: 'fitness' },
  { key: 'workout_7',           name: 'Week Warrior',        description: 'Log 7 workouts',                      icon: '💪', xpReward: 75,  category: 'fitness' },
  { key: 'steps_10k',           name: '10K Club',            description: 'Hit 10,000 steps in a day',           icon: '👟', xpReward: 50,  category: 'fitness' },
  { key: 'steps_10k_7',         name: 'Step Streak',         description: 'Hit 10,000 steps 7 days in a row',    icon: '🔥', xpReward: 150, category: 'fitness' },
  // Nutrition
  { key: 'water_goal_3',        name: 'Hydrated',            description: 'Meet water goal 3 days in a row',     icon: '💧', xpReward: 50,  category: 'nutrition' },
  { key: 'journal_3',           name: 'Mindful Eater',       description: 'Log meals 3 days in a row',           icon: '🥗', xpReward: 50,  category: 'nutrition' },
  // Consistency
  { key: 'streak_7',            name: 'Week Streak',         description: 'Use the app 7 days in a row',         icon: '📅', xpReward: 75,  category: 'consistency' },
  { key: 'streak_30',           name: 'Month Strong',        description: 'Use the app 30 days in a row',        icon: '🗓️', xpReward: 300, category: 'consistency' },
  { key: 'streak_100',          name: 'Centurion',           description: 'Use the app 100 days in a row',       icon: '💯', xpReward: 1000,category: 'consistency' },
  { key: 'habit_complete_7',    name: 'Habit Builder',       description: 'Complete habits 7 days in a row',     icon: '✅', xpReward: 100, category: 'consistency' },
  { key: 'journal_7',           name: 'Journaling Streak',   description: 'Write in journal 7 days in a row',    icon: '📓', xpReward: 100, category: 'consistency' },
  // Milestones
  { key: 'profile_complete',    name: 'All Set Up',          description: 'Complete your health profile',        icon: '⚙️', xpReward: 50,  category: 'milestones' },
  { key: 'first_insight',       name: 'Curious Mind',        description: 'View your first AI insight',          icon: '🤖', xpReward: 25,  category: 'milestones' },
  { key: 'xp_500',              name: 'Rising Star',         description: 'Earn 500 XP',                        icon: '⭐', xpReward: 50,  category: 'milestones' },
  { key: 'xp_2000',             name: 'Health Champion',     description: 'Earn 2000 XP',                       icon: '🏆', xpReward: 100, category: 'milestones' },
  { key: 'level_3',             name: 'Practitioner',        description: 'Reach Level 3',                      icon: '🎖️', xpReward: 100, category: 'milestones' },
  { key: 'level_5',             name: 'Master',              description: 'Reach Level 5',                      icon: '👑', xpReward: 500, category: 'milestones' },
]

export function getLevelInfo(totalXP: number) {
  let current = LEVELS[0]
  let next = LEVELS[1]
  for (let i = 0; i < LEVELS.length; i++) {
    if (totalXP >= LEVELS[i].minXP) {
      current = LEVELS[i]
      next = LEVELS[i + 1] ?? null
    }
  }
  const progressToNext = next
    ? Math.round(((totalXP - current.minXP) / (next.minXP - current.minXP)) * 100)
    : 100
  return { current, next, progressToNext, totalXP }
}
