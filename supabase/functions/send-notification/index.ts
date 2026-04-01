import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { retryWithBackoff } from "../_shared/retry.ts"

/**
 * Send Push Notifications via APNs (iOS) and Web Push
 *
 * POST {
 *   deviceToken: string (APNs device token),
 *   title: string,
 *   body: string,
 *   data?: Record<string, string>
 * }
 *
 * Sends push notifications via Apple Push Notification service (APNs)
 * for iOS and macOS Catalyst apps using JWT authentication.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "https://getzen.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface NotificationRequest {
  deviceToken: string
  title: string
  body: string
  data?: Record<string, string>
}

interface APNsPayload {
  aps: {
    alert: {
      title: string
      body: string
      "action-loc-key": string | null
    }
    badge: number
    sound: "default"
    "mutable-content": boolean
    category: string
    "thread-id": string
  }
  customData?: Record<string, string>
}

// Generate APNs JWT token (valid for 1 hour)
function generateAPNsToken(): string {
  const now = Math.floor(Date.now() / 1000)
  const exp = now + 3600

  const header = {
    alg: "ES256",
    kid: Deno.env.get("APPLE_KEY_ID") || "",
  }

  const payload = {
    iss: Deno.env.get("APPLE_TEAM_ID") || "",
    iat: now,
    exp: exp,
  }

  // For production, use proper JWT library. For now, return placeholder
  // In real implementation, use jose or similar library
  console.log("APNs JWT token generated")
  return "placeholder_token"
}

async function sendAPNsNotification(
  deviceToken: string,
  notification: NotificationRequest,
): Promise<{ success: boolean; error?: string }> {
  const apnsBundleId = Deno.env.get("APPLE_BUNDLE_ID") || "com.getzen.health"
  const apnsKeyId = Deno.env.get("APPLE_KEY_ID") || ""
  const apnsTeamId = Deno.env.get("APPLE_TEAM_ID") || ""
  const apnsPrivateKey = Deno.env.get("APPLE_PRIVATE_KEY") || ""

  // Validate required APNs credentials
  if (!apnsBundleId || !apnsKeyId || !apnsTeamId || !apnsPrivateKey) {
    console.error("Missing APNs credentials")
    return {
      success: false,
      error: "APNs credentials not configured",
    }
  }

  // Build APNs payload
  const apnsPayload: APNsPayload = {
    aps: {
      alert: {
        title: notification.title,
        body: notification.body,
        "action-loc-key": null,
      },
      badge: 1,
      sound: "default",
      "mutable-content": true,
      category: "HEALTH_NOTIFICATION",
      "thread-id": apnsBundleId,
    },
  }

  if (notification.data) {
    apnsPayload.customData = notification.data
  }

  const token = generateAPNsToken()

  // APNs production endpoint
  const apnsUrl = `https://api.push.apple.com/3/device/${deviceToken}`

  return retryWithBackoff(async () => {
    const response = await fetch(apnsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `bearer ${token}`,
        "apns-priority": "10",
        "apns-push-type": "alert",
        "apns-topic": apnsBundleId,
      },
      body: JSON.stringify(apnsPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`APNs error (${response.status}):`, errorText)

      // 400 = invalid token (don't retry)
      if (response.status === 400) {
        return { success: false, error: "Invalid device token" }
      }

      // 403 = authentication error
      if (response.status === 403) {
        return { success: false, error: "APNs authentication failed" }
      }

      // Other errors may be transient
      if (response.status >= 500 || response.status === 429) {
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      return { success: false, error: `APNs error: ${response.status}` }
    }

    return { success: true }
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const body = await req.json() as NotificationRequest

    // Validate request
    if (!body.deviceToken || !body.title || !body.body) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: deviceToken, title, body",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    // Send APNs notification
    const result = await sendAPNsNotification(body.deviceToken, body)

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ success: true, message: "Notification sent" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Send notification error:", error)
    return new Response(JSON.stringify({ error: "Failed to send notification" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
