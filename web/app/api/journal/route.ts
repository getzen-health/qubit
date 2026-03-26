import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'

export async function GET(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: entries, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('entry_date', { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Compute streak and mood trend
  let streak = 0, prev = null, avgMood = 0, count = 0
  for (const e of [...entries].reverse()) {
    if (e.mood_score) { avgMood += e.mood_score; count++ }
    if (prev && new Date(e.entry_date).getTime() !== prev + 86400000) break
    streak++
    prev = new Date(e.entry_date).getTime()
  }
  avgMood = count ? avgMood / count : null
  return NextResponse.json({ entries, streak, avgMood })
}

export async function POST(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const body = await req.json()
  const today = new Date().toISOString().slice(0, 10)
  const { error, data } = await supabase
    .from('journal_entries')
    .upsert({ ...body, user_id: user.id, entry_date: today }, { onConflict: ['user_id', 'entry_date'] })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entry: data })
}
