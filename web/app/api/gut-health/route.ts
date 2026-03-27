import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BRISTOL_TYPES, calculateGutScore, GutLog } from '@/lib/gut-health'

const GUT_TIPS: Record<string, string[]> = {
  constipation: ['Increase fiber intake to 25-38g/day', 'Drink more water (2-3L/day)', 'Try prunes, flaxseeds, or psyllium husk'],
  ideal: ['Keep up your current fiber and hydration habits', 'Continue fermented foods for microbiome health'],
  diarrhea: ['Reduce insoluble fiber temporarily', 'Try the BRAT diet (bananas, rice, applesauce, toast)', 'Stay hydrated with electrolytes'],
}

// Helper: flatten symptoms to average severity
function avgSymptomSeverity(logs: any[]): number {
  let total = 0, count = 0
  for (const log of logs) {
    if (log.symptoms) {
      for (const val of Object.values(log.symptoms)) {
        total += typeof val === 'number' ? val : 0
        count++
      }
    }
  }
  return count ? total / count : 0
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: logs,
    error
  } = await supabase
    .from('gut_health_logs')
    .select('*')
    .order('logged_at', { ascending: false })
    .limit(7)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const logsSorted = logs.sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime())
  const avgBristolType = logsSorted.length ? logsSorted.reduce((a, b) => a + (b.bristol_type || 0), 0) / logsSorted.length : 0
  const avgDailyFrequency = logsSorted.length ? logsSorted.reduce((a, b) => a + (b.frequency_today || 1), 0) / logsSorted.length : 0
  const avgSymptom = avgSymptomSeverity(logsSorted)
  const fiberIntakeDays = logsSorted.filter(l => (l.fiber_intake_g || 0) >= 25).length
  const fermentedFoodDays = logsSorted.filter(l => l.fermented_food).length

  const gutLog: Partial<GutLog> = {
    bristol: avgBristolType,
    frequency: avgDailyFrequency,
    symptoms: avgSymptom > 0 ? { general: avgSymptom } : {},
    plantVarietyCount: fermentedFoodDays,
    date: new Date().toISOString().split('T')[0],
  }
  const weeklyScore = calculateGutScore(gutLog as GutLog, fiberIntakeDays)

  // Determine tendency for tips
  let tendency: 'constipation' | 'ideal' | 'diarrhea' = 'ideal'
  if (avgBristolType < 3) tendency = 'constipation'
  else if (avgBristolType > 5) tendency = 'diarrhea'

  return NextResponse.json({
    logs: logsSorted,
    weeklyScore,
    tips: GUT_TIPS[tendency]
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json()
  const { bristol_type, frequency_today, symptoms, fiber_intake_g, fermented_food, trigger_foods, notes, logged_at } = body
  const { data, error } = await supabase.from('gut_health_logs').insert([
    { bristol_type, frequency_today, symptoms, fiber_intake_g, fermented_food, trigger_foods, notes, logged_at }
  ]).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { id } = await req.json()
  const { error } = await supabase.from('gut_health_logs').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
