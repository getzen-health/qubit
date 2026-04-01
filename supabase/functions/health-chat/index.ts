import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { fetchWithRetry } from "../_shared/retry.ts"

/**
 * Health Chat Edge Function
 *
 * POST { message: string, history: Array<{role, content}>, user_id: string }
 *
 * Fetches the user's last 30 days of daily_summaries and last 10 workouts,
 * injects them as context into a Claude claude-sonnet-4-6 system prompt,
 * and returns { response: string }.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "https://getzen.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface HistoryMessage {
  role: "user" | "assistant"
  content: string
}

interface RequestBody {
  message: string
  history: HistoryMessage[]
  user_id: string
}

interface DailySummaryRow {
  date: string
  steps: number | null
  sleep_duration_minutes: number | null
  avg_hrv: number | null
  recovery_score: number | null
  active_calories: number | null
  resting_heart_rate: number | null
  sleep_quality_score: number | null
  respiratory_rate: number | null
  spo2_avg: number | null
}

interface WorkoutRow {
  workout_type: string
  duration_minutes: number | null
  active_calories: number | null
  avg_heart_rate: number | null
  distance_meters: number | null
  start_date: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  })
}

function buildSystemPrompt(
  summaries: DailySummaryRow[],
  workouts: WorkoutRow[],
): string {
  const dataContext = JSON.stringify(
    { last_30_days: summaries, recent_workouts: workouts },
    null,
    2,
  )

  return [
    "You are a personal health coach with access to the user's real health data.",
    "Answer questions about their specific data. Be direct, specific, and cite actual numbers.",
    "Keep responses under 150 words.",
    "",
    "USER HEALTH DATA CONTEXT:",
    dataContext,
  ].join("\n")
}

// ─── Handler ──────────────────────────────────────────────────────────────────

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

  // Parse and validate request body
  let body: RequestBody
  try {
    const raw = await req.json()
    if (!raw?.message || typeof raw.message !== "string") {
      return jsonResponse({ error: "Missing or invalid 'message' field" }, 400)
    }
    const history: HistoryMessage[] = Array.isArray(raw.history)
      ? raw.history.filter(
          (m: unknown) =>
            m !== null &&
            typeof m === "object" &&
            "role" in (m as Record<string, unknown>) &&
            "content" in (m as Record<string, unknown>) &&
            ((m as Record<string, unknown>).role === "user" || (m as Record<string, unknown>).role === "assistant"),
        )
      : []
    body = { message: raw.message, history, user_id: user.id }
  } catch {
    return jsonResponse({ error: "Invalid JSON in request body" }, 400)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // ── Per-user rate limiting: max 20 messages/day ───────────────────────────
  const today = new Date().toISOString().slice(0, 10)
  const { data: usageData } = await supabase
    .from("ai_usage")
    .select("call_count")
    .eq("user_id", user.id)
    .eq("function_name", "health-chat")
    .eq("used_at", today)
    .maybeSingle()

  if ((usageData?.call_count ?? 0) >= 20) {
    return jsonResponse({ error: "Daily limit reached. Upgrade for more." }, 429)
  }

  // ── Fetch last 30 days of daily summaries ──────────────────────────────────
  const since30d = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10)

  const { data: summariesData, error: summariesError } = await supabase
    .from("daily_summaries")
    .select(
      "date,steps,sleep_duration_minutes,avg_hrv,recovery_score,active_calories,resting_heart_rate,sleep_quality_score,respiratory_rate,spo2_avg",
    )
    .eq("user_id", body.user_id)
    .gte("date", since30d)
    .order("date", { ascending: false })
    .limit(30)

  if (summariesError) {
    console.error("[health-chat] Failed to fetch daily summaries:", summariesError instanceof Error ? summariesError.message : "Unknown error")
    return jsonResponse({ error: "Failed to fetch health data" }, 500)
  }

  const summaries: DailySummaryRow[] = (summariesData ?? []) as DailySummaryRow[]

  // ── Fetch last 10 workouts ─────────────────────────────────────────────────
  const { data: workoutsData, error: workoutsError } = await supabase
    .from("workout_records")
    .select("workout_type,duration_minutes,active_calories,avg_heart_rate,distance_meters,start_date")
    .eq("user_id", body.user_id)
    .order("start_date", { ascending: false })
    .limit(10)

  if (workoutsError) {
    // Non-fatal: proceed without workout data
    console.warn("[health-chat] Failed to fetch workouts:", workoutsError instanceof Error ? workoutsError.message : "Unknown error")
  }

  const workouts: WorkoutRow[] = (workoutsData ?? []) as WorkoutRow[]

  // ── Build conversation and call Claude ────────────────────────────────────
  const systemPrompt = buildSystemPrompt(summaries, workouts)

  // Keep last 10 history messages to stay well within context limits
  const truncatedHistory = body.history.slice(-10)

  const claudeMessages = [
    ...truncatedHistory,
    { role: "user" as const, content: body.message },
  ]

  let responseText: string
  try {
    const claudeRes = await fetchWithRetry("https://api.anthropic.com/v1/messages", {
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
        messages: claudeMessages,
      }),
      timeout: 30000,
      retries: { maxRetries: 3, baseDelay: 1000 },
    })

    if (!claudeRes.ok) {
      await claudeRes.text() // consume body
      console.error("[health-chat] Claude API error: status", claudeRes.status)
      return jsonResponse({ error: "Claude API request failed" }, 502)
    }

    const claudeData = await claudeRes.json()
    const text = claudeData?.content?.[0]?.text

    if (!text || typeof text !== "string") {
      console.error("[health-chat] Unexpected Claude response shape")
      return jsonResponse({ error: "Unexpected response from Claude API" }, 502)
    }

    responseText = text
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      console.error("[health-chat] Claude API timeout")
      return jsonResponse({ error: "AI service request timed out. Please try again." }, 504)
    }
    console.error("[health-chat] Failed to call Claude API:", err instanceof Error ? err.message : "Unknown error")
    return jsonResponse({ error: "Failed to generate response" }, 502)
  }

  // ── Increment usage counter ────────────────────────────────────────────────
  if (usageData) {
    await supabase
      .from("ai_usage")
      .update({ call_count: usageData.call_count + 1 })
      .eq("user_id", user.id)
      .eq("function_name", "health-chat")
      .eq("used_at", today)
  } else {
    await supabase
      .from("ai_usage")
      .insert({ user_id: user.id, function_name: "health-chat", used_at: today, call_count: 1 })
  }

  return jsonResponse({ response: responseText })
})
