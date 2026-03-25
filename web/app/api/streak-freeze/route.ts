import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, getClientIdentifier, createRateLimitHeaders } from "@/lib/security/rate-limit"

export async function POST(req: NextRequest) {
  // Rate limit: 5 freeze attempts per hour
  const clientId = getClientIdentifier(req)
  const rateLimit = await checkRateLimit(clientId, 'streakFreeze')
  if (!rateLimit.allowed) {
    const response = NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 }
    )
    Object.entries(createRateLimitHeaders(0, rateLimit.resetIn)).forEach(([key, value]) => {
      response.headers.set(key, String(value))
    })
    return response
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { streakType } = body

    if (!streakType) {
      return NextResponse.json({ error: "streakType required" }, { status: 400 })
    }

    // Check freeze availability
    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("streak_freezes_available, streak_freeze_used_date")
      .eq("user_id", user.id)
      .single()

    const today = new Date().toISOString().split("T")[0]

    if (!prefs || prefs.streak_freezes_available <= 0) {
      return NextResponse.json(
        { error: "No freezes available" },
        { status: 400 }
      )
    }

    if (prefs.streak_freeze_used_date === today) {
      return NextResponse.json(
        { error: "Already used a freeze today" },
        { status: 400 }
      )
    }

    // Consume freeze
    await supabase
      .from("user_preferences")
      .update({
        streak_freezes_available: prefs.streak_freezes_available - 1,
        streak_freeze_used_date: today,
      })
      .eq("user_id", user.id)

    // Log the event
    await supabase.from("streak_events").insert({
      user_id: user.id,
      streak_type: streakType,
      event_type: "frozen",
      event_date: today,
    })

    return NextResponse.json({
      success: true,
      freezesRemaining: prefs.streak_freezes_available - 1,
    })
  } catch (error) {
    console.error("Streak freeze error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
