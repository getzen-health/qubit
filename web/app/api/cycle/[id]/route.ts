import { z } from 'zod'
import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

const VALID_FLOW_INTENSITIES = ['light', 'moderate', 'heavy'] as const
const VALID_SYMPTOMS = ['cramps', 'mood_changes', 'energy_low', 'bloating', 'headache'] as const

const patchCycleSchema = z.object({
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'end_date must be YYYY-MM-DD')
    .optional()
    .nullable(),
  flow_intensity: z.enum(VALID_FLOW_INTENSITIES).optional().nullable(),
  symptoms: z.array(z.enum(VALID_SYMPTOMS)).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})

// PATCH /api/cycle/[id] – update symptoms, notes, end_date, flow_intensity
export const PATCH = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    bodySchema: patchCycleSchema,
    auditAction: 'UPDATE',
    auditResource: 'health_data',
  },
  async (request, { user, body, supabase }) => {
    const segments = request.nextUrl.pathname.split('/')
    const id = segments[segments.length - 1]

    if (!id || id === 'cycle') {
      return secureErrorResponse('Missing cycle id', 400)
    }

    const { end_date, flow_intensity, symptoms, notes } = body as z.infer<typeof patchCycleSchema>

    // Validate end_date >= start_date if end_date is being set
    if (end_date) {
      const { data: existing, error: fetchError } = await supabase
        .from('menstrual_cycles')
        .select('start_date')
        .eq('id', id)
        .eq('user_id', user!.id)
        .single()

      if (fetchError || !existing) {
        return secureErrorResponse('Cycle not found', 404)
      }

      if (end_date < existing.start_date) {
        return secureErrorResponse('end_date must be on or after start_date', 400)
      }
    }

    const updates: Record<string, unknown> = {}
    if (end_date !== undefined) updates.end_date = end_date
    if (flow_intensity !== undefined) updates.flow_intensity = flow_intensity
    if (symptoms !== undefined) updates.symptoms = symptoms
    if (notes !== undefined) updates.notes = notes

    if (Object.keys(updates).length === 0) {
      return secureErrorResponse('No fields to update', 400)
    }

    const { data: cycle, error } = await supabase
      .from('menstrual_cycles')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user!.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating cycle:', error)
      return secureErrorResponse('Failed to update cycle', 500)
    }

    if (!cycle) {
      return secureErrorResponse('Cycle not found', 404)
    }

    return secureJsonResponse({ cycle })
  }
)
