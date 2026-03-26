import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ParsedVoiceEntry } from '@/lib/voice-parser'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const entry: ParsedVoiceEntry = await request.json()

  try {
    switch (entry.type) {
      case 'water': {
        const { error } = await supabase.from('water_logs').insert({ user_id: user.id, amount_ml: entry.amount_ml, drink_type: entry.drink_type })
        if (error) throw error
        return NextResponse.json({ success: true, message: `Logged ${entry.amount_ml}ml ${entry.drink_type}` })
      }
      case 'mood': {
        const { error } = await supabase.from('mood_logs').insert({ user_id: user.id, score: entry.score, notes: entry.notes })
        if (error) throw error
        return NextResponse.json({ success: true, message: `Logged mood: ${entry.score}/10` })
      }
      case 'weight': {
        const { error } = await supabase.from('health_metrics').insert({ user_id: user.id, metric_type: 'weight', value: entry.value_kg, unit: 'kg', recorded_at: new Date().toISOString() })
        if (error) throw error
        return NextResponse.json({ success: true, message: `Logged weight: ${entry.value_kg}kg` })
      }
      case 'steps': {
        const { error } = await supabase.from('health_metrics').insert({ user_id: user.id, metric_type: 'steps', value: entry.count, unit: 'steps', recorded_at: new Date().toISOString() })
        if (error) throw error
        return NextResponse.json({ success: true, message: `Logged ${entry.count.toLocaleString()} steps` })
      }
      case 'sleep': {
        const { error } = await supabase.from('health_metrics').insert({ user_id: user.id, metric_type: 'sleep_duration_minutes', value: entry.hours * 60, unit: 'minutes', recorded_at: new Date().toISOString() })
        if (error) throw error
        return NextResponse.json({ success: true, message: `Logged ${entry.hours}h sleep` })
      }
      default:
        return NextResponse.json({ success: false, message: 'Could not log this entry type yet' })
    }
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
