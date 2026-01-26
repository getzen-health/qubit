import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

interface RecognizedFood {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  servingSize: string
  confidence: number
}

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 })
    }

    // Extract base64 data from data URL
    const base64Match = image.match(/^data:image\/(.*?);base64,(.*)$/)
    if (!base64Match) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 })
    }

    const mediaType = `image/${base64Match[1]}` as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
    const base64Data = base64Match[2]

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: `Analyze this food image and identify all visible food items. For each food item, estimate the nutritional information based on typical serving sizes visible in the image.

Return your response as a JSON array with the following structure:
{
  "foods": [
    {
      "name": "Food name (be specific, e.g., 'Grilled Chicken Breast' not just 'Chicken')",
      "calories": estimated calories (number),
      "protein": grams of protein (number),
      "carbs": grams of carbohydrates (number),
      "fat": grams of fat (number),
      "fiber": grams of fiber (number, optional),
      "servingSize": "estimated serving size (e.g., '1 cup', '150g', '1 medium')",
      "confidence": confidence level 0-1 (number)
    }
  ]
}

Guidelines:
- Be specific about the food (e.g., "Whole wheat bread" vs "bread")
- Estimate portion sizes based on visual cues (plate size, utensils, etc.)
- If you see a full meal, break it down into individual components
- Use standard nutritional databases as reference for estimates
- If you cannot identify a food with reasonable confidence (< 0.5), still include it but note the low confidence
- If no food is visible, return an empty foods array

Return ONLY the JSON, no other text.`,
            },
          ],
        },
      ],
    })

    // Parse the response
    const textContent = response.content.find((block) => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 })
    }

    try {
      // Clean up the response - remove markdown code blocks if present
      let jsonText = textContent.text.trim()
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7)
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3)
      }
      if (jsonText.endsWith('```')) {
        jsonText = jsonText.slice(0, -3)
      }
      jsonText = jsonText.trim()

      const result = JSON.parse(jsonText)

      // Validate and clean up the response
      const foods: RecognizedFood[] = (result.foods || []).map((food: Record<string, unknown>) => ({
        name: String(food.name || 'Unknown Food'),
        calories: Math.round(Number(food.calories) || 0),
        protein: Math.round(Number(food.protein) || 0),
        carbs: Math.round(Number(food.carbs) || 0),
        fat: Math.round(Number(food.fat) || 0),
        fiber: food.fiber ? Math.round(Number(food.fiber)) : undefined,
        servingSize: String(food.servingSize || '1 serving'),
        confidence: Number(food.confidence) || 0.5,
      }))

      return NextResponse.json({ foods })
    } catch (parseError) {
      console.error('Failed to parse AI response:', textContent.text)
      return NextResponse.json({ error: 'Failed to parse food analysis' }, { status: 500 })
    }
  } catch (error) {
    console.error('Food recognition error:', error)

    // Check if it's an API key error
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'AI service not configured. Please add ANTHROPIC_API_KEY to environment.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ error: 'Failed to recognize food' }, { status: 500 })
  }
}
