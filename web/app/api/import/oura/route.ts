import { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

export const runtime = 'nodejs'

// ---------------------------------------------------------------------------
// Zod schemas for Oura export format
// ---------------------------------------------------------------------------

const OuraSleepItem = z.object({
  day:                    z.string(),
  total_sleep_duration:   z.number().optional(),
  deep_sleep_duration:    z.number().optional(),
  rem_sleep_duration:     z.number().optional(),
  light_sleep_duration:   z.number().optional(),
  score:                  z.number().optional(),
})

const OuraActivityItem = z.object({
  day:             z.string(),
  steps:           z.number().optional(),
  active_calories: z.number().optional(),
  score:           z.number().optional(),
})

const OuraImportBody = z.object({
  sleepData:    z.array(OuraSleepItem).optional().default([]),
  activityData: z.array(OuraActivityItem).optional().default([]),
})

type OuraBody = z.infer<typeof OuraImportBody>

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export const POST = createSecureApiHandler(
  { rateLimit: 'import', requireAuth: true, bodySchema: OuraImportBody },
  async (_req: NextRequest, { user, body, supabase }) => {
    const parsed = body as OuraBody
    const { sleepData, activityData } = parsed

    if (!sleepData?.length && !activityData?.length) {
      return secureErrorResponse('No data found in payload', 400)
    }

    const byDate = new Map<string, Record<string, unknown>>()

    const ensureDay = (day: string): Record<string, unknown> => {
      if (!byDate.has(day)) {
        byDate.set(day, { user_id: user!.id, date: day, updated_at: new Date().toISOString() })
      }
      return byDate.get(day)!
    }

    for (const s of sleepData ?? []) {
      const rec = ensureDay(s.day)
      if (s.total_sleep_duration != null) {
        rec.sleep_duration_minutes = Math.round(s.total_sleep_duration / 60)
      }
      if (s.score != null) rec.sleep_quality_score = s.score
    }

    for (const a of activityData ?? []) {
      const rec = ensureDay(a.day)
      if (a.steps           != null) rec.steps           = a.steps
      if (a.active_calories != null) rec.active_calories = a.active_calories
      if (a.score           != null) rec.recovery_score  = a.score
    }

    let imported = 0
    let skipped  = 0

    for (const record of byDate.values()) {
      const { error } = await supabase
        .from('daily_summaries')
        .upsert(record, { onConflict: 'user_id,date', ignoreDuplicates: false })

      if (error) skipped++
      else imported++
    }

    return secureJsonResponse({ imported, skipped })
  }
)
