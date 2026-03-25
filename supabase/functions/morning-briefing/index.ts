import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

/**
 * Morning Briefing Edge Function
 *
 * POST { user_id: string }
 *
 * Fetches the last 7 rows from daily_summaries for the given user,
 * calls Claude claude-sonnet-4-6 to generate a personalised 2-3 sentence
 * morning briefing, saves it to the briefings table, and returns
 * { briefing: string }.
 *
 * Cron setup (Supabase Dashboard → SQL Editor):
 *   SELECT cron.schedule(
 *     'morning-briefing',
 *     '0 7 * * *',
 *     $$
 *     SELECT net.http_post(
 *       url := '<YOUR_SUPABASE_URL>/functions/v1/morning-briefing',
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

interface DailySummaryRow {
  date: string
  steps: number | null
  sleep_duration_minutes: number | null
  avg_hrv: number | null
  recovery_score: number | null
  active_calories: number | null
  resting_heart_rate: number | null
}

interface BriefingInsertRow {
  user_id: string
  date: string
  content: string
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  })
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS })
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405)
  }

  // Validate Authorization header
  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return jsonResponse({ error: "Missing authorization header" }, 401)
  }

  // Validate environment variables
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")
  if (!anthropicKey) {
    return jsonResponse({ error: "ANTHROPIC_API_KEY not configured" }, 500)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !supabaseServiceKey) {
    return jsonResponse({ error: "Supabase environment not configured" }, 500)
  }

  // Parse request body
  let userId: string
  try {
    const body = await req.json()
    if (!body?.user_id || typeof body.user_id !== "string") {
      return jsonResponse({ error: "Missing or invalid user_id in request body" }, 400)
    }
    userId = body.user_id
  } catch {
    return jsonResponse({ error: "Invalid JSON in request body" }, 400)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Fetch last 7 daily summaries for the user
  const since7d = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10)

  const { data: summaries, error: summariesError } = await supabase
    .from("daily_summaries")
    .select("date,steps,sleep_duration_minutes,avg_hrv,recovery_score,active_calories,resting_heart_rate")
    .eq("user_id", userId)
    .gte("date", since7d)
    .order("date", { ascending: false })
    .limit(7)

  if (summariesError) {
    console.error("[morning-briefing] Failed to fetch daily summaries:", summariesError)
    return jsonResponse({ error: "Failed to fetch health data" }, 500)
  }

  if (!summaries || summaries.length === 0) {
    return jsonResponse({ error: "No health data found for this user in the last 7 days" }, 404)
  }

  const typedSummaries = summaries as DailySummaryRow[]

  // Call Claude API
  const systemPrompt =
    "You are a concise personal health coach. Analyze the last 7 days of health data and write a 2-3 sentence morning briefing. Be specific with numbers. End with one actionable tip for today."

  const userMessage = JSON.stringify(typedSummaries, null, 2)

  let briefingContent: string
  try {
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
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

    if (!claudeRes.ok) {
      const errorBody = await claudeRes.text()
      console.error("[morning-briefing] Claude API error:", claudeRes.status, errorBody)
      return jsonResponse({ error: "Claude API request failed" }, 502)
    }

    const claudeData = await claudeRes.json()
    briefingContent = claudeData?.content?.[0]?.text

    if (!briefingContent || typeof briefingContent !== "string") {
      console.error("[morning-briefing] Unexpected Claude response shape:", JSON.stringify(claudeData))
      return jsonResponse({ error: "Unexpected response from Claude API" }, 502)
    }
  } catch (err) {
    console.error("[morning-briefing] Failed to call Claude API:", err)
    return jsonResponse({ error: "Failed to generate briefing" }, 502)
  }

  // Save briefing to database
  const todayDate = new Date().toISOString().slice(0, 10)
  const insertRow: BriefingInsertRow = {
    user_id: userId,
    date: todayDate,
    content: briefingContent,
  }

  const { error: insertError } = await supabase
    .from("briefings")
    .insert(insertRow)

  if (insertError) {
    // Log but do not fail — briefing was generated, return it even if persistence failed
    console.error("[morning-briefing] Failed to save briefing:", insertError)
  }

  return jsonResponse({ briefing: briefingContent })
})
