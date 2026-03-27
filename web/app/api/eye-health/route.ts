import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { calculateEyeScore, breaksTarget } from '@/lib/eye-health'
import type { EyeHealthLog } from '@/lib/eye-health'

// GET /api/eye-health — last 30 logs + eye health score + trend
export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'READ',
    auditResource: 'eye_health',
  },
  async (_request, { user, supabase }) => {
    const since30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

    const { data: logs, error } = await supabase
      .from('eye_health_logs')
      .select('id, logged_at, screen_hours, outdoor_minutes, breaks_taken, breaks_target, symptoms, blink_reminder_used, notes')
      .eq('user_id', user!.id)
      .gte('logged_at', since30)
      .order('logged_at', { ascending: false })
      .limit(30)

    if (error) return secureErrorResponse('Failed to fetch eye health logs', 500)

    const eyeLogs: EyeHealthLog[] = (logs ?? []).map((l) => ({
      date: l.logged_at as string,
      screen_hours: (l.screen_hours as number) ?? 0,
      outdoor_minutes: (l.outdoor_minutes as number) ?? 0,
      breaks_taken: (l.breaks_taken as number) ?? 0,
      breaks_target: (l.breaks_target as number) ?? breaksTarget((l.screen_hours as number) ?? 0),
      symptoms: (l.symptoms as string[]) ?? [],
      blink_reminder_used: (l.blink_reminder_used as boolean) ?? false,
    }))

    const score = calculateEyeScore(eyeLogs)

    const trend = [...eyeLogs]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((l) => ({
        date: l.date,
        screen_hours: l.screen_hours,
        outdoor_minutes: l.outdoor_minutes,
        breaks_taken: l.breaks_taken,
        breaks_target: l.breaks_target,
      }))

    return secureJsonResponse({ logs: logs ?? [], score, trend })
  }
)

// POST /api/eye-health — upsert today's eye health log
export const POST = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'CREATE',
    auditResource: 'eye_health',
  },
  async (request, { user, supabase }) => {
    const body = await request.json()
    const {
      screen_hours,
      outdoor_minutes,
      breaks_taken,
      symptoms,
      blink_reminder_used,
      notes,
      logged_at,
    } = body

    const today = (logged_at as string) || new Date().toISOString().slice(0, 10)
    const screenH = screen_hours != null ? Number(screen_hours) : 0
    const target = breaksTarget(screenH)

    const { data, error } = await supabase
      .from('eye_health_logs')
      .upsert(
        {
          user_id: user!.id,
          logged_at: today,
          screen_hours: screenH,
          outdoor_minutes: outdoor_minutes != null ? Number(outdoor_minutes) : 0,
          breaks_taken: breaks_taken != null ? Number(breaks_taken) : 0,
          breaks_target: target,
          symptoms: symptoms || [],
          blink_reminder_used: blink_reminder_used ?? false,
          notes: notes || null,
        },
        { onConflict: 'user_id,logged_at', ignoreDuplicates: false }
      )
      .select()
      .single()

    if (error) return secureErrorResponse('Failed to save eye health log', 500)
    return secureJsonResponse({ data }, 201)
  }
)
