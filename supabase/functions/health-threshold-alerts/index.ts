import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

/**
 * Health Threshold Alerts Cron Function
 *
 * Scheduled to run every 6 hours via pg_cron.
 * Checks users' health metrics against their configured thresholds
 * and sends push notifications when thresholds are crossed.
 *
 * Metrics checked:
 * - Glucose (blood_glucose): low_threshold and high_threshold
 * - Resting Heart Rate: threshold set in notification_preferences
 * - HRV: threshold set as percentage change in notification_preferences
 * - Sleep: sleep duration against minimum preference
 *
 * Debouncing: Won't re-alert for the same metric/threshold within 4 hours
 * Setup (Supabase Dashboard → SQL Editor):
 *   SELECT cron.schedule(
 *     'health-threshold-alerts',
 *     '0 */6 * * *',
 *     $$
 *     SELECT net.http_post(
 *       url := '<YOUR_SUPABASE_URL>/functions/v1/health-threshold-alerts',
 *       headers := jsonb_build_object(
 *         'Authorization', 'Bearer <YOUR_SERVICE_ROLE_KEY>',
 *         'Content-Type', 'application/json'
 *       ),
 *       body := '{}'::jsonb,
 *       timeout_milliseconds := 300000
 *     ) AS request_id;
 *     $$
 *   );
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "https://getzen.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const DEBOUNCE_WINDOW_HOURS = 4
const MAX_USERS_PER_RUN = 100
const DELAY_MS_BETWEEN_USERS = 100

interface UserAlert {
  user_id: string
  metric_type: string // "glucose_low", "glucose_high", "resting_hr", "hrv", "sleep"
  value: number
  threshold: number
}

interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

async function sendPushNotification(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  title: string,
  body: string,
  metricType: string
): Promise<boolean> {
  try {
    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("web_push_subscriptions")
      .select("endpoint, keys")
      .eq("user_id", userId)

    if (subError || !subscriptions || subscriptions.length === 0) {
      return false
    }

    // Get VAPID keys from environment
    const vapidPublicKey = Deno.env.get("NEXT_PUBLIC_VAPID_PUBLIC_KEY")
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")

    if (!vapidPublicKey || !vapidPrivateKey) {
      return false
    }

    let successCount = 0

    for (const sub of subscriptions) {
      try {
        const response = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "Urgency": "high",
            "TTL": "3600",
          },
          body: JSON.stringify({
            title,
            body,
            tag: `health-alert-${metricType}`,
            badge: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect fill='%232563eb' width='192' height='192'/></svg>",
          }),
        })

        if (response.ok) {
          successCount++
        } else if (response.status === 410) {
          // Subscription expired, delete it
          await supabase
            .from("web_push_subscriptions")
            .delete()
            .eq("endpoint", sub.endpoint)
        }
      } catch (err) {
        console.error(`Failed to send push to ${sub.endpoint}:`, err)
      }
    }

    return successCount > 0
  } catch (err) {
    console.error("Error sending push notification:", err)
    return false
  }
}

async function checkAndAlertUser(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  userPrefs: any,
  notifPrefs: any
): Promise<number> {
  const alertsTriggered: UserAlert[] = []
  const now = new Date()
  const since24h = new Date(now.getTime() - 24 * 3600 * 1000).toISOString()
  const debounceTime = new Date(now.getTime() - DEBOUNCE_WINDOW_HOURS * 3600 * 1000).toISOString()

  // Check glucose thresholds
  if (userPrefs?.glucose_alerts_enabled) {
    const { data: glucoseReadings } = await supabase
      .from("health_records")
      .select("value, start_time")
      .eq("user_id", userId)
      .eq("type", "blood_glucose")
      .gte("start_time", since24h)
      .order("start_time", { ascending: false })
      .limit(5)

    if (glucoseReadings && glucoseReadings.length > 0) {
      const latestGlucose = glucoseReadings[0].value
      const lowThreshold = userPrefs.glucose_low_threshold_mgdl || 70
      const highThreshold = userPrefs.glucose_high_threshold_mgdl || 180

      if (latestGlucose < lowThreshold) {
        alertsTriggered.push({
          user_id: userId,
          metric_type: "glucose_low",
          value: latestGlucose,
          threshold: lowThreshold,
        })
      } else if (latestGlucose > highThreshold) {
        alertsTriggered.push({
          user_id: userId,
          metric_type: "glucose_high",
          value: latestGlucose,
          threshold: highThreshold,
        })
      }
    }
  }

  // Check resting heart rate
  if (notifPrefs?.hrv_alerts) {
    const { data: rhrData } = await supabase
      .from("daily_summaries")
      .select("resting_heart_rate, date")
      .eq("user_id", userId)
      .gte("date", since24h.split("T")[0])
      .order("date", { ascending: false })
      .limit(1)

    if (rhrData && rhrData.length > 0 && rhrData[0].resting_heart_rate) {
      const rhr = rhrData[0].resting_heart_rate
      const rhrThreshold = notifPrefs.rhr_threshold_bpm || 10

      // Alert if resting HR is elevated (assuming 60 is baseline)
      if (rhr > 60 + rhrThreshold) {
        alertsTriggered.push({
          user_id: userId,
          metric_type: "resting_hr",
          value: rhr,
          threshold: 60 + rhrThreshold,
        })
      }
    }
  }

  // Check HRV
  if (notifPrefs?.hrv_alerts) {
    const { data: hrvData } = await supabase
      .from("daily_summaries")
      .select("avg_hrv, date")
      .eq("user_id", userId)
      .gte("date", since24h.split("T")[0])
      .order("date", { ascending: false })
      .limit(7)

    if (hrvData && hrvData.length > 1 && hrvData[0].avg_hrv) {
      const currentHrv = hrvData[0].avg_hrv
      const avgHrv = (hrvData.slice(1).reduce((sum, d) => sum + (d.avg_hrv || 0), 0) / (hrvData.length - 1)) || currentHrv
      const hrvThresholdPercent = notifPrefs.hrv_threshold_percent || 20

      // Alert if HRV dropped more than threshold
      if (currentHrv < avgHrv * ((100 - hrvThresholdPercent) / 100)) {
        alertsTriggered.push({
          user_id: userId,
          metric_type: "hrv",
          value: currentHrv,
          threshold: avgHrv * ((100 - hrvThresholdPercent) / 100),
        })
      }
    }
  }

  // Check sleep duration
  if (notifPrefs?.sleep_alerts) {
    const { data: sleepData } = await supabase
      .from("sleep_records")
      .select("duration_minutes, start_time")
      .eq("user_id", userId)
      .gte("start_time", since24h)
      .order("start_time", { ascending: false })
      .limit(1)

    if (sleepData && sleepData.length > 0 && sleepData[0].duration_minutes) {
      const sleepMinutes = sleepData[0].duration_minutes
      const minSleepMinutes = 360 // 6 hours minimum

      if (sleepMinutes < minSleepMinutes) {
        alertsTriggered.push({
          user_id: userId,
          metric_type: "sleep",
          value: sleepMinutes,
          threshold: minSleepMinutes,
        })
      }
    }
  }

  // Check debouncing and send alerts
  let sentCount = 0
  for (const alert of alertsTriggered) {
    try {
      // Check if already alerted in debounce window
      const { data: recentAlerts } = await supabase
        .from("rate_limit_events")
        .select("*")
        .eq("endpoint", `/health-alert/${alert.metric_type}`)
        .eq("identifier", userId)
        .gte("created_at", debounceTime)

      if (recentAlerts && recentAlerts.length > 0) {
        // Already alerted recently, skip
        continue
      }

      // Determine notification message
      let title = "Health Alert"
      let body = ""

      if (alert.metric_type === "glucose_low") {
        title = "Low Glucose"
        body = `Your glucose is ${Math.round(alert.value)} mg/dL (below ${Math.round(alert.threshold)})`
      } else if (alert.metric_type === "glucose_high") {
        title = "High Glucose"
        body = `Your glucose is ${Math.round(alert.value)} mg/dL (above ${Math.round(alert.threshold)})`
      } else if (alert.metric_type === "resting_hr") {
        title = "Elevated Resting HR"
        body = `Your resting HR is ${Math.round(alert.value)} bpm (above ${Math.round(alert.threshold)})`
      } else if (alert.metric_type === "hrv") {
        title = "HRV Drop Alert"
        body = `Your HRV has dropped to ${Math.round(alert.value)} ms (below ${Math.round(alert.threshold)})`
      } else if (alert.metric_type === "sleep") {
        title = "Low Sleep"
        body = `Last night you slept only ${(alert.value / 60).toFixed(1)} hours`
      }

      // Send push notification
      const sent = await sendPushNotification(supabase, userId, title, body, alert.metric_type)

      if (sent) {
        // Record debounce event
        await supabase.from("rate_limit_events").insert({
          key: `/health-alert/${alert.metric_type}:${userId}`,
          endpoint: `/health-alert/${alert.metric_type}`,
          identifier: userId,
          created_at: new Date().toISOString(),
        })

        sentCount++
      }
    } catch (err) {
      console.error(`Failed to process alert for user ${userId}:`, err)
    }
  }

  return sentCount
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

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  try {
    // Get all active users with notification preferences enabled
    const { data: activeUsers } = await supabaseAdmin
      .from("user_devices")
      .select("user_id")
      .gte("last_sync_at", new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString())
      .limit(MAX_USERS_PER_RUN)

    if (!activeUsers || activeUsers.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: "No active users" }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      )
    }

    const uniqueUserIds = [...new Set(activeUsers.map((d: { user_id: string }) => d.user_id))]

    let totalAlertsSent = 0
    let usersProcessed = 0
    let errors = 0

    for (const userId of uniqueUserIds) {
      try {
        const { data: userPrefs } = await supabaseAdmin
          .from("user_preferences")
          .select("*")
          .eq("user_id", userId)
          .single()

        const { data: notifPrefs } = await supabaseAdmin
          .from("notification_preferences")
          .select("*")
          .eq("user_id", userId)
          .single()

        if (!notifPrefs?.anomaly_alerts && !userPrefs?.glucose_alerts_enabled) {
          continue
        }

        const alertCount = await checkAndAlertUser(supabaseAdmin, userId, userPrefs, notifPrefs)
        if (alertCount > 0) {
          totalAlertsSent += alertCount
          usersProcessed++
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        console.error(JSON.stringify({
          timestamp: new Date().toISOString(),
          error: "Failed to check alerts for user",
          userId,
          message: errorMessage,
        }))
        errors++
      }

      await new Promise((resolve) => setTimeout(resolve, DELAY_MS_BETWEEN_USERS))
    }

    return new Response(
      JSON.stringify({
        run_at: new Date().toISOString(),
        total_users_checked: uniqueUserIds.length,
        users_with_alerts: usersProcessed,
        alerts_sent: totalAlertsSent,
        errors,
      }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      error: "Cron function failed",
      message: errorMessage,
    }))

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      }
    )
  }
})
