import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

/**
 * Check Achievements Edge Function
 *
 * Evaluates milestone conditions and grants new achievements to a user.
 * Called after each health data sync from the iOS app.
 *
 * POST body: { userId: string }
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "https://getzen.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface Achievement {
  type: string
  title: string
  description: string
  icon: string
}

// All possible achievements
const ALL_ACHIEVEMENTS: Record<string, Omit<Achievement, "type">> = {
  // Onboarding
  first_sync: {
    title: "First Sync",
    description: "Connected Apple Health and synced your first data.",
    icon: "🔗",
  },

  // Steps milestones
  steps_10k_first: {
    title: "10,000 Steps",
    description: "Hit 10,000 steps in a single day for the first time.",
    icon: "👟",
  },
  steps_20k_first: {
    title: "20,000 Steps",
    description: "Crushed 20,000 steps in a single day.",
    icon: "🚀",
  },
  steps_streak_7: {
    title: "Step Streak: 7 Days",
    description: "Hit your step goal 7 days in a row.",
    icon: "🔥",
  },
  steps_streak_30: {
    title: "Step Streak: 30 Days",
    description: "Hit your step goal 30 days in a row. Unstoppable!",
    icon: "⚡",
  },
  steps_million: {
    title: "Million Steps",
    description: "Walked over 1,000,000 total steps tracked in GetZen.",
    icon: "🌍",
  },

  // Workouts
  workout_first: {
    title: "First Workout",
    description: "Logged your first workout.",
    icon: "💪",
  },
  workout_10: {
    title: "10 Workouts",
    description: "Completed 10 workouts.",
    icon: "🏅",
  },
  workout_50: {
    title: "50 Workouts",
    description: "50 workouts in the books. Serious dedication!",
    icon: "🥈",
  },
  workout_100: {
    title: "100 Workouts",
    description: "100 workouts! You're a machine.",
    icon: "🥇",
  },
  workout_streak_7: {
    title: "Active Week",
    description: "Worked out every day for 7 days straight.",
    icon: "🏋️",
  },

  // Sleep
  sleep_8h: {
    title: "Golden Sleep",
    description: "Got 8+ hours of sleep for the first time.",
    icon: "😴",
  },
  sleep_streak_7: {
    title: "Sleep Champion",
    description: "Averaged 7+ hours of sleep for 7 consecutive days.",
    icon: "🌙",
  },

  // HRV & Recovery
  hrv_50: {
    title: "HRV 50+",
    description: "Achieved an HRV reading above 50ms.",
    icon: "💓",
  },
  hrv_70: {
    title: "HRV Elite",
    description: "Achieved an HRV reading above 70ms.",
    icon: "🫀",
  },
  recovery_90: {
    title: "Peak Recovery",
    description: "Hit a recovery score of 90% or higher.",
    icon: "🌟",
  },

  // Fasting
  fast_16h_first: {
    title: "16-Hour Fast",
    description: "Completed your first 16-hour fast.",
    icon: "⏱️",
  },
  fast_24h_first: {
    title: "24-Hour Fast",
    description: "Completed a full 24-hour fast. Iron willpower!",
    icon: "🏆",
  },
  fast_10_completed: {
    title: "Fasting Veteran",
    description: "Completed 10 fasting sessions.",
    icon: "🎯",
  },

  // Habits
  habit_streak_7: {
    title: "Habit Streak: 7 Days",
    description: "Completed all daily habits for 7 days in a row.",
    icon: "✅",
  },
  habit_streak_30: {
    title: "Habit Master",
    description: "Maintained all habits for 30 consecutive days.",
    icon: "🏛️",
  },

  // Water
  water_7_streak: {
    title: "Hydration Habit",
    description: "Hit your water goal 7 days in a row.",
    icon: "💧",
  },

  // Check-in
  checkin_first: {
    title: "Self-Aware",
    description: "Completed your first daily check-in.",
    icon: "📋",
  },
  checkin_streak_30: {
    title: "Mindful Month",
    description: "Logged your energy, mood, and stress for 30 days straight.",
    icon: "🧘",
  },

  // Additional step milestones
  step_streak_3: {
    title: "3-Day Streak",
    description: "3 consecutive days hitting your step goal.",
    icon: "🔥",
  },
  goal_getter: {
    title: "Goal Getter",
    description: "Hit your step goal at least once.",
    icon: "🎯",
  },
  ten_thousander: {
    title: "Ten-Thousander",
    description: "Walked 10,000+ steps in a single day.",
    icon: "💪",
  },

  // Additional sleep achievements
  first_sleep: {
    title: "Rest Tracked",
    description: "Had sleep data recorded in GetZen.",
    icon: "😴",
  },
  quality_sleep: {
    title: "Quality Sleep",
    description: "Averaged 7+ hours of sleep per night.",
    icon: "🌙",
  },
  sleep_30: {
    title: "Sleep Veteran",
    description: "30+ nights of sleep tracked with 7h+ average.",
    icon: "🏆",
  },

  // Additional HRV achievements
  hrv_tracking: {
    title: "HRV Tracker",
    description: "Recorded HRV data for 7+ days.",
    icon: "💗",
  },
  recovery_star: {
    title: "Recovery Star",
    description: "HRV above personal baseline on 10+ of last 30 days.",
    icon: "🌟",
  },
  baseline_beater: {
    title: "Baseline Beater",
    description: "HRV above baseline on 20+ of last 30 days.",
    icon: "🏆",
  },

  // Additional activity achievements
  calorie_burner: {
    title: "Calorie Burner",
    description: "Burned 400+ active calories in a single day.",
    icon: "🔥",
  },
  high_energy: {
    title: "High Energy",
    description: "Burned 600+ active calories in a day (10+ times).",
    icon: "⚡",
  },
  calorie_legend: {
    title: "Calorie Legend",
    description: "Burned 1,000+ active calories in a single day.",
    icon: "🌋",
  },
  data_champion: {
    title: "Data Champion",
    description: "Tracked health data for 200+ days — fully committed to your health journey.",
    icon: "🌟",
  },

  // Additional data tracking achievements
  serial_syncer: {
    title: "Serial Syncer",
    description: "Synced 100 days of health data.",
    icon: "📡",
  },
  year_in_data: {
    title: "Year in Data",
    description: "Synced 365 days of health data — a full picture of your health.",
    icon: "📊",
  },

  // Additional workout achievements
  regular: {
    title: "Regular",
    description: "20+ workout days in the past year.",
    icon: "📅",
  },
  dedicated: {
    title: "Dedicated",
    description: "50+ workout days in the past year.",
    icon: "🔥",
  },
  runner: {
    title: "Runner",
    description: "Completed 10+ running workouts.",
    icon: "🏃",
  },
  calorie_crusher: {
    title: "Calorie Crusher",
    description: "Burned 500+ active calories in a single workout.",
    icon: "🔥",
  },
  iron_person: {
    title: "Iron Person",
    description: "20+ strength training sessions in the past year.",
    icon: "🦾",
  },
  distance_runner: {
    title: "Distance Explorer",
    description: "Covered 500+ km total across all workouts.",
    icon: "🗺️",
  },
  century_workouts: {
    title: "Century Club",
    description: "Logged 100+ workout days in the past year.",
    icon: "🌟",
  },

  // Balance achievements
  balanced_gold: {
    title: "Balanced Life — Gold",
    description: "10+ days hitting steps, sleep, and HRV goals simultaneously.",
    icon: "⚖️",
  },
  balanced_legendary: {
    title: "Balanced Life — Legendary",
    description: "30+ days of perfect balance: steps, sleep, and HRV all above target.",
    icon: "🌟",
  },
}

async function checkAndGrant(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  existing: Set<string>
): Promise<string[]> {
  const newlyGranted: string[] = []

  async function grant(type: string) {
    if (existing.has(type)) return
    const def = ALL_ACHIEVEMENTS[type]
    if (!def) return
    const { error } = await supabase.from("user_achievements").insert({
      user_id: userId,
      achievement_type: type,
      title: def.title,
      description: def.description,
      icon: def.icon,
    })
    if (!error) {
      existing.add(type)
      newlyGranted.push(type)
    }
  }

  // ── Daily summaries ─────────────────────────────────────────────────────────
  const { data: summaries } = await supabase
    .from("daily_summaries")
    .select("date, steps, sleep_duration_minutes, avg_hrv, recovery_score, active_calories")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(90)

  const s = summaries ?? []

  // First sync
  if (s.length > 0) await grant("first_sync")

  // Steps milestones
  const maxSteps = s.reduce((m, r) => Math.max(m, r.steps ?? 0), 0)
  if (maxSteps >= 10000) await grant("steps_10k_first")
  if (maxSteps >= 20000) await grant("steps_20k_first")

  // Step streak (assuming step goal is 10k for simplicity)
  const { data: profile } = await supabase
    .from("users")
    .select("step_goal")
    .eq("id", userId)
    .single()
  const stepGoal = profile?.step_goal ?? 10000

  let stepStreak = 0
  for (const row of s) {
    if ((row.steps ?? 0) >= stepGoal) stepStreak++
    else break
  }
  if (stepStreak >= 3) await grant("step_streak_3")
  if (stepStreak >= 7) await grant("steps_streak_7")
  if (stepStreak >= 30) await grant("steps_streak_30")

  // Total steps (requires all-time data — use 90-day as proxy)
  const totalSteps = s.reduce((acc, r) => acc + (r.steps ?? 0), 0)
  if (totalSteps >= 1_000_000) await grant("steps_million")
  
  // Goal getter - hit step goal at least once
  if (stepStreak >= 1 || s.some((row) => (row.steps ?? 0) >= stepGoal)) {
    await grant("goal_getter")
  }
  
  // Ten thousander - single day 10k+ steps
  if (maxSteps >= 10000) await grant("ten_thousander")

  // Sleep
  const maxSleep = s.reduce((m, r) => Math.max(m, r.sleep_duration_minutes ?? 0), 0)
  const sleepDaysTotal = s.filter((r) => (r.sleep_duration_minutes ?? 0) >= 420).length
  
  if (sleepDaysTotal >= 1) await grant("first_sleep")
  if (maxSleep >= 480) await grant("sleep_8h")
  if (sleepDaysTotal >= 30) await grant("sleep_30")
  
  // Quality sleep - average 7+ hours
  const avgSleep = s.length > 0 
    ? s.reduce((acc, r) => acc + (r.sleep_duration_minutes ?? 0), 0) / s.length 
    : 0
  if (avgSleep >= 420) await grant("quality_sleep")

  let sleepStreak = 0
  for (const row of s) {
    if ((row.sleep_duration_minutes ?? 0) >= 420) sleepStreak++ // 7h
    else break
  }
  if (sleepStreak >= 7) await grant("sleep_streak_7")

  // HRV
  const hrvDays = s.filter((r) => (r.avg_hrv ?? 0) > 0)
  const maxHRV = s.reduce((m, r) => Math.max(m, r.avg_hrv ?? 0), 0)
  
  if (hrvDays.length >= 7) await grant("hrv_tracking")
  if (maxHRV >= 50) await grant("hrv_50")
  if (maxHRV >= 70) await grant("hrv_70")
  
  // HRV baseline beater - check last 30 days
  const last30 = s.slice(0, 30)
  const baseline28 = last30.slice(8, 30)
  const baselineAvg = baseline28.length > 0
    ? baseline28.reduce((acc, r) => acc + (r.avg_hrv ?? 0), 0) / baseline28.length
    : 0
  const aboveBaselineDays = last30.filter((r) => baselineAvg > 0 && (r.avg_hrv ?? 0) > baselineAvg).length
  if (aboveBaselineDays >= 10) await grant("recovery_star")
  if (aboveBaselineDays >= 20) await grant("baseline_beater")

  // Recovery
  const maxRecovery = s.reduce((m, r) => Math.max(m, r.recovery_score ?? 0), 0)
  if (maxRecovery >= 90) await grant("recovery_90")

  // ── Activity ─────────────────────────────────────────────────────────────────
  const maxDayCals = s.reduce((m, r) => Math.max(m, r.active_calories ?? 0), 0)
  const highCalDays = s.filter((r) => (r.active_calories ?? 0) >= 600).length
  
  if (maxDayCals >= 400) await grant("calorie_burner")
  if (highCalDays >= 10) await grant("high_energy")
  if (maxDayCals >= 1000) await grant("calorie_legend")
  if (s.length >= 200) await grant("data_champion")
  if (s.length >= 100) await grant("serial_syncer")
  if (s.length >= 365) await grant("year_in_data")
  
  // Balance achievements - days hitting steps, sleep, and HRV all above target
  const medianHrv = (() => {
    const hrvValues = hrvDays
      .map(r => r.avg_hrv)
      .filter((v): v is number => v !== null && v > 0)
      .sort((a, b) => a - b)
    if (!hrvValues.length) return 0
    const mid = Math.floor(hrvValues.length / 2)
    return hrvValues.length % 2 !== 0 ? hrvValues[mid] : (hrvValues[mid - 1] + hrvValues[mid]) / 2
  })()
  
  const balancedDays = s.filter(row =>
    (row.steps ?? 0) >= 8000 &&
    (row.sleep_duration_minutes ?? 0) >= 420 &&
    (row.avg_hrv ?? 0) >= medianHrv
  ).length
  
  if (balancedDays >= 10) await grant("balanced_gold")
  if (balancedDays >= 30) await grant("balanced_legendary")

  // ── Workouts ────────────────────────────────────────────────────────────────
  const { data: allWorkouts } = await supabase
    .from("workout_records")
    .select("start_time, workout_type, active_calories, distance_meters")
    .eq("user_id", userId)

  const allWo = allWorkouts ?? []
  const { count: workoutCount } = await supabase
    .from("workout_records")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gt("duration_minutes", 10)

  const wc = workoutCount ?? 0
  if (wc >= 1) await grant("workout_first")
  if (wc >= 10) await grant("workout_10")
  if (wc >= 50) await grant("workout_50")
  if (wc >= 100) await grant("workout_100")

  // Additional workout metrics
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString()
  const yearWorkouts = allWo.filter((w) => w.start_time >= oneYearAgo)
  const totalWorkoutDays = new Set(yearWorkouts.map((w) => w.start_time.slice(0, 10))).size
  const runs = yearWorkouts.filter((w) => w.workout_type?.toLowerCase().includes('run'))
  const strengthSessions = yearWorkouts.filter((w) =>
    ['strength', 'functional', 'traditional'].some((t) => w.workout_type?.toLowerCase().includes(t))
  )
  const maxCalWorkout = allWo.reduce((m, w) => Math.max(m, w.active_calories ?? 0), 0)
  const totalDistanceKm = allWo.reduce((s, w) => s + (w.distance_meters ?? 0), 0) / 1000

  if (totalWorkoutDays >= 20) await grant("regular")
  if (totalWorkoutDays >= 50) await grant("dedicated")
  if (runs.length >= 10) await grant("runner")
  if (maxCalWorkout >= 500) await grant("calorie_crusher")
  if (strengthSessions.length >= 20) await grant("iron_person")
  if (totalDistanceKm >= 500) await grant("distance_runner")
  if (totalWorkoutDays >= 100) await grant("century_workouts")

  // Workout streak (7 consecutive days with any workout)
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  const { data: recentWorkouts } = await supabase
    .from("workout_records")
    .select("start_time")
    .eq("user_id", userId)
    .gte("start_time", weekAgo)
    .gt("duration_minutes", 10)
  const workoutDays = new Set((recentWorkouts ?? []).map((w) => w.start_time.slice(0, 10)))
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - i * 24 * 3600 * 1000)
    return d.toISOString().slice(0, 10)
  })
  if (last7Days.every((d) => workoutDays.has(d))) await grant("workout_streak_7")

  // ── Fasting ─────────────────────────────────────────────────────────────────
  const { data: fastingSessions } = await supabase
    .from("fasting_sessions")
    .select("actual_hours, completed")
    .eq("user_id", userId)
    .eq("completed", true)

  const fs = fastingSessions ?? []
  const completedFasts = fs.length

  if (completedFasts >= 1 && fs.some((f) => (f.actual_hours ?? 0) >= 15.5)) {
    await grant("fast_16h_first")
  }
  if (fs.some((f) => (f.actual_hours ?? 0) >= 23.5)) await grant("fast_24h_first")
  if (completedFasts >= 10) await grant("fast_10_completed")

  // ── Water ───────────────────────────────────────────────────────────────────
  const { data: waterSettings } = await supabase
    .from("user_nutrition_settings")
    .select("water_target_ml")
    .eq("user_id", userId)
    .single()
  const waterGoal = waterSettings?.water_target_ml ?? 2500

  const { data: waterLogs } = await supabase
    .from("daily_water")
    .select("date, total_ml")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(30)

  let waterStreak = 0
  for (const row of (waterLogs ?? [])) {
    if ((row.total_ml ?? 0) >= waterGoal) waterStreak++
    else break
  }
  if (waterStreak >= 7) await grant("water_7_streak")

  // ── Check-ins ───────────────────────────────────────────────────────────────
  const { count: checkinCount } = await supabase
    .from("daily_checkins")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)

  if ((checkinCount ?? 0) >= 1) await grant("checkin_first")

  const { data: checkins } = await supabase
    .from("daily_checkins")
    .select("date")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(31)

  let checkinStreak = 0
  for (const row of (checkins ?? [])) {
    checkinStreak++
    // Break if gap detected (checking consecutive days)
    if (checkinStreak === 1) continue
    const prev = checkins![(checkins ?? []).indexOf(row) - 1]
    if (prev) {
      const diff = (new Date(prev.date).getTime() - new Date(row.date).getTime()) / (1000 * 3600 * 24)
      if (diff > 1) break
    }
  }
  if (checkinStreak >= 30) await grant("checkin_streak_30")

  return newlyGranted
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: CORS_HEADERS })
    }

    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      })
    }

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""))
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      })
    }
    const userId = user.id

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // Load existing achievements
    const { data: existing } = await supabase
      .from("user_achievements")
      .select("achievement_type")
      .eq("user_id", userId)

    const existingSet = new Set((existing ?? []).map((a: { achievement_type: string }) => a.achievement_type))
    const newlyGranted = await checkAndGrant(supabase, userId, existingSet)

    return new Response(
      JSON.stringify({ newly_granted: newlyGranted, total_checked: Object.keys(ALL_ACHIEVEMENTS).length }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    )
  } catch (err) {
    console.error('check-achievements error:', err instanceof Error ? err.message : 'Unknown')
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
