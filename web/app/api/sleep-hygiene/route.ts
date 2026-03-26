import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function calcHygieneScore(log: {
  consistent_schedule?: boolean
  no_alcohol?: boolean
  no_caffeine_6h?: boolean
  no_screens_1h?: boolean
  room_temp_celsius?: number | null
  room_dark?: boolean
  room_quiet?: boolean
}): { score: number; grade: string } {
  let score = 0
  if (log.consistent_schedule) score += 20
  if (log.no_alcohol) score += 20
  if (log.no_caffeine_6h) score += 15
  if (log.no_screens_1h) score += 15
  if (log.room_temp_celsius && log.room_temp_celsius >= 18 && log.room_temp_celsius <= 22) score += 15
  else if (!log.room_temp_celsius) score += 7 // neutral if not tracked
  if (log.room_dark && log.room_quiet) score += 15
  else if (log.room_dark || log.room_quiet) score += 7

  const grade = score >= 85 ? 'A+' : score >= 70 ? 'A' : score >= 55 ? 'B' : score >= 35 ? 'C' : 'D'
  return { score, grade }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await supabase.from('sleep_hygiene_logs').select('*').eq('user_id', user.id).order('logged_date', { ascending: false }).limit(30)
  const today = new Date().toISOString().slice(0, 10)
  const todayLog = data?.find(l => l.logged_date === today) ?? null
  return NextResponse.json({ logs: data ?? [], today: todayLog })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { score, grade } = calcHygieneScore(body)
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase.from('sleep_hygiene_logs').upsert({
    ...body, user_id: user.id, logged_date: body.logged_date ?? today, hygiene_score: score, hygiene_grade: grade
  }, { onConflict: 'user_id,logged_date' }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ log: data, score, grade })
}
