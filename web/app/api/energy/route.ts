import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'
import { analyzeEnergy } from '@/lib/energy-management'
import type { EnergyLog } from '@/lib/energy-management'

// GET /api/energy — last 30 logs + energy analysis + 7-day trend
export async function GET(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const since30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

  const { data: logs, error } = await supabase
    .from('energy_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', since30)
    .order('date', { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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

  return NextResponse.json({ logs: logs ?? [], analysis, trend, today: todayLog ?? null })
}

// POST /api/energy — upsert today's energy log
export async function POST(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    date,
    wake_time,
    chronotype,
    sleep_hours,
    sleep_quality,
    steps,
    meal_quality_avg,
    caffeine_mg,
    caffeine_time,
    ultradian_cycles,
    energy_ratings,
  } = body

  const today = (date as string) || new Date().toISOString().slice(0, 10)

  if (sleep_quality && (sleep_quality < 1 || sleep_quality > 5))
    return NextResponse.json({ error: 'sleep_quality must be 1–5' }, { status: 400 })

  const { data, error } = await supabase
    .from('energy_logs')
    .upsert(
      {
        user_id: user.id,
        date: today,
        wake_time: wake_time || '07:00',
        chronotype: chronotype || 'intermediate',
        sleep_hours: sleep_hours != null ? Number(sleep_hours) : 7,
        sleep_quality: sleep_quality != null ? Number(sleep_quality) : 3,
        steps: steps != null ? Number(steps) : 0,
        meal_quality_avg: meal_quality_avg != null ? Number(meal_quality_avg) : 3,
        caffeine_mg: caffeine_mg != null ? Number(caffeine_mg) : 0,
        caffeine_time: caffeine_time || '08:00',
        ultradian_cycles: ultradian_cycles || [],
        energy_ratings: energy_ratings || [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,date', ignoreDuplicates: false },
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
