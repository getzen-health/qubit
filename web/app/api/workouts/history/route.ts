import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const type = url.searchParams.get('type')
  const page = parseInt(url.searchParams.get('page') ?? '1')
  const pageSize = 20

  let query = supabase
    .from('workout_logs')
    .select('id, type, workout_date, duration_minutes, calories, notes')
    .eq('user_id', user.id)
    .order('workout_date', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (type && type !== 'all') {
    query = query.eq('type', type)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: data ?? [], page, hasMore: (data?.length ?? 0) === pageSize })
}
