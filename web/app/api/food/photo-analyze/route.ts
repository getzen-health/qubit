import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/security'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rateLimitOk = await checkRateLimit(user.id, 'foodPhotoAnalyze')
    if (!rateLimitOk) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

    const body = await request.json()
    const { imageBase64 } = body  // base64 encoded image

    if (!imageBase64) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })

    // Call OpenAI GPT-4o vision
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this food image and provide nutritional information. Return ONLY valid JSON in this exact format:
{
  "foods": [
    {
      "name": "Food item name",
      "portion_estimate": "e.g. 1 cup, 200g, 1 medium",
      "calories": 250,
      "protein_g": 12,
      "carbs_g": 30,
      "fat_g": 8,
      "fiber_g": 3,
      "confidence": "high|medium|low"
    }
  ],
  "total": {
    "calories": 250,
    "protein_g": 12,
    "carbs_g": 30,
    "fat_g": 8,
    "fiber_g": 3
  },
  "meal_description": "Brief description of what you see"
}
If you cannot identify food in the image, return {"error": "No food detected"}.`
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
            }
          ]
        }]
      })
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'AI analysis failed' }, { status: 502 })
    }

    const aiResponse = await response.json()
    const content = aiResponse.choices?.[0]?.message?.content ?? ''

    let parsed: Record<string, unknown>
    try {
      // Extract JSON from response (sometimes wrapped in markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'Could not parse response' }
    } catch {
      return NextResponse.json({ error: 'Could not parse AI response' }, { status: 500 })
    }

    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 422 })
    }

    return NextResponse.json({ result: parsed, source: 'ai_vision' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
