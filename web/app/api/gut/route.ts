import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'
import { calculateGutScore, emptyGutLog } from '@/lib/gut-health'

export async function GET(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const since = new Date()
  since.setDate(since.getDate() - 30)
  const sinceStr = since.toISOString().slice(0, 10)

  const { data: logs, error } = await supabase
    .from('gut_health_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', sinceStr)
    .order('date', { ascending: false })
    .limit(30)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Weekly plant count: sum of plant_species_count across last 7 days
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString().slice(0, 10)
  const weeklyPlantCount = (logs ?? [])
    .filter((l) => l.date >= weekAgoStr)
    .reduce((sum: number, l: { plant_species_count: number }) => sum + (l.plant_species_count ?? 0), 0)

  const today = new Date().toISOString().slice(0, 10)
  const todayLog = logs?.find((l) => l.date === today) ?? emptyGutLog(today)
  const currentScore = calculateGutScore(todayLog, weeklyPlantCount)

  // 7-day trend: scores for the last 7 logged days
  const trend = (logs ?? [])
    .slice(0, 7)
    .map((l) => ({
      date: l.date,
      score: calculateGutScore(l, 0).total,
    }))
    .reverse()

  return NextResponse.json({ logs, currentScore, trend, weeklyPlantCount })
}

export async function POST(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json()
  const today = body.date ?? new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('gut_health_logs')
    .upsert(
      { ...body, user_id: user.id, date: today, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Recalculate weekly plant count after upsert
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString().slice(0, 10)
  const { data: weekLogs } = await supabase
    .from('gut_health_logs')
    .select('plant_species_count')
    .eq('user_id', user.id)
    .gte('date', weekAgoStr)
  const weeklyPlantCount = (weekLogs ?? []).reduce(
    (sum, l) => sum + (l.plant_species_count ?? 0),
    0
  )

  const score = calculateGutScore(data, weeklyPlantCount)
  return NextResponse.json({ log: data, score })
}
