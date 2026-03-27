import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { calculateAllostaticLoad } from '@/lib/stress'
import type { StressLog } from '@/lib/stress'

// GET /api/stress — last 30 stress logs + allostatic load + trend
export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const since30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

    const [{ data: logs, error }, { data: summary }] = await Promise.all([
      supabase
        .from('stress_logs')
        .select('id, log_date, perceived_stress, ans_state, stressors, stressor_intensity, physical_symptoms, coping_used, notes')
        .eq('user_id', user!.id)
        .gte('log_date', since30)
        .order('log_date', { ascending: false })
        .limit(30),
      supabase
        .from('daily_summaries')
        .select('avg_hrv, resting_hr, sleep_duration_minutes, avg_mood')
        .eq('user_id', user!.id)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    if (error) return secureErrorResponse('Failed to fetch stress logs', 500)

    const stressLogs: StressLog[] = (logs ?? [])
      .filter((l) => l.perceived_stress != null)
      .map((l) => ({
        date: l.log_date as string,
        perceived_stress: l.perceived_stress as number,
        ans_state: (l.ans_state ?? 'stressed') as StressLog['ans_state'],
        stressors: (l.stressors as string[]) ?? [],
        stressor_intensity: (l.stressor_intensity as number) ?? 5,
        physical_symptoms: (l.physical_symptoms as string[]) ?? [],
        coping_used: (l.coping_used as string[]) ?? [],
      }))

    const recoveryData = summary
      ? {
          hrv_ms: summary.avg_hrv ?? undefined,
          resting_hr: summary.resting_hr ?? undefined,
          sleep_hours: summary.sleep_duration_minutes != null ? (summary.sleep_duration_minutes as number) / 60 : undefined,
          mood: summary.avg_mood ?? undefined,
        }
      : undefined

    const allostaticLoad = calculateAllostaticLoad(stressLogs, recoveryData)

    // Build 30-day trend
    const trend = [...stressLogs]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((l) => ({ date: l.date, stress: l.perceived_stress, ans_state: l.ans_state }))

    return secureJsonResponse({ logs: logs ?? [], allostaticLoad, trend, recoveryData })
  }
)

// POST /api/stress — upsert daily stress log
export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const body = await req.json()
    const {
      perceived_stress,
      ans_state,
      stressors,
      stressor_intensity,
      physical_symptoms,
      coping_used,
      notes,
      log_date,
    } = body

    if (!perceived_stress || perceived_stress < 1 || perceived_stress > 10) {
      return secureErrorResponse('perceived_stress must be 1–10', 400)
    }

    const today = (log_date as string) || new Date().toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from('stress_logs')
      .upsert(
        {
          user_id: user!.id,
          log_date: today,
          perceived_stress: Number(perceived_stress),
          ans_state: ans_state || 'stressed',
          stressors: stressors || [],
          stressor_intensity: stressor_intensity ? Number(stressor_intensity) : null,
          physical_symptoms: physical_symptoms || [],
          coping_used: coping_used || [],
          notes: notes || null,
          logged_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,log_date', ignoreDuplicates: false }
      )
      .select()
      .single()

    if (error) return secureErrorResponse('Failed to upsert stress log', 500)
    return secureJsonResponse({ data }, 201)
  }
)
