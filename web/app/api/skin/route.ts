import { z } from 'zod'
import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'
import { calculateSkinScore, defaultSkinLog } from '@/lib/skin-health'
import type { SkinLog } from '@/lib/skin-health'

const postSkinSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  spf_applied: z.boolean().optional(),
  spf_value: z.number().min(0).max(100).optional(),
  spf_reapplied: z.boolean().optional(),
  sun_exposure_min: z.number().min(0).max(1440).optional(),
  water_ml: z.number().min(0).max(10000).optional(),
  vit_c_taken: z.boolean().optional(),
  omega3_taken: z.boolean().optional(),
  lycopene_taken: z.boolean().optional(),
  green_tea_taken: z.boolean().optional(),
  am_routine_done: z.boolean().optional(),
  pm_routine_done: z.boolean().optional(),
  conditions: z.record(z.string(), z.record(z.string(), z.number())).optional(),
  skincare_products: z.array(z.unknown()).optional(),
  uv_index: z.number().min(0).max(20).nullable().optional(),
  notes: z.string().max(1000).optional(),
})

// GET /api/skin — last 30 logs + current score + 7-day trend
// Optional query params: lat, lon for live UV index from Open-Meteo
export const GET = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true },
  async (req, { user, supabase }) => {
    const lat = req.nextUrl.searchParams.get('lat')
    const lon = req.nextUrl.searchParams.get('lon')

    const since30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

    const { data: logs, error } = await supabase
      .from('skin_logs')
      .select('*')
      .eq('user_id', user!.id)
      .gte('date', since30)
      .order('date', { ascending: false })
      .limit(30)

    if (error) return secureErrorResponse('Failed to fetch skin logs', 500)

    // Fetch UV index from Open-Meteo (free, no key needed)
    let uvIndex: number | null = null
    const latitude = lat ?? '37.7749'
    const longitude = lon ?? '-122.4194'
    try {
      const uvResp = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=uv_index_max&forecast_days=1&timezone=auto`,
        { next: { revalidate: 3600 } }
      )
      if (uvResp.ok) {
        const uvData = await uvResp.json()
        uvIndex = uvData?.daily?.uv_index_max?.[0] ?? null
      }
    } catch {
      // UV fetch is best-effort; continue without it
    }

    const skinLogs: SkinLog[] = (logs ?? []).map((l) => ({
      id: l.id as string,
      date: l.date as string,
      spf_applied: (l.spf_applied as boolean) ?? false,
      spf_value: (l.spf_value as number) ?? 30,
      spf_reapplied: (l.spf_reapplied as boolean) ?? false,
      sun_exposure_min: (l.sun_exposure_min as number) ?? 0,
      water_ml: (l.water_ml as number) ?? 0,
      vit_c_taken: (l.vit_c_taken as boolean) ?? false,
      omega3_taken: (l.omega3_taken as boolean) ?? false,
      lycopene_taken: (l.lycopene_taken as boolean) ?? false,
      green_tea_taken: (l.green_tea_taken as boolean) ?? false,
      am_routine_done: (l.am_routine_done as boolean) ?? false,
      pm_routine_done: (l.pm_routine_done as boolean) ?? false,
      conditions: (l.conditions as Record<string, Record<string, number>>) ?? {},
      skincare_products: (l.skincare_products as SkinLog['skincare_products']) ?? [],
      uv_index: (l.uv_index as number) ?? undefined,
      notes: (l.notes as string) ?? '',
    }))

    const today = new Date().toISOString().slice(0, 10)
    const todayLog = skinLogs.find(l => l.date === today) ?? { ...defaultSkinLog(today), uv_index: uvIndex ?? undefined }
    const score = calculateSkinScore({ ...todayLog, uv_index: uvIndex ?? todayLog.uv_index })

    const trend = [...skinLogs]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((l) => ({
        date: l.date,
        score: calculateSkinScore(l).total,
        uv_index: l.uv_index,
        water_ml: l.water_ml,
        spf_applied: l.spf_applied,
      }))

    return secureJsonResponse({ logs: logs ?? [], score, trend, uvIndex })
  }
)

// POST /api/skin — upsert today's skin log
export const POST = createSecureApiHandler(
  { rateLimit: 'healthData', requireAuth: true, bodySchema: postSkinSchema },
  async (_req, { user, supabase, body }) => {
    const b = body as z.infer<typeof postSkinSchema>
    const today = b.date || new Date().toISOString().slice(0, 10)

    const { data, error } = await supabase
      .from('skin_logs')
      .upsert(
        {
          user_id: user!.id,
          date: today,
          spf_applied: b.spf_applied ?? false,
          spf_value: b.spf_value != null ? Number(b.spf_value) : 30,
          spf_reapplied: b.spf_reapplied ?? false,
          sun_exposure_min: b.sun_exposure_min != null ? Number(b.sun_exposure_min) : 0,
          water_ml: b.water_ml != null ? Number(b.water_ml) : 0,
          vit_c_taken: b.vit_c_taken ?? false,
          omega3_taken: b.omega3_taken ?? false,
          lycopene_taken: b.lycopene_taken ?? false,
          green_tea_taken: b.green_tea_taken ?? false,
          am_routine_done: b.am_routine_done ?? false,
          pm_routine_done: b.pm_routine_done ?? false,
          conditions: b.conditions ?? {},
          skincare_products: b.skincare_products ?? [],
          uv_index: b.uv_index != null ? Number(b.uv_index) : null,
          notes: b.notes || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,date', ignoreDuplicates: false }
      )
      .select()
      .single()

    if (error) return secureErrorResponse('Failed to save skin log', 500)
    return secureJsonResponse({ data }, 201)
  }
)
