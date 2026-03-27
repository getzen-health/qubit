import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'

// POST: Join a challenge
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const { data: user } = await supabase.auth.getUser()
  if (!user?.id) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const { id: challenge_id } = await params
  const { error } = await supabase.from('challenge_participants').insert({
    challenge_id,
    user_id: user.id
  })
  if (error && !error.message.includes('duplicate')) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
