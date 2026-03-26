import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_ORDER = [
  'health-score',
  'steps',
  'sleep',
  'water',
  'workout',
  'mood',
  'streaks',
  'nutrition',
]

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data } = await supabase
    .from('user_preferences')
    .select('dashboard_card_order, dashboard_hidden_cards')
    .eq('user_id', user.id)
    .single()

  if (!data) {
    return NextResponse.json({
      dashboard_card_order: DEFAULT_ORDER,
      dashboard_hidden_cards: [],
    })
  }
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json()
  const { dashboard_card_order, dashboard_hidden_cards } = body

  const { error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: user.id,
      dashboard_card_order,
      dashboard_hidden_cards,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json({ success: true })
}
