import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { medication_id, taken_at, skipped, notes } = body

    if (!medication_id) {
      return NextResponse.json({ error: 'Medication ID is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('medication_logs')
      .insert({
        user_id: user.id,
        medication_id,
        taken_at: taken_at || new Date().toISOString(),
        skipped: skipped || false,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating medication log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Log ID is required' }, { status: 400 })

    const { error } = await supabase
      .from('medication_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting medication log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
