import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

/**
 * Anomaly Detector Edge Function
 *
 * Accepts POST { user_id: string, date: string }
 * Fetches the last 14 daily_summaries rows, computes rolling stats,
 * detects anomalies in HRV, resting HR, sleep duration, and steps,
 * generates a Claude explanation for each anomaly, then inserts
 * the results into the anomalies table.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "https://kquarks.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// MARK: - Types

interface DailySummaryRow {
  date: string
  steps: number | null
  avg_hrv: number | null
  resting_heart_rate: number | null
  sleep_duration_minutes: number | null
}

interface AnomalyInsert {
  user_id: string
  detected_at: string
  metric: string
  value: number
  avg_value: number
  deviation: number
  severity: "low" | "medium" | "high"
  claude_explanation: string | null
}

interface RequestBody {
  user_id: string
  date: string
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

function deviationsFromMean(value: number, avg: number, sd: number): number {
  if (sd === 0) return 0
  return (value - avg) / sd
}

function severityFromDeviations(abs: number): "low" | "medium" | "high" {
  if (abs >= 2) return "high"
  if (abs >= 1.5) return "medium"
  return "low"
}

// MARK: - Claude explanation

async function generateExplanation(
  anthropicKey: string,
  metric: string,
  value: number,
  avgValue: number,
  severity: string,
  direction: "low" | "high"
): Promise<string | null> {
  const metricLabels: Record<string, string> = {
    avg_hrv: "heart rate variability (HRV)",
    resting_heart_rate: "resting heart rate",
    sleep_duration_minutes: "sleep duration",
    steps: "step count",
  }

  const label = metricLabels[metric] ?? metric
  const formattedValue = metric === "sleep_duration_minutes"
    ? `${(value / 60).toFixed(1)} hours`
    : metric === "avg_hrv"
    ? `${value.toFixed(1)} ms`
    : metric === "resting_heart_rate"
    ? `${value.toFixed(0)} bpm`
    : `${Math.round(value).toLocaleString()}`

  const formattedAvg = metric === "sleep_duration_minutes"
    ? `${(avgValue / 60).toFixed(1)} hours`
    : metric === "avg_hrv"
    ? `${avgValue.toFixed(1)} ms`
    : metric === "resting_heart_rate"
    ? `${avgValue.toFixed(0)} bpm`
    : `${Math.round(avgValue).toLocaleString()}`

  const directionWord = direction === "low" ? "lower" : "higher"

  const prompt = `Today's ${label} is ${formattedValue}, which is notably ${directionWord} than your 14-day average of ${formattedAvg}. This is a ${severity}-severity anomaly. In 1-2 sentences, explain what this might mean and offer one practical tip. Be specific and grounded — avoid generic advice. Do not use markdown formatting.`

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      signal: AbortSignal.timeout(30000),
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    })

    if (!res.ok) return null

    const data = await res.json()
    return (data.content?.[0]?.text as string | undefined)?.trim() ?? null
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      console.error("Claude API timeout for metric explanation")
      return "Request to AI service timed out. This anomaly may need further investigation."
    }
    return null
  }
}

// MARK: - APNs notification sending

async function sendAPNsNotification(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  metric: string,
  value: number,
  avgValue: number,
  severity: string,
  direction: "low" | "high"
): Promise<void> {
  // Check if user has notifications enabled (default to true if no preference)
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("anomaly_alerts")
    .eq("user_id", userId)
    .maybeSingle()
  
  const anomalyAlertsEnabled = prefs?.anomaly_alerts !== false

  if (!anomalyAlertsEnabled) return

  // Get device token
  const { data: tokenData } = await supabase
    .from("push_tokens")
    .select("token")
    .eq("user_id", userId)
    .maybeSingle()

  if (!tokenData?.token) return

  // Build notification message
  const metricLabels: Record<string, string> = {
    avg_hrv: "HRV",
    resting_heart_rate: "resting heart rate",
    sleep_duration_minutes: "sleep duration",
    steps: "step count",
  }

  const metricLabel = metricLabels[metric] ?? metric
  const formattedValue = metric === "sleep_duration_minutes"
    ? `${(value / 60).toFixed(1)}h`
    : metric === "avg_hrv"
    ? `${value.toFixed(0)}ms`
    : metric === "resting_heart_rate"
    ? `${Math.round(value)} bpm`
    : `${Math.round(value).toLocaleString()}`
  
  const formattedAvg = metric === "sleep_duration_minutes"
    ? `${(avgValue / 60).toFixed(1)}h`
    : metric === "avg_hrv"
    ? `${avgValue.toFixed(0)}ms`
    : metric === "resting_heart_rate"
    ? `${Math.round(avgValue)} bpm`
    : `${Math.round(avgValue).toLocaleString()}`

  const directionText = direction === "low" ? "below" : "above"
  const body = `Your ${metricLabel} is ${directionText} normal (${formattedValue} vs ${formattedAvg})`

  // Send via APNs
  // NOTE: In production, this would use an APNs provider like Firebase Cloud Messaging,
  // AWS SNS, or a dedicated APNs service. For now, we log the intent.
  // The token is stored and ready for integration with a push notification service.
  
  console.log(`[APNs] Sending to ${tokenData.token}: ${body}`)
}

// MARK: - Anomaly detection

interface DetectedAnomaly {
  metric: string
  value: number
  avgValue: number
  deviation: number
  severity: "low" | "medium" | "high"
  direction: "low" | "high"
}

function detectAnomalies(
  today: DailySummaryRow,
  history: DailySummaryRow[]
): DetectedAnomaly[] {
  const anomalies: DetectedAnomaly[] = []

  // Helper: extract valid numeric values for a metric from history
  const historyValues = (key: keyof DailySummaryRow): number[] =>
    history.map((r) => r[key] as number | null).filter((v): v is number => v !== null && !isNaN(v))

  // HRV: flag when today < avg - 1.5 * sd (low is bad)
  if (today.avg_hrv !== null) {
    const values = historyValues("avg_hrv")
    if (values.length >= 3) {
      const avg = mean(values)
      const sd = stddev(values)
      const todayVal = today.avg_hrv
      const devs = deviationsFromMean(todayVal, avg, sd)
      if (devs <= -1.5) {
        anomalies.push({
          metric: "avg_hrv",
          value: todayVal,
          avgValue: avg,
          deviation: Math.abs(devs),
          severity: severityFromDeviations(Math.abs(devs)),
          direction: "low",
        })
      }
    }
  }

  // Resting HR: flag when today > avg + 1.5 * sd (high is bad)
  if (today.resting_heart_rate !== null) {
    const values = historyValues("resting_heart_rate")
    if (values.length >= 3) {
      const avg = mean(values)
      const sd = stddev(values)
      const todayVal = today.resting_heart_rate
      const devs = deviationsFromMean(todayVal, avg, sd)
      if (devs >= 1.5) {
        anomalies.push({
          metric: "resting_heart_rate",
          value: todayVal,
          avgValue: avg,
          deviation: devs,
          severity: severityFromDeviations(devs),
          direction: "high",
        })
      }
    }
  }

  // Sleep: flag when today < avg - 1.5 * sd (low is bad)
  if (today.sleep_duration_minutes !== null) {
    const values = historyValues("sleep_duration_minutes")
    if (values.length >= 3) {
      const avg = mean(values)
      const sd = stddev(values)
      const todayVal = today.sleep_duration_minutes
      const devs = deviationsFromMean(todayVal, avg, sd)
      if (devs <= -1.5) {
        anomalies.push({
          metric: "sleep_duration_minutes",
          value: todayVal,
          avgValue: avg,
          deviation: Math.abs(devs),
          severity: severityFromDeviations(Math.abs(devs)),
          direction: "low",
        })
      }
    }
  }

  // Steps: flag when today < avg * 0.4 (sudden cliff — more than 60% drop)
  if (today.steps !== null) {
    const values = historyValues("steps")
    if (values.length >= 3) {
      const avg = mean(values)
      const sd = stddev(values)
      const todayVal = today.steps
      if (avg > 0 && todayVal < avg * 0.4) {
        const devs = deviationsFromMean(todayVal, avg, sd)
        anomalies.push({
          metric: "steps",
          value: todayVal,
          avgValue: avg,
          deviation: Math.abs(devs),
          severity: Math.abs(devs) >= 2 ? "high" : "medium",
          direction: "low",
        })
      }
    }
  }

  return anomalies
}

// MARK: - Handler

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
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

  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
  }

  const { date } = body
  const user_id = _jwtUser.id
  if (!date) {
    return new Response(JSON.stringify({ error: "date is required" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  // ── Per-user rate limiting: max 5 calls/day ───────────────────────────────
  const todayDate = new Date().toISOString().slice(0, 10)
  const { data: usageData } = await supabase
    .from("ai_usage")
    .select("call_count")
    .eq("user_id", user_id)
    .eq("function_name", "anomaly-detector")
    .eq("used_at", todayDate)
    .maybeSingle()

  if ((usageData?.call_count ?? 0) >= 5) {
    return new Response(JSON.stringify({ error: "Daily limit reached" }), {
      status: 429,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
  }

  // Fetch last 14 rows (inclusive of today) ordered newest first
  const { data: rows, error: fetchError } = await supabase
    .from("daily_summaries")
    .select("date, steps, avg_hrv, resting_heart_rate, sleep_duration_minutes")
    .eq("user_id", user_id)
    .lte("date", date)
    .order("date", { ascending: false })
    .limit(14)

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
  }

  if (!rows || rows.length === 0) {
    return new Response(JSON.stringify({ anomalies: [] }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
  }

  // Most recent row is today; the rest form the historical baseline
  const today = rows[0] as DailySummaryRow
  const history = (rows.slice(1) as DailySummaryRow[])

  // Need at least 3 history points for meaningful stats
  if (history.length < 3) {
    return new Response(JSON.stringify({ anomalies: [], message: "Insufficient history for analysis" }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
  }

  const detected = detectAnomalies(today, history)

  if (detected.length === 0) {
    return new Response(JSON.stringify({ anomalies: [] }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
  }

  // Generate Claude explanations and build insert rows
  const detectedAt = new Date().toISOString()
  const insertRows: AnomalyInsert[] = await Promise.all(
    detected.map(async (a) => {
      const explanation = await generateExplanation(
        anthropicKey,
        a.metric,
        a.value,
        a.avgValue,
        a.severity,
        a.direction
      )
      return {
        user_id,
        detected_at: detectedAt,
        metric: a.metric,
        value: a.value,
        avg_value: a.avgValue,
        deviation: a.deviation,
        severity: a.severity,
        claude_explanation: explanation,
      }
    })
  )

  const { data: inserted, error: insertError } = await supabase
    .from("anomalies")
    .insert(insertRows)
    .select()

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
  }

  // ── Send push notifications for each anomaly ────────────────────────────────
  await Promise.all(
    detected.map((anomaly) =>
      sendAPNsNotification(
        supabase,
        user_id,
        anomaly.metric,
        anomaly.value,
        anomaly.avgValue,
        anomaly.severity,
        anomaly.direction
      ).catch((err) => {
        // Log but don't fail the request if notification sending fails
        console.error(`Failed to send APNs notification: ${err instanceof Error ? err.message : 'Unknown error'}`)
      })
    )
  )

  // ── Increment usage counter ────────────────────────────────────────────────
  if (usageData) {
    await supabase
      .from("ai_usage")
      .update({ call_count: usageData.call_count + 1 })
      .eq("user_id", user_id)
      .eq("function_name", "anomaly-detector")
      .eq("used_at", todayDate)
  } else {
    await supabase
      .from("ai_usage")
      .insert({ user_id: user_id, function_name: "anomaly-detector", used_at: todayDate, call_count: 1 })
  }

  return new Response(JSON.stringify({ anomalies: inserted ?? [] }), {
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  })
})
