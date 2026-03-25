import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')
  const entryType = searchParams.get('entry_type')

  let query = supabase
    .from('health_annotations')
    .select('*')
    .eq('user_id', user.id)
    .order('entry_date', { ascending: false })

  if (startDate) {
    query = query.gte('entry_date', startDate)
  }

  if (endDate) {
    query = query.lte('entry_date', endDate)
  }

  if (entryType) {
    query = query.eq('entry_type', entryType)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { entry_type, entry_date, note, category } = body

  if (!entry_type || !entry_date || !note) {
    return NextResponse.json(
      { error: 'Missing required fields: entry_type, entry_date, note' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('health_annotations')
    .upsert(
      {
        user_id: user.id,
        entry_type,
        entry_date,
        note,
        category: category || null,
      },
      { onConflict: 'user_id,entry_type,entry_date' }
    )
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data[0], { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id, note, category } = body

  if (!id) {
    return NextResponse.json({ error: 'Missing annotation id' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('health_annotations')
    .update({
      note: note || undefined,
      category: category || undefined,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Annotation not found' }, { status: 404 })
  }

  return NextResponse.json(data[0])
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing annotation id' }, { status: 400 })
  }

  const { error } = await supabase
    .from('health_annotations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
