import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

/**
 * Predictions Edge Function
 *
 * POST { user_id: string }
 *
 * Fetches 90 days of daily_summaries and last 30 workout_records for the user,
 * computes trend metrics (HRV 7-day vs 30-day avg, training load week-over-week,
 * sleep consistency, resting HR trend), calls Claude to generate a 7-day forecast,
 * upserts the result into the predictions table, and returns the prediction.
 *
 * Cron setup (Supabase Dashboard → SQL Editor, runs Sunday at 11pm UTC):
 *   SELECT cron.schedule(
 *     'weekly-predictions',
 *     '0 23 * * 0',
 *     $$
 *     SELECT net.http_post(
 *       url := '<YOUR_SUPABASE_URL>/functions/v1/predictions',
 *       headers := jsonb_build_object(
 *         'Authorization', 'Bearer <YOUR_SERVICE_ROLE_KEY>',
 *         'Content-Type', 'application/json'
 *       ),
 *       body := jsonb_build_object('user_id', '<USER_UUID>')
 *     ) AS request_id;
 *     $$
 *   );
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// MARK: - Types

interface DailySummaryRow {
  date: string
  steps: number | null
  avg_hrv: number | null
  resting_heart_rate: number | null
  sleep_duration_minutes: number | null
  recovery_score: number | null
  active_calories: number | null
}

interface WorkoutRow {
  workout_type: string
  duration_minutes: number | null
  active_calories: number | null
  avg_heart_rate: number | null
}

interface ClaudePrediction {
  recovery_forecast: string
  performance_window: string
  caution_flags: string
}

interface PredictionUpsert {
  user_id: string
  week_of: string
  recovery_forecast: string
  performance_window: string
  caution_flags: string
  raw_response: Record<string, unknown>
}

// MARK: - Math helpers

function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0
  const avg = mean(values)
  const squaredDiffs = values.map((v) => (v - avg) ** 2)
  return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / (values.length - 1))
}

// MARK: - Monday of the current week (ISO: week starts Monday)

function currentWeekMonday(): string {
  const now = new Date()
  const day = now.getUTCDay() // 0 = Sunday, 1 = Monday, ...
  const daysToMonday = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() - daysToMonday)
  return monday.toISOString().slice(0, 10)
}

// MARK: - Trend computation

interface ComputedTrends {
  hrv_7day_avg: number | null
  hrv_30day_avg: number | null
  hrv_trend_direction: "improving" | "declining" | "stable" | "insufficient_data"
  training_load_last_7_days: number
  training_load_prior_7_days: number
  training_load_change_pct: number | null
  sleep_consistency_stddev: number | null
  sleep_avg_hours: number | null
  resting_hr_7day_avg: number | null
  resting_hr_30day_avg: number | null
  resting_hr_trend_direction: "improving" | "worsening" | "stable" | "insufficient_data"
  recovery_score_7day_avg: number | null
}

function computeTrends(summaries: DailySummaryRow[], workouts: WorkoutRow[]): ComputedTrends {
  // Sort ascending so index 0 = oldest
  const sorted = [...summaries].sort((a, b) => a.date.localeCompare(b.date))

  // HRV
  const allHrv = sorted.map((r) => r.avg_hrv).filter((v): v is number => v !== null)
  const hrv7 = allHrv.slice(-7)
  const hrv30 = allHrv.slice(-30)
  const hrv7Avg = hrv7.length > 0 ? mean(hrv7) : null
  const hrv30Avg = hrv30.length > 0 ? mean(hrv30) : null

  let hrvTrend: ComputedTrends["hrv_trend_direction"] = "insufficient_data"
  if (hrv7Avg !== null && hrv30Avg !== null && hrv30Avg > 0) {
    const pctChange = ((hrv7Avg - hrv30Avg) / hrv30Avg) * 100
    if (pctChange >= 5) hrvTrend = "improving"
    else if (pctChange <= -5) hrvTrend = "declining"
    else hrvTrend = "stable"
  }

  // Training load (sum of active_calories as proxy — workouts table)
  // Use workouts for training load; fall back to summaries active_calories
  const now = new Date()
  const cutoff7 = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  const cutoff14 = new Date(now.getTime() - 14 * 24 * 3600 * 1000).toISOString().slice(0, 10)

  // Training load from daily_summaries active_calories
  const last7Summaries = sorted.filter((r) => r.date >= cutoff7)
  const prior7Summaries = sorted.filter((r) => r.date >= cutoff14 && r.date < cutoff7)

  const trainingLast7 = last7Summaries.reduce((sum, r) => sum + (r.active_calories ?? 0), 0)
  const trainingPrior7 = prior7Summaries.reduce((sum, r) => sum + (r.active_calories ?? 0), 0)
  const trainingChangePct =
    trainingPrior7 > 0 ? ((trainingLast7 - trainingPrior7) / trainingPrior7) * 100 : null

  // Sleep consistency
  const sleepValues = sorted
    .map((r) => r.sleep_duration_minutes)
    .filter((v): v is number => v !== null)
  const sleepStddev = sleepValues.length >= 3 ? stddev(sleepValues) : null
  const sleepAvgMinutes = sleepValues.length > 0 ? mean(sleepValues) : null

  // Resting HR
  const allRhr = sorted
    .map((r) => r.resting_heart_rate)
    .filter((v): v is number => v !== null)
  const rhr7 = allRhr.slice(-7)
  const rhr30 = allRhr.slice(-30)
  const rhr7Avg = rhr7.length > 0 ? mean(rhr7) : null
  const rhr30Avg = rhr30.length > 0 ? mean(rhr30) : null

  let rhrTrend: ComputedTrends["resting_hr_trend_direction"] = "insufficient_data"
  if (rhr7Avg !== null && rhr30Avg !== null && rhr30Avg > 0) {
    const pctChange = ((rhr7Avg - rhr30Avg) / rhr30Avg) * 100
    // Lower resting HR = improving fitness
    if (pctChange <= -3) rhrTrend = "improving"
    else if (pctChange >= 3) rhrTrend = "worsening"
    else rhrTrend = "stable"
  }

  // Recovery score
  const recoveryValues = sorted
    .slice(-7)
    .map((r) => r.recovery_score)
    .filter((v): v is number => v !== null)
  const recovery7Avg = recoveryValues.length > 0 ? mean(recoveryValues) : null

  return {
    hrv_7day_avg: hrv7Avg !== null ? Math.round(hrv7Avg * 10) / 10 : null,
    hrv_30day_avg: hrv30Avg !== null ? Math.round(hrv30Avg * 10) / 10 : null,
    hrv_trend_direction: hrvTrend,
    training_load_last_7_days: Math.round(trainingLast7),
    training_load_prior_7_days: Math.round(trainingPrior7),
    training_load_change_pct: trainingChangePct !== null ? Math.round(trainingChangePct) : null,
    sleep_consistency_stddev:
      sleepStddev !== null ? Math.round((sleepStddev / 60) * 10) / 10 : null, // in hours
    sleep_avg_hours:
      sleepAvgMinutes !== null ? Math.round((sleepAvgMinutes / 60) * 10) / 10 : null,
    resting_hr_7day_avg: rhr7Avg !== null ? Math.round(rhr7Avg * 10) / 10 : null,
    resting_hr_30day_avg: rhr30Avg !== null ? Math.round(rhr30Avg * 10) / 10 : null,
    resting_hr_trend_direction: rhrTrend,
    recovery_score_7day_avg: recovery7Avg !== null ? Math.round(recovery7Avg) : null,
  }
}

// MARK: - Raw data summary for Claude

function buildRawSummary(summaries: DailySummaryRow[], workouts: WorkoutRow[]) {
  // Include last 7 days of summaries in full, plus aggregate stats over 90 days
  const sorted = [...summaries].sort((a, b) => b.date.localeCompare(a.date))
  const recent7 = sorted.slice(0, 7)

  const workoutTypeCounts: Record<string, number> = {}
  for (const w of workouts) {
    workoutTypeCounts[w.workout_type] = (workoutTypeCounts[w.workout_type] ?? 0) + 1
  }

  const avgWorkoutDuration =
    workouts.length > 0
      ? Math.round(
          mean(workouts.map((w) => w.duration_minutes ?? 0).filter((v) => v > 0))
        )
      : null

  return {
    recent_7_days: recent7,
    workout_summary_last_30: {
      total_workouts: workouts.length,
      avg_duration_minutes: avgWorkoutDuration,
      types: workoutTypeCounts,
    },
    total_days_of_data: summaries.length,
  }
}

// MARK: - Claude API call

async function callClaude(
  anthropicKey: string,
  trends: ComputedTrends,
  rawSummary: ReturnType<typeof buildRawSummary>
): Promise<{ prediction: ClaudePrediction; rawResponse: Record<string, unknown> } | null> {
  const systemPrompt =
    "You are a sports scientist and health coach. Based on 90 days of biometric data, predict the user's next 7 days. Be specific and quantitative. Format your response as JSON with three keys: recovery_forecast (string, 1-2 sentences), performance_window (string — best day(s) for hard training), caution_flags (string — any risks to watch)."

  const userMessage = JSON.stringify({ trends, raw_data_summary: rawSummary }, null, 2)

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      signal: AbortSignal.timeout(25000),
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    })

    if (!res.ok) {
      console.error("[predictions] Claude API error:", res.status, await res.text())
      return null
    }

    const rawResponse = (await res.json()) as Record<string, unknown>
    const text = (rawResponse?.content as Array<{ text: string }> | undefined)?.[0]?.text?.trim()

    if (!text) {
      console.error("[predictions] Empty Claude response")
      return null
    }

    // Extract JSON from the response — Claude may wrap it in markdown code fences
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\})/)
    const jsonText = jsonMatch ? jsonMatch[1] ?? jsonMatch[0] : text

    let prediction: ClaudePrediction
    try {
      prediction = JSON.parse(jsonText) as ClaudePrediction
    } catch {
      console.error("[predictions] Failed to parse Claude JSON:", jsonText)
      return null
    }

    if (
      typeof prediction.recovery_forecast !== "string" ||
      typeof prediction.performance_window !== "string" ||
      typeof prediction.caution_flags !== "string"
    ) {
      console.error("[predictions] Claude response missing required keys:", prediction)
      return null
    }

    return { prediction, rawResponse }
  } catch (err) {
    console.error("[predictions] Failed to call Claude API:", err)
    return null
  }
}

// MARK: - Handler

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS })
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405)
  }

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return jsonResponse({ error: "Missing authorization header" }, 401)
  }

  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")
  if (!anthropicKey) {
    return jsonResponse({ error: "ANTHROPIC_API_KEY not configured" }, 500)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !supabaseServiceKey) {
    return jsonResponse({ error: "Supabase environment not configured" }, 500)
  }

  const supabaseAdmin = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!)
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""))
  if (authError || !user) {
    return jsonResponse({ error: "Unauthorized" }, 401)
  }
  const userId = user.id

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Fetch last 90 days of daily_summaries
  const since90d = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString().slice(0, 10)

  const { data: summariesRaw, error: summariesError } = await supabase
    .from("daily_summaries")
    .select("date,steps,avg_hrv,resting_heart_rate,sleep_duration_minutes,recovery_score,active_calories")
    .eq("user_id", userId)
    .gte("date", since90d)
    .order("date", { ascending: false })
    .limit(90)

  if (summariesError) {
    console.error("[predictions] Failed to fetch daily_summaries:", summariesError)
    return jsonResponse({ error: "Failed to fetch health data" }, 500)
  }

  const summaries = (summariesRaw ?? []) as DailySummaryRow[]

  if (summaries.length < 7) {
    return jsonResponse(
      { error: "Insufficient data: at least 7 days of summaries required for predictions" },
      422
    )
  }

  // Fetch last 30 workouts
  const { data: workoutsRaw, error: workoutsError } = await supabase
    .from("workout_records")
    .select("workout_type,duration_minutes,active_calories,avg_heart_rate")
    .eq("user_id", userId)
    .order("start_time", { ascending: false })
    .limit(30)

  if (workoutsError) {
    console.error("[predictions] Failed to fetch workout_records:", workoutsError)
    return jsonResponse({ error: "Failed to fetch workout data" }, 500)
  }

  const workouts = (workoutsRaw ?? []) as WorkoutRow[]

  // Compute trends
  const trends = computeTrends(summaries, workouts)
  const rawSummary = buildRawSummary(summaries, workouts)

  // Call Claude
  const claudeResult = await callClaude(anthropicKey, trends, rawSummary)

  if (!claudeResult) {
    return jsonResponse({ error: "Failed to generate prediction from Claude" }, 502)
  }

  const { prediction, rawResponse } = claudeResult
  const weekOf = currentWeekMonday()

  // Upsert into predictions table
  const upsertRow: PredictionUpsert = {
    user_id: userId,
    week_of: weekOf,
    recovery_forecast: prediction.recovery_forecast,
    performance_window: prediction.performance_window,
    caution_flags: prediction.caution_flags,
    raw_response: rawResponse,
  }

  const { data: upserted, error: upsertError } = await supabase
    .from("predictions")
    .upsert(upsertRow, { onConflict: "user_id,week_of" })
    .select()
    .single()

  if (upsertError) {
    console.error("[predictions] Failed to upsert prediction:", upsertError)
    return jsonResponse({ error: "Failed to save prediction" }, 500)
  }

  return jsonResponse({ prediction: upserted })
})
