import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/habits/manage — create a new habit
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, emoji, target_days } = body

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  // Get current max sort_order
  const { data: existing } = await supabase
    .from('habits')
    .select('sort_order')
    .eq('user_id', user.id)
    .is('archived_at', null)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: user.id,
      name: name.trim(),
      emoji: emoji || '✅',
      target_days: target_days ?? ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      sort_order: nextOrder,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 })
  return NextResponse.json({ habit: data }, { status: 201 })
}

// DELETE /api/habits/manage?id=xxx — archive a habit
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('habits')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'Failed to archive habit' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
