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

const medicationCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  dosage: z.number().positive('Dosage must be greater than 0'),
  unit: z.string().min(1, 'Unit is required').max(20),
  frequency: z.enum(VALID_FREQUENCIES, {
    error: `Frequency must be one of: ${VALID_FREQUENCIES.join(', ')}`,
  }),
  time_of_day: z
    .array(z.enum(VALID_TIMES_OF_DAY))
    .min(1, 'At least one time of day is required'),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'start_date must be YYYY-MM-DD'),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'end_date must be YYYY-MM-DD')
    .nullable()
    .optional(),
  notes: z.string().max(1000).nullable().optional(),
  active: z.boolean().default(true),
})

const listQuerySchema = z.object({
  active: z.enum(['true', 'false']).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
})

// GET /api/medications — list user's medications (active only by default)
export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'READ',
    auditResource: 'medication',
    querySchema: listQuerySchema,
  },
  async (_request, { user, query, supabase }) => {
    const { active, page, limit } = query as z.infer<typeof listQuerySchema>

    const pageNum = Math.max(1, parseInt(page ?? '1', 10))
    const pageSize = Math.min(100, Math.max(1, parseInt(limit ?? '50', 10)))
    const offset = (pageNum - 1) * pageSize

    const activeFilter = active !== undefined ? active === 'true' : true

    const { data, error, count } = await supabase
      .from('medications')
      .select('*', { count: 'exact' })
      .eq('user_id', user!.id)
      .eq('active', activeFilter)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) return secureErrorResponse('Failed to fetch medications', 500)

    return secureJsonResponse({
      medications: data ?? [],
      pagination: {
        page: pageNum,
        limit: pageSize,
        total: count ?? 0,
        pages: Math.ceil((count ?? 0) / pageSize),
      },
    })
  }
)

// POST /api/medications — create a new medication
export const POST = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'CREATE',
    auditResource: 'medication',
    bodySchema: medicationCreateSchema,
  },
  async (_request, { user, body, supabase }) => {
    const {
      name,
      dosage,
      unit,
      frequency,
      time_of_day,
      start_date,
      end_date,
      notes,
      active,
    } = body as z.infer<typeof medicationCreateSchema>

    const { data, error } = await supabase
      .from('medications')
      .insert({
        user_id: user!.id,
        name: name.trim(),
        dosage,
        unit: unit.trim(),
        frequency,
        time_of_day,
        start_date,
        end_date: end_date ?? null,
        notes: notes ?? null,
        active: active ?? true,
      })
      .select()
      .single()

    if (error) return secureErrorResponse('Failed to create medication', 500)

    return secureJsonResponse({ medication: data }, 201)
  }
)
