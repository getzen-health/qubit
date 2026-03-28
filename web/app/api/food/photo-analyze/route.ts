import { z } from 'zod'
import { createSecureApiHandler, secureJsonResponse, secureErrorResponse } from '@/lib/security'

const photoAnalyzeBodySchema = z.object({
  imageBase64: z.string().min(1),
})

export const POST = createSecureApiHandler(
  { rateLimit: 'foodPhotoAnalyze', requireAuth: true, bodySchema: photoAnalyzeBodySchema },
  async (_request, { body }) => {
    const { imageBase64 } = body as z.infer<typeof photoAnalyzeBodySchema>

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return secureErrorResponse('AI service not configured', 503)

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

    if (!response.ok) return secureErrorResponse('AI analysis failed', 502)

    const aiResponse = await response.json()
    const content = aiResponse.choices?.[0]?.message?.content ?? ''

    let parsed: Record<string, unknown>
    try {
      // Extract JSON from response (sometimes wrapped in markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'Could not parse response' }
    } catch {
      return secureErrorResponse('Could not parse AI response', 500)
    }

    if (parsed.error) return secureErrorResponse(parsed.error as string, 422)

    return secureJsonResponse({ result: parsed, source: 'ai_vision' })
  }
)
