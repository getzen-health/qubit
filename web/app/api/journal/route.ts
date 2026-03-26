import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'
import { analyzeSentiment, type JournalType } from '@/lib/journaling'

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
    .limit(60)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Streak: consecutive days (deduplicated by date)
  const uniqueDates = [...new Set(entries.map(e => e.entry_date as string))].sort().reverse()
  let streak = 0
  const today = new Date().toISOString().slice(0, 10)
  let expected = today
  for (const d of uniqueDates) {
    if (d === expected) {
      streak++
      const prev = new Date(expected)
      prev.setDate(prev.getDate() - 1)
      expected = prev.toISOString().slice(0, 10)
    } else if (d < expected) {
      break
    }
  }

  // Average mood shift (mood_after - mood_before)
  const withShift = entries.filter(e => e.mood_before != null && e.mood_after != null)
  const avgMoodShift = withShift.length
    ? withShift.reduce((s, e) => s + (e.mood_after - e.mood_before), 0) / withShift.length
    : null

  // Sentiment trend: last 30 entries with scores
  const sentimentTrend = entries
    .filter(e => e.sentiment_score != null)
    .slice(0, 30)
    .map(e => ({ date: e.entry_date, score: e.sentiment_score, level: e.sentiment_level }))

  // Type breakdown
  const typeBreakdown: Record<string, number> = {}
  for (const e of entries) {
    const t = (e.type as string) || 'free'
    typeBreakdown[t] = (typeBreakdown[t] || 0) + 1
  }

  // Best journaling day of week
  const dayCount: Record<number, number> = {}
  for (const e of entries) {
    const day = new Date(e.entry_date as string).getDay()
    dayCount[day] = (dayCount[day] || 0) + 1
  }
  const bestDay = Object.entries(dayCount).sort((a, b) => +b[1] - +a[1])[0]
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const bestDayName = bestDay ? dayNames[+bestDay[0]] : null

  // Average word count
  const avgWordCount = entries.filter(e => e.word_count).length
    ? entries.filter(e => e.word_count).reduce((s, e) => s + e.word_count, 0) /
      entries.filter(e => e.word_count).length
    : 0

  // Scatter data: mood before vs after
  const moodScatter = entries
    .filter(e => e.mood_before != null && e.mood_after != null)
    .slice(0, 30)
    .map(e => ({ before: e.mood_before, after: e.mood_after, date: e.entry_date }))

  return NextResponse.json({
    entries: entries.slice(0, 30),
    streak,
    avgMoodShift,
    sentimentTrend,
    typeBreakdown,
    bestDay: bestDayName,
    avgWordCount: Math.round(avgWordCount),
    moodScatter,
  })
}

export async function POST(req: NextRequest) {
  await checkRateLimit(req)
  const supabase = await createClient()
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json()
  const today = new Date().toISOString().slice(0, 10)
  const journalType: JournalType = body.type || 'free'

  // Server-side sentiment analysis
  const textToAnalyze = [
    body.content || '',
    ...(body.gratitude_items || []).map((g: { event: string; why: string; feeling: string }) =>
      `${g.event} ${g.why} ${g.feeling}`
    ),
    body.cbt_record?.situation || '',
    body.cbt_record?.balanced_thought || '',
  ]
    .join(' ')
    .trim()

  let sentimentScore: number | null = null
  let sentimentLevel: string | null = null
  let wordCount = 0

  if (textToAnalyze) {
    const result = analyzeSentiment(textToAnalyze)
    sentimentScore = result.score
    sentimentLevel = result.level
    wordCount = textToAnalyze.split(/\s+/).filter(Boolean).length
  }

  const payload = {
    user_id: user.id,
    entry_date: today,
    date: today,
    type: journalType,
    content: body.content || null,
    sentiment_score: sentimentScore,
    sentiment_level: sentimentLevel,
    gratitude_items: body.gratitude_items || [],
    cbt_record: body.cbt_record || null,
    word_count: wordCount,
    mood_before: body.mood_before || null,
    mood_after: body.mood_after || null,
    mood_score: body.mood_before || body.mood_score || null,
    tags: body.tags || [],
    updated_at: new Date().toISOString(),
  }

  const { error, data } = await supabase
    .from('journal_entries')
    .upsert(payload, { onConflict: 'user_id,entry_date,type' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entry: data })
}
