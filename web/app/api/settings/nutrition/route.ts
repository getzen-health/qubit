import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const { data } = await supabase
    .from('user_goals')
    .select('target_calories, target_protein_g, target_carbs_g, target_fat_g')
    .eq('user_id', user.id)
    .single()
  
  return NextResponse.json({ data: data ?? { target_calories: 2000, target_protein_g: 150, target_carbs_g: 250, target_fat_g: 65 } })
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  const body = await request.json()
  const { error } = await supabase
    .from('user_goals')
    .upsert({ user_id: user.id, ...body, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
