import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

const logCreateSchema = z.object({
  taken_at: z.string().datetime({ message: 'taken_at must be an ISO 8601 datetime' }).optional(),
  skipped: z.boolean().default(false),
  notes: z.string().max(500).nullable().optional(),
})

const logsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  // how many days back to include (default 30, max 365)
  days: z.string().regex(/^\d+$/).optional(),
})

// POST /api/medications/[id]/logs — record a taken or skipped dose
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  return createSecureApiHandler(
    {
      rateLimit: 'healthData',
      requireAuth: true,
      auditAction: 'CREATE',
      auditResource: 'medication',
      bodySchema: logCreateSchema,
    },
    async (_req, { user, body, supabase }) => {
      const { taken_at, skipped, notes } = body as z.infer<typeof logCreateSchema>

      // Verify the medication belongs to this user before logging
      const { data: med, error: medErr } = await supabase
        .from('medications')
        .select('id')
        .eq('id', id)
        .eq('user_id', user!.id)
        .single()

      if (medErr || !med) return secureErrorResponse('Medication not found', 404)

      const { data, error } = await supabase
        .from('medication_logs')
        .insert({
          user_id: user!.id,
          medication_id: id,
          taken_at: taken_at ?? new Date().toISOString(),
          skipped: skipped ?? false,
          notes: notes ?? null,
        })
        .select()
        .single()

      if (error) return secureErrorResponse('Failed to log medication', 500)

      return secureJsonResponse({ log: data }, 201)
    }
  )(request)
}

// GET /api/medications/[id]/logs — adherence logs for the past N days
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  return createSecureApiHandler(
    {
      rateLimit: 'healthData',
      requireAuth: true,
      auditAction: 'READ',
      auditResource: 'medication',
      querySchema: logsQuerySchema,
    },
    async (_req, { user, query, supabase }) => {
      const { page, limit, days } = query as z.infer<typeof logsQuerySchema>

      const pageNum = Math.max(1, parseInt(page ?? '1', 10))
      const pageSize = Math.min(100, Math.max(1, parseInt(limit ?? '50', 10)))
      const daysBack = Math.min(365, Math.max(1, parseInt(days ?? '30', 10)))
      const offset = (pageNum - 1) * pageSize

      const since = new Date(
        Date.now() - daysBack * 24 * 60 * 60 * 1000
      ).toISOString()

      // Verify medication ownership
      const { data: med, error: medErr } = await supabase
        .from('medications')
        .select('id, name')
        .eq('id', id)
        .eq('user_id', user!.id)
        .single()

      if (medErr || !med) return secureErrorResponse('Medication not found', 404)

      // Fetch paginated logs and full-period adherence stats in parallel
      const [logsResult, statsResult] = await Promise.all([
        supabase
          .from('medication_logs')
          .select('*', { count: 'exact' })
          .eq('medication_id', id)
          .eq('user_id', user!.id)
          .gte('taken_at', since)
          .order('taken_at', { ascending: false })
          .range(offset, offset + pageSize - 1),
        supabase
          .from('medication_logs')
          .select('skipped')
          .eq('medication_id', id)
          .eq('user_id', user!.id)
          .gte('taken_at', since),
      ])

      if (logsResult.error) return secureErrorResponse('Failed to fetch medication logs', 500)

      const totalInPeriod = statsResult.data?.length ?? 0
      const takenInPeriod = statsResult.data?.filter((l) => !l.skipped).length ?? 0
      const skippedInPeriod = statsResult.data?.filter((l) => l.skipped).length ?? 0
      const adherenceRate =
        totalInPeriod > 0 ? Math.round((takenInPeriod / totalInPeriod) * 100) : null

      return secureJsonResponse({
        medication_id: id,
        logs: logsResult.data ?? [],
        adherence: {
          taken: takenInPeriod,
          skipped: skippedInPeriod,
          total: totalInPeriod,
          rate_percent: adherenceRate,
          period_days: daysBack,
          since,
        },
        pagination: {
          page: pageNum,
          limit: pageSize,
          total: logsResult.count ?? 0,
          pages: Math.ceil((logsResult.count ?? 0) / pageSize),
        },
      })
    }
  )(request)
}
