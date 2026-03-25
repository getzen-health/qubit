import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

/**
 * Weekly Digest Edge Function
 *
 * Sends a weekly health summary email to all active users.
 * Scheduled via pg_cron to run every Monday at 8am UTC.
 *
 * Setup (Supabase Dashboard → SQL Editor):
 *   SELECT cron.schedule(
 *     'weekly-health-digest',
 *     '0 8 * * 1',
 *     $$
 *     SELECT net.http_post(
 *       url := '<YOUR_SUPABASE_URL>/functions/v1/weekly-digest',
 *       headers := jsonb_build_object(
 *         'Authorization', 'Bearer <YOUR_SERVICE_ROLE_KEY>',
 *         'Content-Type', 'application/json'
 *       ),
 *       body := '{}'::jsonb
 *     ) AS request_id;
 *     $$
 *   );
 *
 * Requires RESEND_API_KEY (or SENDGRID_API_KEY) env var.
 * Uses Resend by default — swap to any transactional email provider.
 */

const resendKey = Deno.env.get('RESEND_API_KEY')

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "https://kquarks.vercel.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface WeeklySummary {
  date: string
  steps: number | null
  active_calories: number | null
  sleep_duration_minutes: number | null
  avg_hrv: number | null
  recovery_score: number | null
}

interface WorkoutRecord {
  workout_type: string
  duration_minutes: number | null
  active_calories: number | null
  start_time: string
}

interface UserProfile {
  email: string
  full_name: string | null
  step_goal: number | null
}

function formatMinutes(min: number | null): string {
  if (!min) return "N/A"
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatNum(n: number | null, fallback = "N/A"): string {
  if (n == null) return fallback
  return n.toLocaleString()
}

function weeklyAvg(summaries: WeeklySummary[], key: keyof WeeklySummary): number | null {
  const vals = summaries
    .map((s) => s[key] as number | null)
    .filter((v): v is number => v != null)
  return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
}

function buildEmailHtml(
  name: string,
  summaries: WeeklySummary[],
  workouts: WorkoutRecord[],
  stepGoal: number,
  weekLabel: string
): string {
  const totalSteps = summaries.reduce((a, s) => a + (s.steps ?? 0), 0)
  const goalDays = summaries.filter((s) => (s.steps ?? 0) >= stepGoal).length
  const avgSleep = weeklyAvg(summaries, "sleep_duration_minutes")
  const avgHRV = weeklyAvg(summaries, "avg_hrv")
  const avgRecovery = weeklyAvg(summaries, "recovery_score")
  const totalCalories = summaries.reduce((a, s) => a + (s.active_calories ?? 0), 0)
  const displayName = name || "there"

  const recoveryColor = avgRecovery == null ? "#888"
    : avgRecovery >= 67 ? "#22c55e"
    : avgRecovery >= 34 ? "#f59e0b"
    : "#ef4444"

  const workoutList = workouts
    .slice(0, 5)
    .map((w) => {
      const date = new Date(w.start_time).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #1e293b;">${w.workout_type}</td>
        <td style="padding:8px 0;border-bottom:1px solid #1e293b;text-align:right;">${w.duration_minutes ?? "—"}min</td>
        <td style="padding:8px 0;border-bottom:1px solid #1e293b;text-align:right;">${w.active_calories ?? "—"} kcal</td>
        <td style="padding:8px 0;border-bottom:1px solid #1e293b;text-align:right;color:#94a3b8;">${date}</td>
      </tr>`
    })
    .join("")

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#f8fafc;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="margin:0;font-size:28px;font-weight:700;color:#f8fafc;">KQuarks</h1>
      <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">Weekly Health Digest · ${weekLabel}</p>
    </div>

    <!-- Greeting -->
    <p style="font-size:16px;color:#cbd5e1;margin-bottom:24px;">
      Hey ${displayName} 👋 — here's how your week went.
    </p>

    <!-- Key metrics -->
    <div style="display:grid;gap:12px;margin-bottom:24px;">
      <div style="background:#1e293b;border-radius:12px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Total Steps</div>
          <div style="font-size:28px;font-weight:700;margin-top:4px;">${formatNum(totalSteps)}</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:2px;">${goalDays} of ${summaries.length} days at goal</div>
        </div>
        <div style="font-size:36px;">👣</div>
      </div>

      <div style="display:flex;gap:12px;">
        <div style="flex:1;background:#1e293b;border-radius:12px;padding:16px 20px;">
          <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Avg Sleep</div>
          <div style="font-size:22px;font-weight:700;margin-top:4px;">${formatMinutes(avgSleep)}</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:2px;">per night</div>
        </div>
        <div style="flex:1;background:#1e293b;border-radius:12px;padding:16px 20px;">
          <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Avg HRV</div>
          <div style="font-size:22px;font-weight:700;margin-top:4px;">${formatNum(avgHRV)} ms</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:2px;">heart rate variability</div>
        </div>
      </div>

      <div style="display:flex;gap:12px;">
        <div style="flex:1;background:#1e293b;border-radius:12px;padding:16px 20px;">
          <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Active Calories</div>
          <div style="font-size:22px;font-weight:700;margin-top:4px;">${formatNum(totalCalories)} kcal</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:2px;">total this week</div>
        </div>
        <div style="flex:1;background:#1e293b;border-radius:12px;padding:16px 20px;">
          <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Avg Recovery</div>
          <div style="font-size:22px;font-weight:700;margin-top:4px;color:${recoveryColor};">${formatNum(avgRecovery)}%</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:2px;">readiness score</div>
        </div>
      </div>
    </div>

    ${workouts.length > 0 ? `
    <!-- Workouts -->
    <div style="background:#1e293b;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <h3 style="margin:0 0 12px;font-size:14px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">
        Workouts (${workouts.length})
      </h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tbody>${workoutList}</tbody>
      </table>
    </div>` : ""}

    <!-- CTA -->
    <div style="text-align:center;margin-top:32px;">
      <a href="${Deno.env.get("APP_URL") ?? "https://kquarks.app"}/dashboard"
         style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;text-decoration:none;">
        View Full Dashboard →
      </a>
    </div>

    <!-- Footer -->
    <p style="text-align:center;color:#475569;font-size:12px;margin-top:32px;">
      KQuarks · <a href="${Deno.env.get("APP_URL") ?? "https://kquarks.app"}/settings" style="color:#475569;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`
}

async function sendEmail(to: string, subject: string, html: string, resendKey: string): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "KQuarks <digest@kquarks.app>",
        to,
        subject,
        html,
      }),
      signal: AbortSignal.timeout(15000), // 15s timeout for email sending
    })
    if (!res.ok) {
      const err = await res.text()
      console.error("Resend API error:", err)
      return false
    }
    return true
  } catch (e) {
    if (e instanceof DOMException && e.name === "TimeoutError") {
      console.error("Resend API timed out")
      return false
    }
    throw e
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
  if (!resendKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  // Week range: last 7 days
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000)
  const since7d = weekAgo.toISOString().slice(0, 10)
  const weekLabel = weekAgo.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " – " + new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })

  // Find active users (synced in last 7 days)
  const { data: activeDevices } = await supabase
    .from("user_devices")
    .select("user_id")
    .gte("last_sync_at", weekAgo.toISOString())

  if (!activeDevices || activeDevices.length === 0) {
    return new Response(JSON.stringify({ sent: 0, message: "No active users" }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    })
  }

  const userIds = [...new Set(activeDevices.map((d: { user_id: string }) => d.user_id))]

  // Fetch user profiles from auth.users via admin API
  let sent = 0
  let errors = 0

  for (const userId of userIds.slice(0, 100)) {
    try {
      const { data: authUser } = await supabase.auth.admin.getUserById(userId)
      if (!authUser?.user?.email) continue

      const email = authUser.user.email
      const fullName = authUser.user.user_metadata?.full_name as string | null

      // Fetch user profile for goals
      const { data: profile } = await supabase
        .from("users")
        .select("step_goal,full_name")
        .eq("id", userId)
        .single()

      const stepGoal = profile?.step_goal ?? 10000
      const displayName = profile?.full_name ?? fullName ?? email.split("@")[0]

      // Fetch weekly data in parallel
      const [{ data: summaries }, { data: workouts }] = await Promise.all([
        supabase
          .from("daily_summaries")
          .select("date,steps,active_calories,sleep_duration_minutes,avg_hrv,recovery_score")
          .eq("user_id", userId)
          .gte("date", since7d)
          .order("date", { ascending: true }),
        supabase
          .from("workout_records")
          .select("workout_type,duration_minutes,active_calories,start_time")
          .eq("user_id", userId)
          .gte("start_time", weekAgo.toISOString())
          .gt("duration_minutes", 10)
          .order("start_time", { ascending: false })
          .limit(5),
      ])

      if (!summaries || summaries.length < 3) continue // Skip users with too little data

      const html = buildEmailHtml(displayName, summaries, workouts ?? [], stepGoal, weekLabel)
      const subject = `Your week in review: ${formatNum(
        summaries.reduce((a: number, s: WeeklySummary) => a + (s.steps ?? 0), 0)
      )} steps, ${(workouts ?? []).length} workouts`

      const ok = await sendEmail(email, subject, html, resendKey)
      if (ok) sent++
      else errors++

      // Brief delay to respect Resend rate limits
      await new Promise((r) => setTimeout(r, 100))
    } catch (err) {
      console.error(`Error for user ${userId}:`, err)
      errors++
    }
  }

  return new Response(
    JSON.stringify({
      run_at: new Date().toISOString(),
      week: weekLabel,
      eligible_users: userIds.length,
      sent,
      errors,
    }),
    { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
  )
})
