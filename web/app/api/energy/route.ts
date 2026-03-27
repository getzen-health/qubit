import { z } from 'zod'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'
import { analyzeEnergy } from '@/lib/energy-management'
import type { EnergyLog } from '@/lib/energy-management'

const energyLogSchema = z.object({
  level: z.number().int().min(1).max(10),
  notes: z.string().max(500).optional(),
  logged_at: z.string().datetime().optional(),
})

// GET /api/energy — last 30 logs + energy analysis + 7-day trend
export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const since30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

    const { data: logs, error } = await supabase
      .from('energy_logs')
      .select('*')
      .eq('user_id', user!.id)
      .gte('date', since30)
      .order('date', { ascending: false })
      .limit(30)

    if (error) return secureErrorResponse(error.message, 500)

    const today = new Date().toISOString().slice(0, 10)
    const todayLog = (logs ?? []).find((l) => l.date === today)

    const analysis = todayLog
      ? analyzeEnergy({
          ...(todayLog as unknown as EnergyLog),
          ultradian_cycles: (todayLog.ultradian_cycles as EnergyLog['ultradian_cycles']) ?? [],
          energy_ratings: (todayLog.energy_ratings as EnergyLog['energy_ratings']) ?? [],
        })
      : null

    // 7-day trend: energy debt per day
    const trend = [...(logs ?? [])]
      .slice(0, 7)
      .reverse()
      .map((l) => ({
        date: l.date as string,
        energyDebt: analyzeEnergy({
          ...(l as unknown as EnergyLog),
          ultradian_cycles: (l.ultradian_cycles as EnergyLog['ultradian_cycles']) ?? [],
          energy_ratings: (l.energy_ratings as EnergyLog['energy_ratings']) ?? [],
        }).energyDebt,
        sleepHours: l.sleep_hours as number,
        steps: l.steps as number,
      }))

    return secureJsonResponse({ logs: logs ?? [], analysis, trend, today: todayLog ?? null })
  }
)

// POST /api/energy — upsert today's energy log
export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true, bodySchema: energyLogSchema },
  async (_req, { user, supabase, body }) => {
    const { level, notes, logged_at } = body as z.infer<typeof energyLogSchema>

    const date = logged_at
      ? logged_at.split('T')[0]
      : new Date().toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from('energy_logs')
      .upsert(
        {
          user_id: user!.id,
          date,
          level,
          notes: notes ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,date', ignoreDuplicates: false },
      )
      .select()
      .single()

    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ data }, 201)
  }
)
