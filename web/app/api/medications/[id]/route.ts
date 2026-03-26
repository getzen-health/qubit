import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

const VALID_FREQUENCIES = [
  'once_daily',
  'twice_daily',
  'three_times_daily',
  'four_times_daily',
  'as_needed',
  'weekly',
  'biweekly',
  'monthly',
] as const

const VALID_TIMES_OF_DAY = ['morning', 'afternoon', 'evening', 'night'] as const

const medicationUpdateSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    dosage: z.number().positive('Dosage must be greater than 0').optional(),
    unit: z.string().min(1).max(20).optional(),
    frequency: z.enum(VALID_FREQUENCIES).optional(),
    time_of_day: z.array(z.enum(VALID_TIMES_OF_DAY)).min(1).optional(),
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'start_date must be YYYY-MM-DD')
      .optional(),
    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'end_date must be YYYY-MM-DD')
      .nullable()
      .optional(),
    notes: z.string().max(1000).nullable().optional(),
    active: z.boolean().optional(),
  })
  .strict()

// GET /api/medications/[id] — get a specific medication
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
    },
    async (_req, { user, supabase }) => {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('id', id)
        .eq('user_id', user!.id)
        .single()

      if (error || !data) return secureErrorResponse('Medication not found', 404)

      return secureJsonResponse({ medication: data })
    }
  )(request)
}

// PATCH /api/medications/[id] — partially update a medication
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  return createSecureApiHandler(
    {
      rateLimit: 'healthData',
      requireAuth: true,
      auditAction: 'UPDATE',
      auditResource: 'medication',
      bodySchema: medicationUpdateSchema,
    },
    async (_req, { user, body, supabase }) => {
      const updates = body as z.infer<typeof medicationUpdateSchema>

      if (Object.keys(updates).length === 0) {
        return secureErrorResponse('No fields provided for update', 400)
      }

      // Trim string fields before persisting
      const payload: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          payload[key] = typeof value === 'string' ? value.trim() : value
        }
      }

      const { data, error } = await supabase
        .from('medications')
        .update(payload)
        .eq('id', id)
        .eq('user_id', user!.id)
        .select()
        .single()

      if (error) return secureErrorResponse('Failed to update medication', 500)
      if (!data) return secureErrorResponse('Medication not found', 404)

      return secureJsonResponse({ medication: data })
    }
  )(request)
}

// DELETE /api/medications/[id] — hard-delete a medication
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  return createSecureApiHandler(
    {
      rateLimit: 'healthData',
      requireAuth: true,
      auditAction: 'DELETE',
      auditResource: 'medication',
    },
    async (_req, { user, supabase }) => {
      const { error } = await supabase
        .from('medications')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id)

      if (error) return secureErrorResponse('Failed to delete medication', 500)

      return secureJsonResponse({ success: true })
    }
  )(request)
}
