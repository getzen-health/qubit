import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

/**
 * Daily Digest Email Cron Function
 *
 * Scheduled to run daily at 7 AM UTC via pg_cron.
 * Generates personalized AI health insights and sends via email.
 * Only sends to users who have opted in to daily_digest in notification_preferences.
 *
 * Setup (Supabase Dashboard → SQL Editor):
 *   SELECT cron.schedule(
 *     'daily-digest-email',
 *     '0 7 * * *',
 *     $$
 *     SELECT net.http_post(
 *       url := '<YOUR_SUPABASE_URL>/functions/v1/daily-digest-email',
 *       headers := jsonb_build_object(
 *         'Authorization', 'Bearer <YOUR_SERVICE_ROLE_KEY>',
 *         'Content-Type', 'application/json'
 *       ),
 *       body := '{}'::jsonb,
 *       timeout_milliseconds := 600000
 *     ) AS request_id;
 *     $$
 *   );
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "https://kquarks.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const MAX_USERS_PER_RUN = 1000
const DELAY_MS_BETWEEN_USERS = 300

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

async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const resendKey = Deno.env.get("RESEND_API_KEY")
  if (!resendKey) {
    console.error("RESEND_API_KEY not configured")
    return false
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "noreply@kquarks.com",
        to,
        subject,
        html,
      }),
    })

    return response.ok
  } catch (err) {
    console.error("Email sending failed:", err)
    return false
  }
}

function buildEmailHtml(
  userName: string,
  yesterday: DailySummary,
  insight: string
): string {
  const sleepHours = yesterday.sleep_duration_minutes ? (yesterday.sleep_duration_minutes / 60).toFixed(1) : "N/A"
  const stepsFormatted = (yesterday.steps || 0).toLocaleString()
  const distanceKm = yesterday.distance_meters ? (yesterday.distance_meters / 1000).toFixed(1) : "N/A"

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KQuarks Daily Health Digest</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 32px 24px; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 32px 24px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 14px; font-weight: 600; color: #666; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .metric { background: #f3f4f6; border-radius: 6px; padding: 16px; }
    .metric-value { font-size: 28px; font-weight: 700; color: #1f2937; margin: 0; }
    .metric-label { font-size: 12px; color: #666; margin-top: 4px; }
    .insight { background: #f0f9ff; border-left: 4px solid #2563eb; padding: 16px; border-radius: 4px; }
    .insight-title { font-size: 14px; font-weight: 600; color: #1e40af; margin: 0 0 8px 0; }
    .insight-text { font-size: 14px; color: #334155; margin: 0; line-height: 1.6; }
    .footer { background: #f9fafb; padding: 24px; border-top: 1px solid #e5e7eb; text-align: center; }
    .footer p { font-size: 12px; color: #666; margin: 0; }
    .footer a { color: #2563eb; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Good morning, ${escapeHtml(userName)}! 👋</h1>
      <p>Here's your health snapshot from yesterday</p>
    </div>
    
    <div class="content">
      <div class="section">
        <div class="section-title">Yesterday's Activity</div>
        <div class="metrics">
          <div class="metric">
            <p class="metric-value">${stepsFormatted}</p>
            <p class="metric-label">Steps</p>
          </div>
          <div class="metric">
            <p class="metric-value">${distanceKm}</p>
            <p class="metric-label">km Distance</p>
          </div>
          <div class="metric">
            <p class="metric-value">${sleepHours}</p>
            <p class="metric-label">Hours Sleep</p>
          </div>
          <div class="metric">
            <p class="metric-value">${yesterday.avg_hrv || "—"}</p>
            <p class="metric-label">HRV (ms)</p>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="insight">
          <p class="insight-title">💡 Today's Insight</p>
          <p class="insight-text">${escapeHtml(insight)}</p>
        </div>
      </div>

      <div class="section" style="text-align: center;">
        <a href="https://kquarks.vercel.app/dashboard" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
          View Full Dashboard →
        </a>
      </div>
    </div>

    <div class="footer">
      <p>
        This is an automated message from KQuarks. 
        <a href="https://kquarks.vercel.app/settings">Manage preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

async function generateDailyDigestForUser(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  userEmail: string,
  userName: string,
  anthropicKey: string,
  userSummaryCache: Map<string, DailySummary | null>
): Promise<boolean> {
  try {
    const dailySummary = userSummaryCache.get(userId)
    if (!dailySummary) {
      return false
    }

    // Build context for AI insight generation
    const context = `
Today is ${new Date().toISOString().split("T")[0]}.
User ${userName} had this health data yesterday:
- Steps: ${dailySummary.steps ?? 0}
- Distance: ${dailySummary.distance_meters ? (dailySummary.distance_meters / 1000).toFixed(1) : "N/A"} km
- Active Calories: ${dailySummary.active_calories ?? 0}
- Sleep: ${dailySummary.sleep_duration_minutes ? (dailySummary.sleep_duration_minutes / 60).toFixed(1) : "N/A"} hours
- Resting Heart Rate: ${dailySummary.resting_heart_rate ?? "N/A"} bpm
- HRV: ${dailySummary.avg_hrv ?? "N/A"} ms
- Recovery Score: ${dailySummary.recovery_score ?? "N/A"}%

Generate a brief, 1-2 sentence health insight or recommendation based on this data. Be positive and actionable.`

    // Call Claude API for insight
    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      signal: AbortSignal.timeout(10000),
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 256,
        messages: [{ role: "user", content: context }],
      }),
    })

    if (!aiRes.ok) {
      console.error("Claude API error:", aiRes.status)
      return false
    }

    const aiData = await aiRes.json()
    const insight: string = aiData.content?.[0]?.text ?? "Keep up the great work with your health routine!"

    // Build and send email
    const emailHtml = buildEmailHtml(userName, dailySummary as DailySummary, insight)
    const yesterdayStr = new Date(Date.now() - 24 * 3600 * 1000).toISOString().split("T")[0]
    const subject = `${yesterdayStr} - Your Daily Health Snapshot 📊`

    const sent = await sendEmail(userEmail, subject, emailHtml)

    if (sent) {
      // Record that digest was sent
      await supabase.from("email_logs").insert({
        user_id: userId,
        email_type: "daily_digest",
        sent_at: new Date().toISOString(),
        subject,
        recipient: userEmail,
      }).catch(() => {
        // Ignore logging errors
      })
    }

    return sent
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error(`Failed to generate digest for user ${userId}:`, errorMessage)
    return false
  }
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

  try {
    // Find users who have opted in to daily digest
    const { data: usersWithDigest } = await supabaseAdmin
      .from("notification_preferences")
      .select("user_id")
      .eq("daily_digest", true)
      .limit(MAX_USERS_PER_RUN)

    if (!usersWithDigest || usersWithDigest.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: "No users opted in to daily digest" }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      )
    }

    let emailsSent = 0
    let errors = 0

    for (const { user_id } of usersWithDigest) {
      try {
        // Get user email and name
        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.admin.getUserById(user_id)

        if (authError || !authUser) {
          console.warn(`Could not fetch user ${user_id}`)
          continue
        }

        const userEmail = authUser.email
        const userName = authUser.user_metadata?.full_name || userEmail?.split("@")[0] || "User"

        // Generate and send digest
        const sent = await generateDailyDigestForUser(
          supabaseAdmin,
          user_id,
          userEmail!,
          userName,
          anthropicKey
        )

        if (sent) {
          emailsSent++
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        console.error(`Error processing user ${user_id}:`, errorMessage)
        errors++
      }

      // Rate limiting delay
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS_BETWEEN_USERS))
    }

    return new Response(
      JSON.stringify({
        run_at: new Date().toISOString(),
        users_processed: usersWithDigest.length,
        emails_sent: emailsSent,
        errors,
      }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error("Cron function failed:", errorMessage)

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    )
  }
})
