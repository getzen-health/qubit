import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'
import { calculateDentalScore, defaultDentalLog } from '@/lib/dental-health'
import type { DentalLog } from '@/lib/dental-health'

// GET /api/dental — last 30 logs + current score + 7-day trend + dentist reminder
export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (_req, { user, supabase }) => {
    const since30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

    const { data: logs, error } = await supabase
      .from('dental_logs')
      .select('*')
      .eq('user_id', user!.id)
      .gte('date', since30)
      .order('date', { ascending: false })
      .limit(30)

    if (error) return secureErrorResponse(error.message, 500)

    const dentalLogs: DentalLog[] = (logs ?? []).map((l) => ({
      id: l.id as string,
      user_id: l.user_id as string,
      date: l.date as string,
      brushing_count: (l.brushing_count as number) ?? 0,
      brushing_duration_sec: (l.brushing_duration_sec as number) ?? 0,
      flossed: (l.flossed as boolean) ?? false,
      mouthwash: (l.mouthwash as boolean) ?? false,
      tongue_scraper: (l.tongue_scraper as boolean) ?? false,
      oil_pulling: (l.oil_pulling as boolean) ?? false,
      water_flosser: (l.water_flosser as boolean) ?? false,
      sugar_exposures: (l.sugar_exposures as number) ?? 0,
      fluoride_used: (l.fluoride_used as boolean) ?? false,
      dry_mouth: (l.dry_mouth as boolean) ?? false,
      acidic_beverages: (l.acidic_beverages as number) ?? 0,
      snacking_count: (l.snacking_count as number) ?? 0,
      sensitivity_areas: (l.sensitivity_areas as string[]) ?? [],
      bleeding_gums: (l.bleeding_gums as boolean) ?? false,
      notes: (l.notes as string) ?? '',
      last_dentist_visit: (l.last_dentist_visit as string) ?? undefined,
      created_at: l.created_at as string,
    }))

    const today = new Date().toISOString().slice(0, 10)
    const todayLog = dentalLogs.find((l) => l.date === today) ?? defaultDentalLog(today)
    const score = calculateDentalScore(todayLog)

    const trend = [...dentalLogs]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((l) => {
        const s = calculateDentalScore(l)
        return {
          date: l.date,
          score: s.total,
          grade: s.grade,
          brushing_count: l.brushing_count,
          flossed: l.flossed,
          sugar_exposures: l.sugar_exposures,
        }
      })

    return secureJsonResponse({ logs: dentalLogs, todayLog, score, trend })
  }
)

// POST /api/dental — upsert today's dental log
export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const body = await req.json()
    const date = (body.date as string) || new Date().toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from('dental_logs')
      .upsert(
        {
          user_id: user!.id,
          date,
          brushing_count: body.brushing_count != null ? Number(body.brushing_count) : 0,
          brushing_duration_sec: body.brushing_duration_sec != null ? Number(body.brushing_duration_sec) : 0,
          flossed: body.flossed ?? false,
          mouthwash: body.mouthwash ?? false,
          tongue_scraper: body.tongue_scraper ?? false,
          oil_pulling: body.oil_pulling ?? false,
          water_flosser: body.water_flosser ?? false,
          sugar_exposures: body.sugar_exposures != null ? Number(body.sugar_exposures) : 0,
          fluoride_used: body.fluoride_used ?? false,
          dry_mouth: body.dry_mouth ?? false,
          acidic_beverages: body.acidic_beverages != null ? Number(body.acidic_beverages) : 0,
          snacking_count: body.snacking_count != null ? Number(body.snacking_count) : 0,
          sensitivity_areas: body.sensitivity_areas ?? [],
          bleeding_gums: body.bleeding_gums ?? false,
          notes: body.notes || null,
          last_dentist_visit: body.last_dentist_visit || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,date', ignoreDuplicates: false }
      )
      .select()
      .single()

    if (error) return secureErrorResponse(error.message, 500)
    return secureJsonResponse({ data }, 201)
  }
)
