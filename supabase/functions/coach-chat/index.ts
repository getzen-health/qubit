import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.20.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { message, sessionId, userId } = await req.json()
    if (!message || !userId) throw new Error('Missing message or userId')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get recent health context for this user
    const [stepsRes, sleepRes, goalsRes] = await Promise.all([
      supabase.from('daily_summaries').select('date, steps, active_calories, resting_hr').eq('user_id', userId).order('date', { ascending: false }).limit(3),
      supabase.from('sleep_records').select('sleep_date, total_sleep_minutes, deep_minutes, rem_minutes').eq('user_id', userId).order('sleep_date', { ascending: false }).limit(3),
      supabase.from('user_goals').select('target_steps, target_calories, target_weight_kg, target_sleep_hours').eq('user_id', userId).single(),
    ])

    const healthContext = `
User health context (last 3 days):
Steps: ${(stepsRes.data ?? []).map((d: { date: string; steps: number }) => `${d.date}: ${d.steps} steps`).join(', ')}
Sleep: ${(sleepRes.data ?? []).map((d: { sleep_date: string; total_sleep_minutes: number }) => `${d.sleep_date}: ${Math.round((d.total_sleep_minutes || 0)/60*10)/10}h`).join(', ')}
Goals: ${JSON.stringify(goalsRes.data ?? {})}
`

    // Get conversation history for this session (max 8 previous messages)
    const { data: history } = await supabase
      .from('coach_conversations')
      .select('role, content')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(8)

    // Save user message
    await supabase.from('coach_conversations').insert({
      user_id: userId,
      session_id: sessionId,
      role: 'user',
      content: message,
    })

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

    const messages = [
      ...(history ?? []).map((h: { role: string; content: string }) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user' as const, content: message },
    ]

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 500,
      system: `You are KQuarks Health Coach, a friendly and knowledgeable AI health assistant. You provide personalized, evidence-based health guidance. Be concise (2-3 sentences max unless the user asks for detail). Always encourage sustainable habits. Never diagnose medical conditions — suggest consulting a doctor for medical issues.

${healthContext}`,
      messages,
    })

    const assistantMessage = response.content[0].type === 'text' ? response.content[0].text : ''

    // Save assistant response
    await supabase.from('coach_conversations').insert({
      user_id: userId,
      session_id: sessionId,
      role: 'assistant',
      content: assistantMessage,
    })

    return new Response(JSON.stringify({ message: assistantMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
