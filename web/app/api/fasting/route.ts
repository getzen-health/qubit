import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
  startFastingSchema,
  endFastingSchema,
} from '@/lib/security'
import { logger } from '@/lib/logger'

// Query schema for GET requests
const getFastingQuerySchema = z.object({
  active: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

// GET /api/fasting - Get user's fasting sessions
export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    querySchema: getFastingQuerySchema,
    auditAction: 'READ',
    auditResource: 'fasting_session',
  },
  async (request, { user, query, supabase }) => {
    const { active, limit } = query as z.infer<typeof getFastingQuerySchema>

    let dbQuery = supabase
      .from('fasting_sessions')
      .select('*')
      .eq('user_id', user!.id)
      .order('started_at', { ascending: false })
      .limit(limit)

    if (active) {
      dbQuery = dbQuery.is('ended_at', null)
    }

    const { data: sessions, error } = await dbQuery

    if (error) {
      logger.error('Error fetching fasting sessions:', error)
      return secureErrorResponse('Failed to fetch sessions', 500)
    }

    const { data: settings } = await supabase
      .from('user_nutrition_settings')
      .select('default_fasting_protocol, default_fasting_hours')
      .eq('user_id', user!.id)
      .single()

    const activeSession = sessions?.find((s) => !s.ended_at)
    let activeSessionWithElapsed = null

    if (activeSession) {
      const startedAt = new Date(activeSession.started_at)
      const now = new Date()
      const elapsedMs = now.getTime() - startedAt.getTime()
      const elapsedHours = elapsedMs / (1000 * 60 * 60)

      activeSessionWithElapsed = {
        ...activeSession,
        elapsed_hours: Math.round(elapsedHours * 100) / 100,
        remaining_hours: Math.max(0, activeSession.target_hours - elapsedHours),
        progress_percent: Math.min(100, (elapsedHours / activeSession.target_hours) * 100),
      }
    }

    return secureJsonResponse({
      active_session: activeSessionWithElapsed,
      recent_sessions: sessions?.filter((s) => s.ended_at) || [],
      default_protocol: settings?.default_fasting_protocol || '16:8',
      default_hours: settings?.default_fasting_hours || 16,
    })
  }
)

// POST /api/fasting - Start a new fasting session
export const POST = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    bodySchema: startFastingSchema,
    auditAction: 'CREATE',
    auditResource: 'fasting_session',
  },
  async (request, { user, body, supabase, audit }) => {
    const fastingData = body as z.infer<typeof startFastingSchema>

    // Check for existing active session
    const { data: existingActive } = await supabase
      .from('fasting_sessions')
      .select('id')
      .eq('user_id', user!.id)
      .is('ended_at', null)
      .single()

    if (existingActive) {
      return secureErrorResponse(
        'You already have an active fasting session. End it first.',
        400
      )
    }

    const { data: session, error } = await supabase
      .from('fasting_sessions')
      .upsert({
        user_id: user!.id,
        protocol: fastingData.protocol,
        target_hours: fastingData.target_hours,
        started_at: fastingData.started_at || new Date().toISOString(),
        notes: fastingData.notes,
      }, { onConflict: 'user_id,started_at' })
      .select()
      .single()

    if (error) {
      logger.error('Error creating fasting session:', error)
      return secureErrorResponse('Failed to start fasting', 500)
    }

    await audit.log(user!.id, 'CREATE', 'fasting_session', {
      resourceId: session.id,
      details: {
        protocol: fastingData.protocol,
        target_hours: fastingData.target_hours,
      },
    })

    return secureJsonResponse({ session }, 201)
  }
)

// PATCH /api/fasting - End an active fasting session
export const PATCH = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    bodySchema: endFastingSchema,
    auditAction: 'UPDATE',
    auditResource: 'fasting_session',
  },
  async (request, { user, body, supabase, audit }) => {
    const endData = body as z.infer<typeof endFastingSchema>

    const { data: activeSession, error: fetchError } = await supabase
      .from('fasting_sessions')
      .select('*')
      .eq('user_id', user!.id)
      .is('ended_at', null)
      .single()

    if (fetchError || !activeSession) {
      return secureErrorResponse('No active fasting session found', 404)
    }

    const startedAt = new Date(activeSession.started_at)
    const endedAt = endData.ended_at ? new Date(endData.ended_at) : new Date()
    const actualHours = (endedAt.getTime() - startedAt.getTime()) / (1000 * 60 * 60)
    const completed = actualHours >= activeSession.target_hours

    const { data: session, error } = await supabase
      .from('fasting_sessions')
      .update({
        ended_at: endedAt.toISOString(),
        actual_hours: Math.round(actualHours * 100) / 100,
        completed,
        notes: endData.notes || activeSession.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', activeSession.id)
      .select()
      .single()

    if (error) {
      logger.error('Error ending fasting session:', error)
      return secureErrorResponse('Failed to end fasting', 500)
    }

    await audit.log(user!.id, 'UPDATE', 'fasting_session', {
      resourceId: activeSession.id,
      details: {
        actual_hours: Math.round(actualHours * 100) / 100,
        completed,
      },
    })

    return secureJsonResponse({
      session,
      completed,
      actual_hours: Math.round(actualHours * 100) / 100,
    })
  }
)

// DELETE /api/fasting?id=xxx - Delete a fasting session
export const DELETE = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'DELETE',
    auditResource: 'fasting_session',
  },
  async (request, { user, supabase, audit }) => {
    const sessionId = request.nextUrl.searchParams.get('id')

    if (!sessionId) {
      return secureErrorResponse('Session ID required', 400)
    }

    // Verify ownership
    const { data: existingSession } = await supabase
      .from('fasting_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', user!.id)
      .single()

    if (!existingSession) {
      return secureErrorResponse('Fasting session not found', 404)
    }

    const { error } = await supabase
      .from('fasting_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user!.id)

    if (error) {
      logger.error('Error deleting fasting session:', error)
      return secureErrorResponse('Failed to delete session', 500)
    }

    await audit.log(user!.id, 'DELETE', 'fasting_session', { resourceId: sessionId })

    return secureJsonResponse({ success: true })
  }
)
