import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface UserGoals {
  stepGoal: number
  calorieGoal: number
  sleepGoalMinutes: number
}

interface HealthContext {
  dailySummary: {
    date: string
    steps: number
    distanceMeters: number
    activeCalories: number
    totalCalories: number
    floorsClimbed: number
    restingHeartRate: number | null
    avgHrv: number | null
    sleepDurationMinutes: number | null
    sleepQualityScore: number | null
    activeMinutes: number
  }
  weekHistory: Array<{
    date: string
    steps: number
    activeCalories: number
    restingHeartRate: number | null
    avgHrv: number | null
    sleepDurationMinutes: number | null
  }>
  recentWorkouts: Array<{
    workoutType: string
    durationMinutes: number
    activeCalories: number | null
    avgHeartRate: number | null
  }>
  recentSleep: Array<{
    durationMinutes: number
    deepMinutes: number
    remMinutes: number
    coreMinutes: number
    awakeMinutes: number
  }>
  userGoals?: UserGoals
  hydration?: {
    todayMl: number
    targetMl: number
  }
  nutrition?: {
    todayCalories: number
    calorieTarget: number
  }
  fasting?: {
    isActive: boolean
    protocol: string | null
    elapsedHours: number
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const supabaseAuth = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!
    )
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(
      authHeader.replace("Bearer ", "")
    )
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { healthContext, userApiKey } = await req.json() as {
      healthContext: HealthContext
      userApiKey?: string
    }

    const apiKey = userApiKey || Deno.env.get("ANTHROPIC_API_KEY")
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "No API key configured. Please add your Claude API key in Settings > AI Provider." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const prompt = buildHealthPrompt(healthContext)

    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      signal: AbortSignal.timeout(25000),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: `You are a health data analyst embedded in a personal health tracking app called KQuarks.
Your role is to analyze the user's health metrics and provide actionable, personalized insights.

Guidelines:
- Be specific with numbers and comparisons (e.g., "Your HRV increased 15% from 42ms to 48ms")
- Compare today's metrics against the user's own weekly averages, not population norms
- Flag concerning trends early but don't be alarmist
- Suggest concrete actions (e.g., "Consider a 20-minute walk after lunch" not "Be more active")
- Acknowledge positive trends and progress
- Keep each insight to 2-3 sentences max
- Return ONLY valid JSON, no markdown or extra text

Return a JSON object with this exact structure:
{
  "recoveryScore": <0-100 integer based on sleep quality + HRV + resting HR trends>,
  "strainScore": <0.0-21.0 float based on activity intensity + calories + workout load>,
  "insights": [
    {
      "category": "sleep" | "activity" | "heart" | "recovery" | "general",
      "title": "<short title, 5-8 words>",
      "content": "<2-3 sentence insight with specific numbers>",
      "priority": "low" | "normal" | "high"
    }
  ]
}

Generate 3-5 insights covering different categories. At least one should be actionable advice.`,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    })

    if (!claudeResponse.ok) {
      const errorBody = await claudeResponse.text()
      console.error("Claude API error:", claudeResponse.status, errorBody)
      return new Response(
        JSON.stringify({ error: `AI service error: ${claudeResponse.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const claudeData = await claudeResponse.json()
    const responseText = claudeData.content[0].text

    let analysisResult
    try {
      analysisResult = JSON.parse(responseText)
    } catch {
      console.error("Failed to parse Claude response:", responseText)
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const insightsToStore = analysisResult.insights.map((insight: {
      category: string
      title: string
      content: string
      priority: string
    }) => ({
      user_id: user.id,
      category: insight.category,
      title: insight.title,
      content: insight.content,
      priority: insight.priority,
      is_read: false,
    }))

    if (insightsToStore.length > 0) {
      const { error: insertError } = await supabase
        .from("health_insights")
        .insert(insightsToStore)

      if (insertError) {
        console.error("Failed to store insights:", insertError)
      }
    }

    return new Response(
      JSON.stringify({
        recoveryScore: analysisResult.recoveryScore,
        strainScore: analysisResult.strainScore,
        insights: analysisResult.insights,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Edge function error:", error)
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})

function buildHealthPrompt(ctx: HealthContext): string {
  const today = ctx.dailySummary
  const weekAvg = calculateWeekAverages(ctx.weekHistory)
  const goals = ctx.userGoals

  // Goal progress helpers
  const stepPct = goals ? Math.round((today.steps / goals.stepGoal) * 100) : null
  const calPct = goals ? Math.round((today.activeCalories / goals.calorieGoal) * 100) : null
  const sleepPct = goals && today.sleepDurationMinutes
    ? Math.round((today.sleepDurationMinutes / goals.sleepGoalMinutes) * 100)
    : null

  let prompt = `## Today's Health Data (${today.date})
`

  if (goals) {
    prompt += `
**User Goals:**
- Step Goal: ${goals.stepGoal.toLocaleString()} steps/day
- Calorie Goal: ${goals.calorieGoal} kcal active/day
- Sleep Goal: ${(goals.sleepGoalMinutes / 60).toFixed(1)} hours/night
`
  }

  prompt += `
**Activity:**
- Steps: ${today.steps.toLocaleString()}${stepPct !== null ? ` (${stepPct}% of ${goals!.stepGoal.toLocaleString()} goal)` : ` (weekly avg: ${weekAvg.steps.toLocaleString()})`}
- Active Calories: ${today.activeCalories.toFixed(0)} kcal${calPct !== null ? ` (${calPct}% of ${goals!.calorieGoal} goal)` : ` (weekly avg: ${weekAvg.activeCalories.toFixed(0)})`}
- Distance: ${(today.distanceMeters / 1000).toFixed(1)} km
- Floors Climbed: ${today.floorsClimbed}
- Active Minutes: ${today.activeMinutes}

**Heart:**
- Resting Heart Rate: ${today.restingHeartRate ?? "N/A"} bpm (weekly avg: ${weekAvg.restingHeartRate?.toFixed(0) ?? "N/A"})
- HRV: ${today.avgHrv?.toFixed(0) ?? "N/A"} ms (weekly avg: ${weekAvg.avgHrv?.toFixed(0) ?? "N/A"})

**Sleep:**
- Duration: ${today.sleepDurationMinutes ? (today.sleepDurationMinutes / 60).toFixed(1) + " hours" : "N/A"}${sleepPct !== null ? ` (${sleepPct}% of ${(goals!.sleepGoalMinutes / 60).toFixed(1)}h goal)` : weekAvg.sleepDurationMinutes ? ` (weekly avg: ${(weekAvg.sleepDurationMinutes / 60).toFixed(1)} hours)` : ""}
`

  if (ctx.recentSleep.length > 0) {
    const lastSleep = ctx.recentSleep[0]
    prompt += `- Deep Sleep: ${lastSleep.deepMinutes} min
- REM: ${lastSleep.remMinutes} min
- Light/Core: ${lastSleep.coreMinutes} min
- Awake: ${lastSleep.awakeMinutes} min
`
  }

  if (ctx.recentWorkouts.length > 0) {
    prompt += `\n**Recent Workouts (last 7 days):**\n`
    for (const w of ctx.recentWorkouts.slice(0, 5)) {
      prompt += `- ${w.workoutType}: ${w.durationMinutes} min, ${w.activeCalories?.toFixed(0) ?? "?"} cal, avg HR ${w.avgHeartRate ?? "?"} bpm\n`
    }
  }

  prompt += `\n**7-Day Trend Data:**\n`
  for (const day of ctx.weekHistory) {
    prompt += `- ${day.date}: ${day.steps} steps, ${day.activeCalories.toFixed(0)} cal, RHR ${day.restingHeartRate ?? "?"}, HRV ${day.avgHrv?.toFixed(0) ?? "?"}, Sleep ${day.sleepDurationMinutes ? (day.sleepDurationMinutes / 60).toFixed(1) + "h" : "?"}\n`
  }

  if (ctx.hydration) {
    const hydPct = Math.round((ctx.hydration.todayMl / ctx.hydration.targetMl) * 100)
    prompt += `\n**Hydration:**\n- Today: ${ctx.hydration.todayMl >= 1000 ? (ctx.hydration.todayMl / 1000).toFixed(1) + "L" : ctx.hydration.todayMl + "ml"} (${hydPct}% of ${ctx.hydration.targetMl >= 1000 ? (ctx.hydration.targetMl / 1000).toFixed(1) + "L" : ctx.hydration.targetMl + "ml"} goal)\n`
  }

  if (ctx.nutrition) {
    const nutPct = Math.round((ctx.nutrition.todayCalories / ctx.nutrition.calorieTarget) * 100)
    prompt += `\n**Nutrition:**\n- Calories consumed today: ${ctx.nutrition.todayCalories} kcal (${nutPct}% of ${ctx.nutrition.calorieTarget} kcal target)\n`
  }

  if (ctx.fasting) {
    if (ctx.fasting.isActive) {
      prompt += `\n**Fasting:**\n- Active fast: ${ctx.fasting.protocol ?? "Intermittent fasting"}, ${ctx.fasting.elapsedHours.toFixed(1)} hours elapsed\n`
    }
  }

  prompt += `\nAnalyze this health data and provide personalized insights with recovery and strain scores.`

  return prompt
}

function calculateWeekAverages(history: HealthContext["weekHistory"]): {
  steps: number
  activeCalories: number
  restingHeartRate: number | null
  avgHrv: number | null
  sleepDurationMinutes: number | null
} {
  if (history.length === 0) {
    return { steps: 0, activeCalories: 0, restingHeartRate: null, avgHrv: null, sleepDurationMinutes: null }
  }

  const count = history.length
  const steps = history.reduce((sum, d) => sum + d.steps, 0) / count
  const cal = history.reduce((sum, d) => sum + d.activeCalories, 0) / count

  const rhrValues = history.filter(d => d.restingHeartRate != null).map(d => d.restingHeartRate!)
  const hrvValues = history.filter(d => d.avgHrv != null).map(d => d.avgHrv!)
  const sleepValues = history.filter(d => d.sleepDurationMinutes != null).map(d => d.sleepDurationMinutes!)

  return {
    steps: Math.round(steps),
    activeCalories: cal,
    restingHeartRate: rhrValues.length > 0 ? rhrValues.reduce((a, b) => a + b, 0) / rhrValues.length : null,
    avgHrv: hrvValues.length > 0 ? hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length : null,
    sleepDurationMinutes: sleepValues.length > 0 ? sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length : null,
  }
}
