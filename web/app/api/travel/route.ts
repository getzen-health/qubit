import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'

export async function GET(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const [{ data: trips }, { data: vaccinations }] = await Promise.all([
    supabase
      .from('travel_trips')
      .select('*')
      .eq('user_id', user.id)
      .order('departure_date', { ascending: false })
      .limit(50),
    supabase
      .from('travel_vaccinations')
      .select('*')
      .eq('user_id', user.id)
      .order('date_given', { ascending: false })
      .limit(100),
  ])

  return NextResponse.json({ trips: trips ?? [], vaccinations: vaccinations ?? [] })
}

export async function POST(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json()

  if (body.type === 'trip') {
    const { error, data } = await supabase
      .from('travel_trips')
      .insert({
        user_id: user.id,
        destination_country: body.destination_country,
        destination_city: body.destination_city ?? null,
        departure_date: body.departure_date,
        return_date: body.return_date ?? null,
        departure_timezone: body.departure_timezone ?? null,
        arrival_timezone: body.arrival_timezone ?? null,
        max_altitude_m: body.max_altitude_m ?? 0,
        activities: body.activities ?? [],
        health_notes: body.health_notes ?? null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ trip: data })
  }

  if (body.type === 'vaccination') {
    const { error, data } = await supabase
      .from('travel_vaccinations')
      .insert({
        user_id: user.id,
        vaccine_name: body.vaccine_name,
        dose_number: body.dose_number ?? 1,
        date_given: body.date_given,
        expiry_date: body.expiry_date ?? null,
        provider: body.provider ?? null,
        lot_number: body.lot_number ?? null,
        notes: body.notes ?? null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ vaccination: data })
  }

  return NextResponse.json({ error: 'Invalid type. Use "trip" or "vaccination".' }, { status: 400 })
}
