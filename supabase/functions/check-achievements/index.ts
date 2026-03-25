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
  "Access-Control-Allow-Origin": "*",
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
    description: "Walked over 1,000,000 total steps tracked in KQuarks.",
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
  if (stepStreak >= 7) await grant("steps_streak_7")
  if (stepStreak >= 30) await grant("steps_streak_30")

  // Total steps (requires all-time data — use 90-day as proxy)
  const totalSteps = s.reduce((acc, r) => acc + (r.steps ?? 0), 0)
  if (totalSteps >= 1_000_000) await grant("steps_million")

  // Sleep
  const maxSleep = s.reduce((m, r) => Math.max(m, r.sleep_duration_minutes ?? 0), 0)
  if (maxSleep >= 480) await grant("sleep_8h")

  let sleepStreak = 0
  for (const row of s) {
    if ((row.sleep_duration_minutes ?? 0) >= 420) sleepStreak++ // 7h
    else break
  }
  if (sleepStreak >= 7) await grant("sleep_streak_7")

  // HRV
  const maxHRV = s.reduce((m, r) => Math.max(m, r.avg_hrv ?? 0), 0)
  if (maxHRV >= 50) await grant("hrv_50")
  if (maxHRV >= 70) await grant("hrv_70")

  // Recovery
  const maxRecovery = s.reduce((m, r) => Math.max(m, r.recovery_score ?? 0), 0)
  if (maxRecovery >= 90) await grant("recovery_90")

  // ── Workouts ────────────────────────────────────────────────────────────────
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
