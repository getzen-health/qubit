import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/security'

export async function POST(request: NextRequest) {
  const rateLimit = await checkRateLimit(request)
  if (!rateLimit.success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { message, sessionId } = body

  if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const response = await fetch(`${supabaseUrl}/functions/v1/coach-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
    },
    body: JSON.stringify({ message, sessionId, userId: user.id }),
  })

  const data = await response.json()
  if (!response.ok) return NextResponse.json({ error: data.error }, { status: response.status })
  return NextResponse.json(data)
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sessionId = new URL(request.url).searchParams.get('sessionId')
  if (!sessionId) return NextResponse.json({ data: [] })

  const { data } = await supabase
    .from('coach_conversations')
    .select('id, role, content, created_at')
    .eq('user_id', user.id)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(20)

  return NextResponse.json({ data: data ?? [] })
}
