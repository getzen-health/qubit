import Anthropic from 'npm:@anthropic-ai/sdk'

interface SleepRecord {
  date: string
  duration_hours: number
  quality_score?: number
  deep_sleep_pct?: number
  rem_sleep_pct?: number
  awakenings?: number
}

Deno.serve(async (req) => {
  try {
    const { sleepRecords, userId } = await req.json() as { sleepRecords: SleepRecord[], userId: string }
    
    if (!sleepRecords || sleepRecords.length < 3) {
      return new Response(JSON.stringify({ 
        insight: "Log at least 3 nights of sleep to get personalized insights.",
        tip: "Consistent bedtimes help regulate your circadian rhythm."
      }), { headers: { 'Content-Type': 'application/json' } })
    }
    
    const avgDuration = sleepRecords.reduce((s, r) => s + r.duration_hours, 0) / sleepRecords.length
    const variance = sleepRecords.map(r => Math.pow(r.duration_hours - avgDuration, 2)).reduce((a, b) => a + b) / sleepRecords.length
    
    const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })
    
    const prompt = `You are a sleep health expert. Analyze this 7-day sleep data and give ONE specific, actionable tip (2-3 sentences max):

Average sleep: ${avgDuration.toFixed(1)} hours/night
Sleep consistency variance: ${variance.toFixed(2)} hours²
Data: ${JSON.stringify(sleepRecords.slice(-7))}

Focus on the most impactful improvement. Be specific, warm, and science-backed.`

    const message = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 150,
      messages: [{ role: 'user', content: prompt }]
    })
    
    const insight = (message.content[0] as { text: string }).text
    
    return new Response(JSON.stringify({ 
      insight,
      avgDuration: parseFloat(avgDuration.toFixed(1)),
      consistencyScore: Math.max(0, 100 - variance * 20)
    }), { headers: { 'Content-Type': 'application/json' } })
    
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
