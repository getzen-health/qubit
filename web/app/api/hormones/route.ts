import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'
import { calculateHormoneScores, emptyHormoneLog } from '@/lib/hormone-health'

export async function GET(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const since = new Date()
  since.setDate(since.getDate() - 30)
  const sinceStr = since.toISOString().slice(0, 10)

  const { data: logs, error } = await supabase
    .from('hormone_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', sinceStr)
    .order('date', { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const today = new Date().toISOString().slice(0, 10)
  const todayLog = logs?.find((l) => l.date === today) ?? emptyHormoneLog(today)
  const currentScore = calculateHormoneScores(todayLog)

  const scoredLogs = (logs ?? []).map((l) => ({
    ...l,
    scores: calculateHormoneScores(l),
  }))

  return NextResponse.json({ logs: scoredLogs, currentScore, todayLog })
}

export async function POST(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json()
  const today = body.date ?? new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('hormone_logs')
    .upsert(
      { ...body, user_id: user.id, date: today, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const score = calculateHormoneScores(data)
  return NextResponse.json({ log: data, score })
}
