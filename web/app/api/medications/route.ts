import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .eq('user_id', user.id)
      .order('name')

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching medications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, dosage, unit, frequency, time_of_day, start_date, end_date, notes } = body

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    if (!dosage || dosage <= 0) return NextResponse.json({ error: 'Dosage must be greater than 0' }, { status: 400 })
    if (!unit) return NextResponse.json({ error: 'Unit is required' }, { status: 400 })
    if (!frequency) return NextResponse.json({ error: 'Frequency is required' }, { status: 400 })
    if (!start_date) return NextResponse.json({ error: 'Start date is required' }, { status: 400 })

    const { data, error } = await supabase
      .from('medications')
      .insert({
        user_id: user.id,
        name: name.trim(),
        dosage: parseFloat(dosage),
        unit: unit.trim(),
        frequency,
        time_of_day: time_of_day || [],
        start_date,
        end_date: end_date || null,
        notes: notes?.trim() || null,
        active: true,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating medication:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
