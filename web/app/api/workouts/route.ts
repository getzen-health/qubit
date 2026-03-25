import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { z } from 'zod'

export const POST = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    bodySchema: z.object({
      workout_type: z.string(),
      duration_minutes: z.number().positive(),
      active_calories: z.number().optional().nullable(),
      distance_meters: z.number().optional().nullable(),
      avg_heart_rate: z.number().optional().nullable(),
      notes: z.string().optional().nullable(),
      start_time: z.string().optional().nullable(),
    }),
    auditAction: 'CREATE',
    auditResource: 'workout',
  },
  async (_request, { user, body, supabase }) => {
    const {
      workout_type,
      duration_minutes,
      active_calories,
      distance_meters,
      avg_heart_rate,
      notes,
      start_time,
    } = body as {
      workout_type: string
      duration_minutes: number
      active_calories?: number | null
      distance_meters?: number | null
      avg_heart_rate?: number | null
      notes?: string | null
      start_time?: string | null
    }

    const startTime = start_time ? new Date(start_time) : new Date()
    const endTime = new Date(startTime.getTime() + duration_minutes * 60 * 1000)

    // Compute pace if distance provided
    let avg_pace_per_km: number | null = null
    if (distance_meters && distance_meters > 0 && duration_minutes > 0) {
      const distanceKm = distance_meters / 1000
      const durationSecs = duration_minutes * 60
      avg_pace_per_km = durationSecs / distanceKm
    }

    const { data: workout, error } = await supabase
      .from('workout_records')
      .insert({
        user_id: user!.id,
        workout_type,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: Math.round(duration_minutes),
        active_calories: active_calories || null,
        distance_meters: distance_meters || null,
        avg_heart_rate: avg_heart_rate || null,
        avg_pace_per_km,
        source: 'manual',
        metadata: notes ? { notes } : {},
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating workout:', error)
      return secureErrorResponse('Failed to create workout', 500)
    }

    return secureJsonResponse({ workout }, 201)
  }
)

export const DELETE = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    querySchema: z.object({ id: z.string() }),
    auditAction: 'DELETE',
    auditResource: 'workout',
  },
  async (_request, { user, query, supabase }) => {
    const { id } = query as { id: string }

    const { error } = await supabase
      .from('workout_records')
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id)

    if (error) return secureErrorResponse('Failed to delete workout', 500)

    return secureJsonResponse({ success: true })
  }
)
