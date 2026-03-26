import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'
import { calculateSkinScore, defaultSkinLog } from '@/lib/skin-health'
import type { SkinLog } from '@/lib/skin-health'

// GET /api/skin — last 30 logs + current score + 7-day trend
// Optional query params: lat, lon for live UV index from Open-Meteo
export async function GET(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')

  const since30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

  const { data: logs, error } = await supabase
    .from('skin_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', since30)
    .order('date', { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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

  return NextResponse.json({ logs: logs ?? [], score, trend, uvIndex })
}

// POST /api/skin — upsert today's skin log
export async function POST(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const today = (body.date as string) || new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('skin_logs')
    .upsert(
      {
        user_id: user.id,
        date: today,
        spf_applied: body.spf_applied ?? false,
        spf_value: body.spf_value != null ? Number(body.spf_value) : 30,
        spf_reapplied: body.spf_reapplied ?? false,
        sun_exposure_min: body.sun_exposure_min != null ? Number(body.sun_exposure_min) : 0,
        water_ml: body.water_ml != null ? Number(body.water_ml) : 0,
        vit_c_taken: body.vit_c_taken ?? false,
        omega3_taken: body.omega3_taken ?? false,
        lycopene_taken: body.lycopene_taken ?? false,
        green_tea_taken: body.green_tea_taken ?? false,
        am_routine_done: body.am_routine_done ?? false,
        pm_routine_done: body.pm_routine_done ?? false,
        conditions: body.conditions ?? {},
        skincare_products: body.skincare_products ?? [],
        uv_index: body.uv_index != null ? Number(body.uv_index) : null,
        notes: body.notes || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,date', ignoreDuplicates: false }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
