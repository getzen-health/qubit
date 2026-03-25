import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { supplement_id, taken_at, skipped } = body

    if (!supplement_id) {
      return NextResponse.json({ error: 'Supplement ID is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('supplement_logs')
      .insert({
        user_id: user.id,
        supplement_id,
        taken_at: taken_at || new Date().toISOString(),
        skipped: skipped || false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error logging supplement:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
