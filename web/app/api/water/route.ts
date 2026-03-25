import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
  waterLogSchema,
  dateSchema,
} from '@/lib/security'

// Query schema for GET requests
const getWaterQuerySchema = z.object({
  date: dateSchema.optional(),
})

// GET /api/water - Get user's water logs
export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    querySchema: getWaterQuerySchema,
    auditAction: 'READ',
    auditResource: 'water_log',
  },
  async (request, { user, query, supabase }) => {
    const { date } = query as z.infer<typeof getWaterQuerySchema>
    const today = date || new Date().toISOString().split('T')[0]

    const { data: dailySummary } = await supabase
      .from('daily_water')
      .select('*')
      .eq('user_id', user!.id)
      .eq('date', today)
      .single()

    const { data: logs, error: logsError } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', user!.id)
      .gte('logged_at', `${today}T00:00:00`)
      .lt('logged_at', `${today}T23:59:59`)
      .order('logged_at', { ascending: false })

    if (logsError) {
      console.error('Error fetching water logs:', logsError)
      return secureErrorResponse('Failed to fetch water logs', 500)
    }

    const { data: settings } = await supabase
      .from('user_nutrition_settings')
      .select('water_target_ml')
      .eq('user_id', user!.id)
      .single()

    const target = settings?.water_target_ml || 2500

    return secureJsonResponse({
      date: today,
      total_ml: dailySummary?.total_ml || 0,
      target_ml: target,
      log_count: dailySummary?.log_count || 0,
      logs: logs || [],
    })
  }
)

// POST /api/water - Log water intake
export const POST = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    bodySchema: waterLogSchema,
    auditAction: 'CREATE',
    auditResource: 'water_log',
  },
  async (request, { user, body, supabase, audit }) => {
    const { amount_ml, logged_at, source } = body as z.infer<typeof waterLogSchema>

    const { data: log, error } = await supabase
      .from('water_logs')
      .upsert({
        user_id: user!.id,
        amount_ml: amount_ml,
        logged_at: logged_at || new Date().toISOString(),
        source: source,
      }, { onConflict: 'user_id,logged_at' })
      .select()
      .single()

    if (error) {
      console.error('Error logging water:', error)
      return secureErrorResponse('Failed to log water', 500)
    }

    // Get updated daily total
    const today = new Date().toISOString().split('T')[0]
    const { data: dailySummary } = await supabase
      .from('daily_water')
      .select('*')
      .eq('user_id', user!.id)
      .eq('date', today)
      .single()

    await audit.log(user!.id, 'CREATE', 'water_log', {
      resourceId: log.id,
      details: { amount_ml, source },
    })

    return secureJsonResponse(
      {
        log,
        daily_total_ml: dailySummary?.total_ml || amount_ml,
      },
      201
    )
  }
)

// DELETE /api/water?id=xxx - Delete a water log
export const DELETE = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'DELETE',
    auditResource: 'water_log',
  },
  async (request, { user, supabase, audit }) => {
    const logId = request.nextUrl.searchParams.get('id')

    if (!logId) {
      return secureErrorResponse('Log ID required', 400)
    }

    // Verify ownership
    const { data: existingLog } = await supabase
      .from('water_logs')
      .select('id')
      .eq('id', logId)
      .eq('user_id', user!.id)
      .single()

    if (!existingLog) {
      return secureErrorResponse('Water log not found', 404)
    }

    const { error } = await supabase
      .from('water_logs')
      .delete()
      .eq('id', logId)
      .eq('user_id', user!.id)

    if (error) {
      console.error('Error deleting water log:', error)
      return secureErrorResponse('Failed to delete log', 500)
    }

    await audit.log(user!.id, 'DELETE', 'water_log', { resourceId: logId })

    return secureJsonResponse({ success: true })
  }
)
