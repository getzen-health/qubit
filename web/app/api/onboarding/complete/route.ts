import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { dob?: string | null; height_cm?: number | null; weight_kg?: number | null } = {}
  try {
    body = await request.json()
  } catch {
    // empty body is fine
  }

  const upsertData: Record<string, unknown> = {
    user_id: user.id,
    onboarding_completed: true,
    updated_at: new Date().toISOString(),
  }
  if (body.dob != null) upsertData.date_of_birth = body.dob
  if (body.height_cm != null) upsertData.height_cm = body.height_cm
  if (body.weight_kg != null) upsertData.weight_kg = body.weight_kg

  const { error } = await supabase.from('user_profiles').upsert(upsertData)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
