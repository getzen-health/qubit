import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const subscription = await req.json()
    
    // Validate required fields
    if (!subscription?.endpoint) {
      return NextResponse.json({ error: "Invalid subscription: missing endpoint" }, { status: 400 })
    }

    if (!subscription?.keys?.p256dh) {
      return NextResponse.json({ error: "Invalid subscription: missing keys.p256dh" }, { status: 400 })
    }

    if (!subscription?.keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription: missing keys.auth" }, { status: 400 })
    }

    // Validate endpoint is a valid URL
    try {
      new URL(subscription.endpoint)
    } catch {
      return NextResponse.json({ error: "Invalid subscription: endpoint must be a valid URL" }, { status: 400 })
    }

    await supabase.from("web_push_subscriptions").upsert(
      {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      { onConflict: "user_id,endpoint" }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Push subscription error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to subscribe" },
      { status: 500 }
    )
  }
}
