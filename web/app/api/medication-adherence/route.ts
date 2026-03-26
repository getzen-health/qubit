import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'

// ─── GET ──────────────────────────────────────────────────────────────────────
// ?resource=medications  → list active medications
// ?resource=logs&date=YYYY-MM-DD  → today's logs
// ?resource=compliance&days=30  → 30-day compliance per medication
// (default, no resource param) → all three in one payload
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const resource = searchParams.get('resource')

  // ── Active medications ────────────────────────────────────────────────────
  if (resource === 'medications') {
    const { data, error } = await supabase
      .from('user_medications')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ medications: data })
  }

  // ── Today's logs ──────────────────────────────────────────────────────────
  if (resource === 'logs') {
    const date = searchParams.get('date') || new Date().toISOString().slice(0, 10)
    const start = `${date}T00:00:00`
    const end = `${date}T23:59:59`
    const { data, error } = await supabase
      .from('medication_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('scheduled_time', start)
      .lte('scheduled_time', end)
      .order('scheduled_time')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ logs: data })
  }

  // ── 30-day compliance ─────────────────────────────────────────────────────
  if (resource === 'compliance') {
    const days = Math.min(90, parseInt(searchParams.get('days') || '30', 10))
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from('medication_logs')
      .select('medication_id, scheduled_time, taken_at, skipped')
      .eq('user_id', user.id)
      .gte('scheduled_time', since)
      .order('scheduled_time')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ logs: data, days })
  }

  // ── Default: full dashboard payload ──────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10)
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [medsResult, logsResult, historyResult] = await Promise.all([
    supabase
      .from('user_medications')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('medication_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('scheduled_time', `${today}T00:00:00`)
      .lte('scheduled_time', `${today}T23:59:59`)
      .order('scheduled_time'),
    supabase
      .from('medication_logs')
      .select('medication_id, scheduled_time, taken_at, skipped')
      .eq('user_id', user.id)
      .gte('scheduled_time', since30)
      .order('scheduled_time'),
  ])

  if (medsResult.error) return NextResponse.json({ error: medsResult.error.message }, { status: 500 })
  if (logsResult.error) return NextResponse.json({ error: logsResult.error.message }, { status: 500 })
  if (historyResult.error) return NextResponse.json({ error: historyResult.error.message }, { status: 500 })

  // Build per-medication compliance stats for the last 30 days
  const medMap = new Map<string, { name: string; taken: number; scheduled: number }>()
  for (const med of medsResult.data ?? []) {
    medMap.set(med.id, { name: med.name, taken: 0, scheduled: 0 })
  }

  const complianceByDate: Record<string, { taken: number; scheduled: number }> = {}
  for (const log of historyResult.data ?? []) {
    const date = (log.scheduled_time as string).slice(0, 10)
    if (!complianceByDate[date]) complianceByDate[date] = { taken: 0, scheduled: 0 }
    complianceByDate[date].scheduled += 1
    if (log.taken_at && !log.skipped) complianceByDate[date].taken += 1

    const medStat = medMap.get(log.medication_id)
    if (medStat) {
      medStat.scheduled += 1
      if (log.taken_at && !log.skipped) medStat.taken += 1
    }
  }

  const chartData = Object.entries(complianceByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date: date.slice(5),
      rate: v.scheduled > 0 ? Math.round((v.taken / v.scheduled) * 100) : 0,
      taken: v.taken,
      scheduled: v.scheduled,
    }))

  const perMedStats = Array.from(medMap.entries()).map(([id, v]) => ({
    medication_id: id,
    name: v.name,
    taken: v.taken,
    scheduled: v.scheduled,
    rate: v.scheduled > 0 ? Math.round((v.taken / v.scheduled) * 100) : 100,
  }))

  const totalTaken = perMedStats.reduce((s, m) => s + m.taken, 0)
  const totalScheduled = perMedStats.reduce((s, m) => s + m.scheduled, 0)
  const overallRate = totalScheduled > 0
    ? Math.round((totalTaken / totalScheduled) * 100)
    : 100

  // Calculate streak (consecutive days at ≥80% compliance)
  const sortedDates = Object.keys(complianceByDate).sort().reverse()
  let streak = 0
  for (const d of sortedDates) {
    const { taken, scheduled } = complianceByDate[d]
    const rate = scheduled > 0 ? (taken / scheduled) * 100 : 100
    if (rate >= 80) streak++
    else break
  }

  return NextResponse.json({
    medications: medsResult.data,
    todayLogs: logsResult.data,
    chartData,
    perMedStats,
    overallRate,
    streak,
  })
}

// ─── POST ─────────────────────────────────────────────────────────────────────
// ?resource=log       → upsert a dose log (taken / skipped)
// ?resource=medication → add a new medication
// ?resource=deactivate → soft-delete (is_active = false)
export async function POST(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const resource = searchParams.get('resource') || 'log'
  const body = await req.json()

  // ── Log a dose ────────────────────────────────────────────────────────────
  if (resource === 'log') {
    const { medication_id, scheduled_time, taken_at, skipped, notes } = body
    if (!medication_id || !scheduled_time) {
      return NextResponse.json({ error: 'medication_id and scheduled_time are required' }, { status: 400 })
    }

    // Verify the medication belongs to this user
    const { data: med } = await supabase
      .from('user_medications')
      .select('id')
      .eq('id', medication_id)
      .eq('user_id', user.id)
      .single()
    if (!med) return NextResponse.json({ error: 'medication not found' }, { status: 404 })

    const { data, error } = await supabase
      .from('medication_logs')
      .upsert(
        {
          user_id: user.id,
          medication_id,
          scheduled_time,
          taken_at: taken_at ?? null,
          skipped: skipped ?? false,
          notes: notes ?? null,
        },
        { onConflict: 'user_id,medication_id,scheduled_time' }
      )
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ log: data })
  }

  // ── Add a medication ──────────────────────────────────────────────────────
  if (resource === 'medication') {
    const {
      name, dose, unit, frequency, times_of_day, with_food,
      start_date, end_date, prescribing_doctor, indication, notes,
    } = body

    if (!name || !frequency || !start_date) {
      return NextResponse.json({ error: 'name, frequency, and start_date are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('user_medications')
      .insert({
        user_id: user.id,
        name,
        dose: dose ?? null,
        unit: unit ?? null,
        frequency,
        times_of_day: times_of_day ?? ['08:00'],
        with_food: with_food ?? false,
        start_date,
        end_date: end_date ?? null,
        prescribing_doctor: prescribing_doctor ?? null,
        indication: indication ?? null,
        notes: notes ?? null,
        is_active: true,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ medication: data }, { status: 201 })
  }

  // ── Deactivate a medication ───────────────────────────────────────────────
  if (resource === 'deactivate') {
    const { medication_id } = body
    if (!medication_id) {
      return NextResponse.json({ error: 'medication_id is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('user_medications')
      .update({ is_active: false })
      .eq('id', medication_id)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'unknown resource' }, { status: 400 })
}
