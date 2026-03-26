import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')

  let outdoorAQI = null
  let pm25 = null
  let pm10 = null
  
  if (lat && lon) {
    try {
      const res = await fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,european_aqi,us_aqi&timezone=auto`,
        { next: { revalidate: 1800 } }
      )
      const data = await res.json()
      outdoorAQI = data?.current?.us_aqi ?? null
      pm25 = data?.current?.pm2_5 ?? null
      pm10 = data?.current?.pm10 ?? null
    } catch { /* ignore fetch errors */ }
  }

  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const { data: indoorLogs } = await supabase
    .from('environment_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('logged_at', sevenDaysAgo.toISOString())
    .order('logged_at', { ascending: false })

  return NextResponse.json({ outdoorAQI, pm25, pm10, indoorLogs: indoorLogs ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { data, error } = await supabase.from('environment_logs').insert({ ...body, user_id: user.id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
