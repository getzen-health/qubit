import { z } from 'zod'
import { logger } from '@/lib/logger'
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
      .order('period_start', { ascending: false })
      .limit(6)

    if (error) {
      logger.error('Error fetching cycles:', error)
      return secureErrorResponse('Failed to fetch cycle data', 500)
    }

    if (!cycles || cycles.length === 0) {
      return secureJsonResponse({ current_cycle: null, next_period: null, phase: null })
    }

    const latest = cycles[0]
    const today = new Date().toISOString().slice(0, 10)

    // Days elapsed since last period start
    const msPerDay = 86_400_000
    const dayInCycle = Math.floor((new Date(today).getTime() - new Date(latest.period_start).getTime()) / msPerDay) + 1

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

    // Phase calculation helper
    function getCurrentPhase(lastPeriodStart: string, cycleLength = 28) {
      const start = new Date(lastPeriodStart)
      const today = new Date()
      const dayInCycle = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      const nextPeriod = new Date(start)
      nextPeriod.setDate(start.getDate() + cycleLength)
      const ovulationDay = cycleLength - 14
      let phase
      if (dayInCycle >= 1 && dayInCycle <= 5) phase = 'menstrual'
      else if (dayInCycle <= ovulationDay - 2) phase = 'follicular'
      else if (dayInCycle <= ovulationDay + 1) phase = 'ovulation'
      else if (dayInCycle <= cycleLength) phase = 'luteal'
      else phase = 'unknown'
      return {
        phase,
        dayInCycle,
        nextPeriod: nextPeriod.toISOString().split('T')[0],
        ovulationWindow: `Day ${ovulationDay - 2}–${ovulationDay + 1}`,
      }
    }
    const phaseInfo = getCurrentPhase(latest.period_start, avgLength)

    return secureJsonResponse({
      current_cycle: {
        id: latest.id,
        period_start: latest.period_start,
        period_end: latest.period_end,
        day_in_cycle: phaseInfo.dayInCycle,
        phase: phaseInfo.phase,
        flow_intensity: latest.flow_intensity,
        symptoms: latest.symptoms ?? [],
        notes: latest.notes,
        cycle_length: latest.cycle_length ?? avgLength,
        ovulation_window: phaseInfo.ovulationWindow,
      },
      next_period: {
        predicted_date: phaseInfo.nextPeriod,
        cycle_length_used: avgLength,
      },
      cycles,
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
    const { period_start, period_end, flow_intensity, symptoms, notes, cycle_length } =
      body as any

    if (period_end && period_end < period_start) {
      return secureErrorResponse('end_date must be on or after start_date', 400)
    }

    const { data: cycle, error } = await supabase
      .from('cycle_logs')
      .upsert(
        {
          user_id: user!.id,
          period_start,
          period_end: period_end ?? null,
          flow_intensity: flow_intensity ?? null,
          symptoms: symptoms ?? [],
          notes: notes ?? null,
          cycle_length: cycle_length ?? null,
        },
        { onConflict: 'user_id,period_start' }
      )
      .select()
      .single()

    if (error) {
      logger.error('Error logging cycle:', error)
      return secureErrorResponse('Failed to log cycle', 500)
    }

    return secureJsonResponse({ cycle }, 201)
  }
)
