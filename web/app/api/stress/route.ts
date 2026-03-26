import { z } from 'zod'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
  dateSchema,
} from '@/lib/security'

const VALID_CONTEXT_TAGS = ['work', 'exercise', 'sleep', 'illness', 'caffeine'] as const

const getStressQuerySchema = z.object({
  date: dateSchema.optional(),
})

const logStressBodySchema = z.object({
  stress_level: z.number().int().min(1).max(10),
  notes: z.string().max(500).optional(),
  context_tags: z.array(z.enum(VALID_CONTEXT_TAGS)).max(5).optional().default([]),
  logged_at: z.string().datetime().optional(),
})

/** Replicates hrv_to_stress_level() DB function client-side */
function hrvToStressLevel(hrv: number): number {
  return Math.max(1, Math.min(10, Math.round((200 - hrv) / 18)))
}

// GET /api/stress — today's stress: latest manual log + HRV-derived estimate
export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    querySchema: getStressQuerySchema,
    auditAction: 'READ',
    auditResource: 'health_data',
  },
  async (_request, { user, query, supabase }) => {
    const { date } = query as z.infer<typeof getStressQuerySchema>
    const today = date || new Date().toISOString().slice(0, 10)

    const [{ data: logs, error: logsError }, { data: summary }] = await Promise.all([
      supabase
        .from('stress_logs')
        .select('id, stress_level, source, hrv_input, notes, context_tags, logged_at')
        .eq('user_id', user!.id)
        .gte('logged_at', `${today}T00:00:00.000Z`)
        .lt('logged_at', `${today}T23:59:59.999Z`)
        .order('logged_at', { ascending: false }),
      supabase
        .from('daily_summaries')
        .select('avg_hrv')
        .eq('user_id', user!.id)
        .eq('date', today)
        .maybeSingle(),
    ])

    if (logsError) {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        error: 'Failed to fetch stress logs',
        userId: user!.id,
        date: today,
        message: logsError.message,
      }))
      return secureErrorResponse('Failed to fetch stress logs', 500)
    }

    const manualLogs = (logs ?? []).filter(l => l.source === 'manual')
    const latestManual = manualLogs[0] ?? null

    const hrvDerived =
      summary?.avg_hrv != null
        ? {
            stress_level: hrvToStressLevel(summary.avg_hrv),
            hrv_input: summary.avg_hrv,
            source: 'hrv_derived',
          }
        : null

    const avgManual =
      manualLogs.length > 0
        ? Math.round((manualLogs.reduce((s, l) => s + l.stress_level, 0) / manualLogs.length) * 10) / 10
        : null

    return secureJsonResponse({
      date: today,
      latest_manual: latestManual,
      hrv_derived: hrvDerived,
      daily_average: avgManual,
      log_count: manualLogs.length,
      logs: logs ?? [],
    })
  }
)

// POST /api/stress/log — log a manual stress entry

export async function DELETE(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await supabase.from('stress_logs').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })

export const POST = createSecureApiHandler({
  rateLimit: 'healthData',
  requireAuth: true,
  bodySchema: logStressBodySchema,
  auditAction: 'CREATE',
  auditResource: 'health_data',
  rateLimitPerUser: 60,
},

  {
    rateLimit: 'healthData',
    requireAuth: true,
    bodySchema: logStressBodySchema,
    auditAction: 'CREATE',
    auditResource: 'health_data',
  },
  async (_request, { user, body, supabase, audit }) => {
    const { stress_level, notes, context_tags, logged_at } =
      body as z.infer<typeof logStressBodySchema>

    const timestamp = logged_at || new Date().toISOString()

    const { data: log, error } = await supabase
      .from('stress_logs')
      .insert({
        user_id: user!.id,
        stress_level,
        source: 'manual',
        notes: notes ?? null,
        context_tags: context_tags ?? [],
        logged_at: timestamp,
      })
      .select()
      .single()

    if (error) {
      console.error('Error logging stress:', error)
      return secureErrorResponse('Failed to log stress level', 500)
    }

    await audit.log(user!.id, 'CREATE', 'health_data', {
      resourceId: log.id,
      details: { stress_level, context_tags, source: 'manual' },
    })

    return secureJsonResponse({ log }, 201)
  }
)
