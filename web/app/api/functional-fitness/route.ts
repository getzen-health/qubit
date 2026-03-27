import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { analyzeFunctionalFitness, type FunctionalFitnessTest } from '@/lib/functional-fitness'
import { z } from 'zod'

const functionalFitnessQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).optional(),
})

export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true, querySchema: functionalFitnessQuerySchema },
  async (_req, { user, query, supabase }) => {
    const { limit: limitStr } = query as z.infer<typeof functionalFitnessQuerySchema>
    const limit = Math.min(parseInt(limitStr ?? '50'), 100)

    const { data, error } = await supabase
      .from('functional_fitness_tests')
      .select('*')
      .eq('user_id', user!.id)
      .order('date', { ascending: false })
      .limit(limit)

    if (error) return secureErrorResponse(error.message, 500)

    const tests = (data ?? []) as FunctionalFitnessTest[]
    const analysed = tests.map(t => ({ test: t, analysis: analyzeFunctionalFitness(t) }))

    return secureJsonResponse({ tests: analysed, count: analysed.length })
  }
)

export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const body = await req.json() as Partial<FunctionalFitnessTest>

    if (!body.age || !body.sex || !body.date) {
      return secureErrorResponse('age, sex, and date are required', 400)
    }

    let gait_speed_mps = body.gait_speed_mps
    if (!gait_speed_mps && body.gait_distance_m && body.gait_time_sec && body.gait_time_sec > 0) {
      gait_speed_mps = Number((body.gait_distance_m / body.gait_time_sec).toFixed(3))
    }

    const payload = {
      user_id: user!.id,
      date: body.date,
      age: body.age,
      sex: body.sex,
      height_cm: body.height_cm ?? null,
      weight_kg: body.weight_kg ?? null,
      grip_strength_kg: body.grip_strength_kg ?? null,
      gait_speed_mps: gait_speed_mps ?? null,
      gait_distance_m: body.gait_distance_m ?? null,
      gait_time_sec: body.gait_time_sec ?? null,
      chair_stand_reps: body.chair_stand_reps ?? null,
      balance_eyes_open_sec: body.balance_eyes_open_sec ?? null,
      balance_eyes_closed_sec: body.balance_eyes_closed_sec ?? null,
      walk_6min_meters: body.walk_6min_meters ?? null,
      notes: body.notes ?? null,
    }

    const { data, error } = await supabase
      .from('functional_fitness_tests')
      .insert(payload)
      .select()
      .single()

    if (error) return secureErrorResponse(error.message, 500)

    const analysis = analyzeFunctionalFitness(data as FunctionalFitnessTest)
    return secureJsonResponse({ test: data, analysis }, 201)
  }
)
