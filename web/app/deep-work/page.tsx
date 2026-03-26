import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { analyzeDeepWork, buildHourlyHeatmap, buildDistractionBreakdown } from '@/lib/deep-work'
import { DeepWorkClient } from './deep-work-client'
import { BottomNav } from '@/components/bottom-nav'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Deep Work · KQuarks',
  description: 'Pomodoro timer, flow state tracker, and distraction logger for elite focus.',
}

export default async function DeepWorkPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().slice(0, 10)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10)

  const [{ data: todaySessions }, { data: trendSessions }] = await Promise.all([
    supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('created_at', { ascending: true }),
    supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', thirtyDaysAgo)
      .order('date', { ascending: true }),
  ])

  const sessions = todaySessions ?? []
  const allSessions = trendSessions ?? []

  const analysis = analyzeDeepWork(sessions)

  // 30-day trend
  const dateMap: Record<string, typeof allSessions> = {}
  for (const s of allSessions) {
    if (!dateMap[s.date]) dateMap[s.date] = []
    dateMap[s.date].push(s)
  }
  const trend = Object.entries(dateMap).map(([date, ds]) => {
    const a = analyzeDeepWork(ds)
    return {
      date,
      focusScore: a.focusScore,
      totalDeepWorkMin: a.totalDeepWorkMin,
      avgQuality: Math.round(a.avgSessionQuality * 10) / 10,
      flowSessions: a.flowSessions,
      distractionsPerHour: Math.round(a.distractionsPerHour * 10) / 10,
    }
  })

  const heatmapSessions = allSessions.filter(s => s.date >= fourteenDaysAgo)
  const hourlyHeatmap = buildHourlyHeatmap(heatmapSessions)
  const distractionBreakdown = buildDistractionBreakdown(allSessions)

  // Flow sessions per week
  const weeklyFlow: Record<string, number> = {}
  for (const s of allSessions) {
    const d = new Date(s.date + 'T12:00:00')
    const ws = new Date(d)
    ws.setDate(d.getDate() - d.getDay())
    const wk = ws.toISOString().slice(0, 10)
    if (!weeklyFlow[wk]) weeklyFlow[wk] = 0
    if (s.flow_state) weeklyFlow[wk]++
  }
  const flowByWeek = Object.entries(weeklyFlow)
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-8)

  // Best day of week
  const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dowQuality: Record<number, { sum: number; count: number }> = {}
  for (const s of allSessions) {
    const dow = new Date(s.date + 'T12:00:00').getDay()
    if (!dowQuality[dow]) dowQuality[dow] = { sum: 0, count: 0 }
    dowQuality[dow].sum += s.quality_rating
    dowQuality[dow].count++
  }
  const dowData = Array.from({ length: 7 }, (_, i) => {
    const b = dowQuality[i] ?? { sum: 0, count: 0 }
    return {
      day: DOW_LABELS[i],
      avgQuality: b.count > 0 ? Math.round((b.sum / b.count) * 10) / 10 : 0,
      count: b.count,
    }
  })

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border px-4 py-3">
        <h1 className="text-lg font-bold text-text-primary">Deep Work</h1>
        <p className="text-xs text-text-secondary">Newport 4h target · Csikszentmihalyi flow state</p>
      </header>
      <main className="px-4 py-4 max-w-2xl mx-auto">
        <DeepWorkClient
          initialSessions={sessions}
          initialAnalysis={analysis}
          trend={trend}
          hourlyHeatmap={hourlyHeatmap}
          distractionBreakdown={distractionBreakdown}
          flowByWeek={flowByWeek}
          dowData={dowData}
          today={today}
        />
      </main>
      <BottomNav />
    </div>
  )
}
