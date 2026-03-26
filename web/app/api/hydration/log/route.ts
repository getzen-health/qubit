import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { amount_ml, drink_type = 'water' } = body
  if (!amount_ml || amount_ml <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  const { data, error } = await supabase.from('water_logs').insert({ user_id: user.id, amount_ml, drink_type }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ log: data })
}
