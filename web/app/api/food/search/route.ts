import { NextRequest } from 'next/server'
import { z } from 'zod'
import { calculateProductScore } from '@/lib/product-scoring'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

interface OFFSearchProduct {
  id?: string
  product_name?: string
  brands?: string
  image_url?: string
  nutriscore_grade?: string
  additives_tags?: string[]
  allergens_tags?: string[]
  labels_tags?: string[]
  categories_tags?: string[]
  ingredients_text?: string
  quantity?: string
  serving_size?: string
  nova_group?: number
  nutriments?: {
    'energy-kcal_100g'?: number
    proteins_100g?: number
    carbohydrates_100g?: number
    fat_100g?: number
    fiber_100g?: number
    sugars_100g?: number
    sodium_100g?: number
  }
}

const querySchema = z.object({
  q: z.string().min(2, 'Query too short').max(200, 'Query too long'),
  page: z.coerce.number().int().min(1).max(100).default(1),
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
    const { q, page } = query as z.infer<typeof querySchema>

    const url = new URL('https://world.openfoodfacts.org/cgi/search.pl')
    url.searchParams.set('search_terms', q)
    url.searchParams.set('search_simple', '1')
    url.searchParams.set('action', 'process')
    url.searchParams.set('json', '1')
    url.searchParams.set('page_size', '20')
    url.searchParams.set('page', String(page))
    url.searchParams.set(
      'fields',
      'id,product_name,brands,image_url,nutriscore_grade,additives_tags,allergens_tags,labels_tags,nutriments,categories_tags,ingredients_text,quantity,serving_size,nova_group'
    )

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'kquarks Health App - https://github.com/qxlsz/kquarks',
      },
    })

    if (!response.ok) {
      return secureErrorResponse('Failed to search products', 500)
    }

    const data = await response.json()
    const rawProducts: OFFSearchProduct[] = data.products ?? []

    const products = rawProducts
      .filter((p) => p.product_name)
      .map((p) => {
        const isOrganic = (p.labels_tags ?? []).some(
          (l) => l.includes('organic') || l.includes('bio')
        )
        const healthScore = calculateProductScore({
          nutriscoreGrade: p.nutriscore_grade,
          additivesTags: p.additives_tags ?? [],
          isOrganic,
          allergensTags: p.allergens_tags ?? [],
        })

        return {
          id: p.id,
          name: p.product_name,
          brand: p.brands,
          imageUrl: p.image_url,
          quantity: p.quantity,
          servingSize: p.serving_size || '100g',
          calories: Math.round(p.nutriments?.['energy-kcal_100g'] ?? 0),
          protein: Math.round(p.nutriments?.proteins_100g ?? 0),
          carbs: Math.round(p.nutriments?.carbohydrates_100g ?? 0),
          fat: Math.round(p.nutriments?.fat_100g ?? 0),
          fiber: Math.round(p.nutriments?.fiber_100g ?? 0),
          sugar: Math.round(p.nutriments?.sugars_100g ?? 0),
          sodium: Math.round(p.nutriments?.sodium_100g ?? 0),
          categories: p.categories_tags?.slice(0, 5) ?? [],
          ingredients: p.ingredients_text || null,
          novaGroup: p.nova_group ?? null,
          healthScore: {
            score: healthScore.score,
            grade: healthScore.grade,
            color: healthScore.color,
            nutriScore: healthScore.nutriScore,
            novaGroup: p.nova_group ?? null,
          },
        }
      })

    return secureJsonResponse({
      products,
      total: data.count ?? products.length,
      page,
      pageSize: 20,
    })
  }
)
