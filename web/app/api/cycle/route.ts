import { z } from 'zod'
import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

const VALID_FLOW_INTENSITIES = ['light', 'moderate', 'heavy'] as const
const VALID_SYMPTOMS = ['cramps', 'mood_changes', 'energy_low', 'bloating', 'headache'] as const

const logCycleSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'start_date must be YYYY-MM-DD'),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'end_date must be YYYY-MM-DD')
    .optional()
    .nullable(),
  flow_intensity: z.enum(VALID_FLOW_INTENSITIES).optional().nullable(),
  symptoms: z.array(z.enum(VALID_SYMPTOMS)).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  cycle_length: z.number().int().min(14).max(60).optional().nullable(),
})

function computePhase(dayOfCycle: number): string {
  if (dayOfCycle <= 5) return 'menstrual'
  if (dayOfCycle <= 13) return 'follicular'
  if (dayOfCycle === 14) return 'ovulation'
  return 'luteal'
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

// GET /api/cycle – current cycle info + next period prediction
export const GET = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    auditAction: 'READ',
    auditResource: 'health_data',
  },
  async (_request, { user, supabase }) => {
    const { data: cycles, error } = await supabase
      .from('menstrual_cycles')
      .select('*')
      .eq('user_id', user!.id)
      .order('start_date', { ascending: false })
      .limit(3)

    if (error) {
      console.error('Error fetching cycles:', error)
      return secureErrorResponse('Failed to fetch cycle data', 500)
    }

    if (!cycles || cycles.length === 0) {
      return secureJsonResponse({ current_cycle: null, next_period: null, phase: null })
    }

    const latest = cycles[0]
    const today = new Date().toISOString().slice(0, 10)

    // Days elapsed since last period start
    const msPerDay = 86_400_000
    const dayOfCycle =
      Math.floor((new Date(today).getTime() - new Date(latest.start_date).getTime()) / msPerDay) +
      1

    // Average cycle length from history or default 28
    const avgLength =
      cycles.length >= 2
        ? Math.round(
            cycles
              .slice(0, -1)
              .reduce((sum, _c, i) => {
                const curr = new Date(cycles[i].start_date).getTime()
                const prev = new Date(cycles[i + 1].start_date).getTime()
                return sum + (curr - prev) / msPerDay
              }, 0) /
              (cycles.length - 1)
          )
        : latest.cycle_length ?? 28

    const nextPeriodDate = addDays(latest.start_date, avgLength)

    return secureJsonResponse({
      current_cycle: {
        id: latest.id,
        start_date: latest.start_date,
        end_date: latest.end_date,
        day_of_cycle: dayOfCycle,
        phase: computePhase(dayOfCycle),
        flow_intensity: latest.flow_intensity,
        symptoms: latest.symptoms ?? [],
        notes: latest.notes,
        cycle_length: latest.cycle_length ?? avgLength,
      },
      next_period: {
        predicted_date: nextPeriodDate,
        cycle_length_used: avgLength,
      },
    })
  }
)

// POST /api/cycle/log – log period start/end (upsert on start_date)
export const POST = createSecureApiHandler(
  {
    rateLimit: 'healthData',
    requireAuth: true,
    bodySchema: logCycleSchema,
    auditAction: 'CREATE',
    auditResource: 'health_data',
  },
  async (_request, { user, body, supabase }) => {
    const { start_date, end_date, flow_intensity, symptoms, notes, cycle_length } =
      body as z.infer<typeof logCycleSchema>

    if (end_date && end_date < start_date) {
      return secureErrorResponse('end_date must be on or after start_date', 400)
    }

    const { data: cycle, error } = await supabase
      .from('menstrual_cycles')
      .upsert(
        {
          user_id: user!.id,
          start_date,
          end_date: end_date ?? null,
          flow_intensity: flow_intensity ?? null,
          symptoms: symptoms ?? [],
          notes: notes ?? null,
          cycle_length: cycle_length ?? null,
        },
        { onConflict: 'user_id,start_date' }
      )
      .select()
      .single()

    if (error) {
      console.error('Error logging cycle:', error)
      return secureErrorResponse('Failed to log cycle', 500)
    }

    return secureJsonResponse({ cycle }, 201)
  }
)
