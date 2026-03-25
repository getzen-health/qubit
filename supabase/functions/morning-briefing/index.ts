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

  // Verify JWT — reject forged/expired tokens
  const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!)
  const { data: { user: jwtUser }, error: jwtError } = await supabaseAuth.auth.getUser(
    authHeader.replace("Bearer ", "")
  )
  if (jwtError || !jwtUser) {
    return jsonResponse({ error: "Unauthorized" }, 401)
  }

  const userId = jwtUser.id

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

  // Fetch yesterday's subjective check-in, water intake, and nutrition
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const [checkinResult, waterResult, nutritionResult] = await Promise.all([
    supabase
      .from('daily_checkins')
      .select('energy, mood, stress, notes')
      .eq('user_id', userId)
      .eq('date', yesterdayStr)
      .maybeSingle(),
    supabase
      .from('daily_water')
      .select('total_ml')
      .eq('user_id', userId)
      .eq('date', yesterdayStr)
      .maybeSingle(),
    supabase
      .from('daily_nutrition')
      .select('calories_consumed, protein_consumed, carbs_consumed, fat_consumed')
      .eq('user_id', userId)
      .eq('date', yesterdayStr)
      .maybeSingle(),
  ])

  const checkin = checkinResult.data
  const water = waterResult.data
  const nutrition = nutritionResult.data

  // Call Claude API
  const systemPrompt =
    "You are a concise personal health coach. Analyze the last 7 days of health data and write a 2-3 sentence morning briefing. Be specific with numbers. End with one actionable tip for today. " +
    "When subjective check-in data is available (energy 1-5, mood 1-5, stress 1-5), reference it contextually. " +
    "When water intake is below 2000ml, recommend increased hydration and explain the HRV/recovery connection. " +
    "When nutrition data is present, comment on protein sufficiency (goal: 0.8g per kg bodyweight, assume 70kg default). " +
    "Connect subjective feelings to objective metrics (e.g., low mood + low HRV = high stress state)."

  const userMessage = JSON.stringify({
    summaries: typedSummaries,
    yesterday: {
      checkin: checkin ? {
        energy: checkin.energy,  // 1-5 scale
        mood: checkin.mood,
        stress: checkin.stress,
        notes: checkin.notes,
      } : null,
      water_ml: water?.total_ml ?? null,
      nutrition: nutrition ? {
        calories: nutrition.calories_consumed,
        protein_g: nutrition.protein_consumed,
        carbs_g: nutrition.carbs_consumed,
        fat_g: nutrition.fat_consumed,
      } : null,
    }
  }, null, 2)

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
