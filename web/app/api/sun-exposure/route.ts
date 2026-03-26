import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { estimateVitaminD, getSeasonFromMonth } from '@/lib/vitamin-d'

// GET: Return last 7 days logs and total IU
// POST: Log new exposure
// DELETE: Remove a log by id

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sun_exposure_logs')
    .select('*')
    .order('logged_at', { ascending: false })
    .limit(7)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const totalIU = data?.reduce((sum, log) => sum + (log.estimated_iu || 0), 0) || 0
  return NextResponse.json({ logs: data, totalIU })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json()
  // Required: duration_min, uv_index, skin_type, body_exposure, spf, latitude, longitude
  const now = new Date()
  const season = getSeasonFromMonth(now.getMonth() + 1)
  const latitudeRisk = Math.abs(body.latitude) > 50 ? 'high' : Math.abs(body.latitude) > 35 ? 'medium' : 'low'
  const estimated_iu = estimateVitaminD({
    durationMin: body.duration_min,
    uvIndex: body.uv_index,
    skinType: body.skin_type,
    bodyExposure: body.body_exposure,
    spf: body.spf,
    season,
    latitudeRisk
  })
  const { data, error } = await supabase
    .from('sun_exposure_logs')
    .insert([{ ...body, estimated_iu }])
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ log: data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { error } = await supabase.from('sun_exposure_logs').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
