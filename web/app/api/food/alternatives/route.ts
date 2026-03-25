import { NextRequest } from 'next/server'
import { z } from 'zod'
import { calculateProductScore } from '@/lib/product-scoring'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

interface OFFProduct {
  id?: string
  product_name?: string
  brands?: string
  image_url?: string
  nutriscore_grade?: string
  additives_tags?: string[]
  allergens_tags?: string[]
  labels_tags?: string[]
  nutriments?: {
    'energy-kcal_100g'?: number
    proteins_100g?: number
    carbohydrates_100g?: number
    fat_100g?: number
    fiber_100g?: number
  }
}

const querySchema = z.object({
  category: z.string().min(2).max(100),
  currentScore: z.coerce.number().int().min(0).max(100).default(0),
})

export const GET = createSecureApiHandler(
  {
    rateLimit: 'foodScan',
    requireAuth: true,
    querySchema,
    auditAction: 'READ',
    auditResource: 'food_product',
  },
  async (request: NextRequest, { query }) => {
    const { category, currentScore } = query as z.infer<typeof querySchema>

    if (currentScore >= 75) {
      return secureJsonResponse({ alternatives: [] })
    }

    const url = new URL(`https://world.openfoodfacts.org/category/${encodeURIComponent(category)}.json`)
    url.searchParams.set('fields', 'id,product_name,brands,image_url,nutriscore_grade,additives_tags,allergens_tags,labels_tags,nutriments')
    url.searchParams.set('page_size', '40')

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'kquarks Health App - https://github.com/qxlsz/kquarks',
      },
    })

    if (!response.ok) {
      return secureJsonResponse({ alternatives: [] })
    }

    const data = await response.json()
    const rawProducts: OFFProduct[] = data.products ?? []

    const scored = rawProducts
      .filter((p) => p.product_name && (p.nutriscore_grade === 'a' || p.nutriscore_grade === 'b'))
      .map((p) => {
        const isOrganic = (p.labels_tags ?? []).some(
          (l) => l.includes('organic') || l.includes('bio')
        )
        const healthScore = calculateProductScore({
          nutriscoreGrade: p.nutriscore_grade,
          additivesTags: p.additives_tags ?? [],
          isOrganic,
          allergensTags: p.allergens_tags ?? [],
          fiberPer100g: p.nutriments?.fiber_100g ?? null,
          calories: p.nutriments?.['energy-kcal_100g'] ?? null,
          protein: p.nutriments?.proteins_100g ?? null,
          carbs: p.nutriments?.carbohydrates_100g ?? null,
          fat: p.nutriments?.fat_100g ?? null,
        })
        return {
          id: p.id,
          name: p.product_name,
          brand: p.brands,
          imageUrl: p.image_url,
          calories: Math.round(p.nutriments?.['energy-kcal_100g'] ?? 0),
          healthScore: {
            score: healthScore.score,
            grade: healthScore.grade,
            color: healthScore.color,
            nutriScore: healthScore.nutriScore,
          },
        }
      })
      .filter((p) => p.healthScore.score > currentScore)
      .sort((a, b) => b.healthScore.score - a.healthScore.score)
      .slice(0, 5)

    return secureJsonResponse({ alternatives: scored })
  }
)
