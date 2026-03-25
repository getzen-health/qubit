import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

/**
 * Daily Insights Cron Function
 *
 * Scheduled to run at 6am UTC via pg_cron.
 * Auto-generates AI health insights for all users who synced in the last 48h
 * and haven't had insights generated in the past 18h.
 *
 * Setup (Supabase Dashboard → SQL Editor):
 *   SELECT cron.schedule(
 *     'daily-health-insights',
 *     '0 6 * * *',
 *     $$
 *     SELECT net.http_post(
 *       url := '<YOUR_SUPABASE_URL>/functions/v1/daily-insights-cron',
 *       headers := jsonb_build_object(
 *         'Authorization', 'Bearer <YOUR_SERVICE_ROLE_KEY>',
 *         'Content-Type', 'application/json'
 *       ),
 *       body := '{}'::jsonb
 *     ) AS request_id;
 *     $$
 *   );
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const MAX_USERS_PER_RUN = 50
const DELAY_MS_BETWEEN_USERS = 200

interface DailySummary {
  date: string
  steps: number | null
  active_calories: number | null
  distance_meters: number | null
  resting_heart_rate: number | null
  avg_hrv: number | null
  sleep_duration_minutes: number | null
  recovery_score: number | null
}

interface WorkoutRecord {
  workout_type: string
  duration_minutes: number | null
  active_calories: number | null
  avg_heart_rate: number | null
}

interface SleepRecord {
  duration_minutes: number | null
  deep_minutes: number | null
  rem_minutes: number | null
  core_minutes: number | null
  awake_minutes: number | null
}

interface InsightResult {
  category: string
  title: string
  content: string
  priority: "high" | "normal" | "low"
}

interface CheckinRecord {
  date: string
  energy: number | null
  mood: number | null
  stress: number | null
  notes: string | null
}

function buildPrompt(
  today: DailySummary,
  history: DailySummary[],
  workouts: WorkoutRecord[],
  sleep: SleepRecord[],
  checkins: CheckinRecord[]
): string {
  const sleepStr = (s: SleepRecord) =>
    `${((s.duration_minutes ?? 0) / 60).toFixed(1)}h total, ${s.deep_minutes ?? 0}m deep, ${s.rem_minutes ?? 0}m REM`

  const historyAvg = (key: keyof DailySummary) => {
    const vals = history.map((d) => d[key] as number | null).filter((v) => v != null) as number[]
    return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
  }

  const energyLabels = ["", "Very Low", "Low", "Moderate", "Good", "Great"]
  const moodLabels = ["", "Very Low", "Low", "Neutral", "Good", "Excellent"]
  const stressLabels = ["", "None", "Mild", "Moderate", "High", "Very High"]

  const recentCheckin = checkins[0]
  const checkinStr = recentCheckin
    ? `Energy: ${recentCheckin.energy != null ? energyLabels[recentCheckin.energy] : "N/A"} (${recentCheckin.energy ?? "?"}/5), ` +
      `Mood: ${recentCheckin.mood != null ? moodLabels[recentCheckin.mood] : "N/A"} (${recentCheckin.mood ?? "?"}/5), ` +
      `Stress: ${recentCheckin.stress != null ? stressLabels[recentCheckin.stress] : "N/A"} (${recentCheckin.stress ?? "?"}/5)` +
      (recentCheckin.notes ? ` — Note: "${recentCheckin.notes}"` : "")
    : "No recent check-in"

  const avgEnergy = checkins.length > 0
    ? (checkins.map((c) => c.energy).filter((v) => v != null) as number[]).reduce((a, b) => a + b, 0) / checkins.filter((c) => c.energy != null).length
    : null
  const avgMood = checkins.length > 0
    ? (checkins.map((c) => c.mood).filter((v) => v != null) as number[]).reduce((a, b) => a + b, 0) / checkins.filter((c) => c.mood != null).length
    : null
  const avgStress = checkins.length > 0
    ? (checkins.map((c) => c.stress).filter((v) => v != null) as number[]).reduce((a, b) => a + b, 0) / checkins.filter((c) => c.stress != null).length
    : null

  return `You are a health coach AI. Generate 3-5 concise, actionable health insights. Consider both objective health data and subjective wellbeing when they are both available.

TODAY (${today.date}):
- Steps: ${today.steps ?? "N/A"}
- Active calories: ${today.active_calories ?? "N/A"} kcal
- Distance: ${today.distance_meters ? ((today.distance_meters ?? 0) / 1000).toFixed(1) + "km" : "N/A"}
- Resting HR: ${today.resting_heart_rate ?? "N/A"} bpm
- HRV: ${today.avg_hrv ?? "N/A"} ms
- Sleep: ${today.sleep_duration_minutes ? ((today.sleep_duration_minutes ?? 0) / 60).toFixed(1) + "h" : "N/A"}
- Recovery: ${today.recovery_score ?? "N/A"}%

SUBJECTIVE WELLBEING:
- Latest check-in: ${checkinStr}
${avgEnergy != null ? `- 7-day avg energy: ${avgEnergy.toFixed(1)}/5, mood: ${avgMood?.toFixed(1) ?? "N/A"}/5, stress: ${avgStress?.toFixed(1) ?? "N/A"}/5` : ""}

WEEK AVERAGES (${history.length} days):
- Avg steps: ${historyAvg("steps") ?? "N/A"}
- Avg calories: ${historyAvg("active_calories") ?? "N/A"} kcal
- Avg HRV: ${historyAvg("avg_hrv") ?? "N/A"} ms
- Avg sleep: ${history.length > 0 ? ((historyAvg("sleep_duration_minutes") ?? 0) / 60).toFixed(1) + "h" : "N/A"}

RECENT WORKOUTS (${workouts.length}):
${workouts.slice(0, 3).map((w) => `- ${w.workout_type}: ${w.duration_minutes}min, ${w.active_calories ?? "?"}kcal, HR ${w.avg_heart_rate ?? "?"}bpm`).join("\n") || "No recent workouts"}

RECENT SLEEP (${sleep.length} nights):
${sleep.slice(0, 2).map(sleepStr).join("\n") || "No sleep data"}

Return ONLY a valid JSON array (no markdown, no explanation):
[{"category":"sleep|activity|heart|recovery|strain|wellbeing","title":"Short title under 60 chars","content":"2-3 sentence specific insight (100-200 chars)","priority":"high|normal|low"}]`
}

async function generateInsightsForUser(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  anthropicKey: string
): Promise<number> {
  const since14d = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString()
  const since7d = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10)

  const [{ data: summaries }, { data: workouts }, { data: sleep }, { data: checkins }] = await Promise.all([
    supabase
      .from("daily_summaries")
      .select("date,steps,active_calories,distance_meters,resting_heart_rate,avg_hrv,sleep_duration_minutes,recovery_score")
      .eq("user_id", userId)
      .gte("date", since7d)
      .order("date", { ascending: false })
      .limit(8),
    supabase
      .from("workout_records")
      .select("workout_type,duration_minutes,active_calories,avg_heart_rate")
      .eq("user_id", userId)
      .gte("start_time", since14d)
      .gt("duration_minutes", 10)
      .order("start_time", { ascending: false })
      .limit(5),
    supabase
      .from("sleep_records")
      .select("duration_minutes,deep_minutes,rem_minutes,core_minutes,awake_minutes")
      .eq("user_id", userId)
      .gte("start_time", since14d)
      .gt("duration_minutes", 60)
      .order("start_time", { ascending: false })
      .limit(3),
    supabase
      .from("daily_checkins")
      .select("date,energy,mood,stress,notes")
      .eq("user_id", userId)
      .gte("date", since7d)
      .order("date", { ascending: false })
      .limit(7),
  ])

  if (!summaries || summaries.length === 0) return 0

  const today = summaries[0]
  const history = summaries.slice(1)
  const prompt = buildPrompt(today, history, workouts ?? [], sleep ?? [], checkins ?? [])

  const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      signal: AbortSignal.timeout(25000),
    method: "POST",
    headers: {
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  })

  if (!aiRes.ok) return 0

  const aiData = await aiRes.json()
  const text: string = aiData.content?.[0]?.text ?? ""

  let insights: InsightResult[] = []
  try {
    const match = text.match(/\[[\s\S]*?\]/)
    if (match) insights = JSON.parse(match[0])
  } catch {
    // Could not parse JSON — skip this user
    return 0
  }

  if (insights.length === 0) return 0

  const today_date = new Date().toISOString().slice(0, 10)
  const rows = insights.slice(0, 5).map((ins) => ({
    user_id: userId,
    date: today_date,
    insight_type: "daily_cron",
    category: ins.category ?? "activity",
    title: ins.title ?? "Health Insight",
    content: ins.content ?? "",
    priority: ins.priority ?? "normal",
    ai_provider: "claude",
  }))

  const { error } = await supabase.from("health_insights").insert(rows)
  if (error) return 0
  return rows.length
}

Deno.serve(async (req: Request) => {
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

  // Verify JWT — reject forged/expired tokens
  const _supabaseAuth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!)
  const { data: { user: _jwtUser }, error: _jwtError } = await _supabaseAuth.auth.getUser(
    authHeader.replace("Bearer ", "")
  )
  if (_jwtError || !_jwtUser) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
  }

  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")
  if (!anthropicKey) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  // Find users who synced in the last 48h
  const since48h = new Date(Date.now() - 48 * 3600 * 1000).toISOString()
  const { data: activeDevices } = await supabaseAdmin
    .from("user_devices")
    .select("user_id")
    .gte("last_sync_at", since48h)

  if (!activeDevices || activeDevices.length === 0) {
    return new Response(
      JSON.stringify({ processed: 0, message: "No users synced recently" }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    )
  }

  // Deduplicate user IDs
  const allUserIds = [...new Set(activeDevices.map((d: { user_id: string }) => d.user_id))]

  // Skip users who already have insights generated in the last 18h
  const since18h = new Date(Date.now() - 18 * 3600 * 1000).toISOString()
  const { data: recentInsights } = await supabaseAdmin
    .from("health_insights")
    .select("user_id")
    .gte("created_at", since18h)
    .in("user_id", allUserIds)

  const alreadyProcessed = new Set(
    (recentInsights ?? []).map((i: { user_id: string }) => i.user_id)
  )
  const toProcess = allUserIds
    .filter((id) => !alreadyProcessed.has(id))
    .slice(0, MAX_USERS_PER_RUN)

  let totalInsights = 0
  let usersProcessed = 0
  let errors = 0

  for (const userId of toProcess) {
    try {
      const count = await generateInsightsForUser(supabaseAdmin, userId, anthropicKey)
      if (count > 0) {
        totalInsights += count
        usersProcessed++
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      const errorStack = err instanceof Error ? err.stack : undefined
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        error: 'Failed to generate insights',
        userId,
        message: errorMessage,
        stack: errorStack,
      }))
      errors++
    }

    // Brief delay to avoid Anthropic rate limits
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS_BETWEEN_USERS))
  }

  return new Response(
    JSON.stringify({
      run_at: new Date().toISOString(),
      active_users: allUserIds.length,
      already_had_insights: alreadyProcessed.size,
      processed: usersProcessed,
      insights_generated: totalInsights,
      errors,
      skipped_this_run: toProcess.length - usersProcessed - errors,
    }),
    { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
  )
})
