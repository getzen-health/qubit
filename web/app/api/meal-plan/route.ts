import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/security'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: plan } = await supabase
    .from('meal_plans')
    .select('*, meal_plan_items(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return NextResponse.json({ data: plan ?? null })
}

export async function POST(request: NextRequest) {
  const rateLimit = await checkRateLimit(request)
  if (!rateLimit.success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { dietType, allergies } = await request.json()

  // Get user's macro targets
  const { data: goals } = await supabase
    .from('user_goals')
    .select('target_calories, target_protein_g')
    .eq('user_id', user.id)
    .single()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const response = await fetch(`${supabaseUrl}/functions/v1/generate-meal-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
    body: JSON.stringify({
      userId: user.id,
      dietType,
      allergies,
      targetCalories: goals?.target_calories ?? 2000,
      targetProtein: goals?.target_protein_g ?? 150,
    }),
  })

  const data = await response.json()
  if (!response.ok) return NextResponse.json({ error: data.error }, { status: response.status })
  return NextResponse.json(data)
}
