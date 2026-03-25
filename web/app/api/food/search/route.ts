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

interface USDASearchFood {
  fdcId: number
  description: string
  brandOwner?: string
  brandName?: string
  ingredients?: string
  servingSize?: number
  servingSizeUnit?: string
  foodNutrients: Array<{
    nutrientId: number
    nutrientName: string
    value: number
    unitName: string
  }>
}

function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function getUSDANutrient(nutrients: USDASearchFood['foodNutrients'], id: number): number {
  return nutrients.find((n) => n.nutrientId === id)?.value ?? 0
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

    const offUrl = new URL('https://world.openfoodfacts.org/cgi/search.pl')
    offUrl.searchParams.set('search_terms', q)
    offUrl.searchParams.set('search_simple', '1')
    offUrl.searchParams.set('action', 'process')
    offUrl.searchParams.set('json', '1')
    offUrl.searchParams.set('page_size', '20')
    offUrl.searchParams.set('page', String(page))
    offUrl.searchParams.set(
      'fields',
      'id,product_name,brands,image_url,nutriscore_grade,additives_tags,allergens_tags,labels_tags,nutriments,categories_tags,ingredients_text,quantity,serving_size,nova_group'
    )

    // Get USDA API key from environment.
    // To enable USDA lookups, set USDA_API_KEY in your environment.
    // Free keys available at https://fdc.nal.usda.gov/api-guide.html
    const usdaKey = process.env.USDA_API_KEY
    if (!usdaKey) {
      console.warn('[food/search] USDA_API_KEY not set — skipping USDA lookup. Set USDA_API_KEY to enable it.')
    }
    const usdaUrl = usdaKey
      ? `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(q)}&dataType=Branded&pageSize=5&api_key=${usdaKey}`
      : null

    const [offResponse, usdaResponse] = await Promise.allSettled([
      fetch(offUrl.toString(), {
        headers: { 'User-Agent': 'kquarks Health App - https://github.com/qxlsz/kquarks' },
      }),
      usdaUrl
        ? fetch(usdaUrl, {
            headers: { 'User-Agent': 'KQuarks/1.0' },
            signal: AbortSignal.timeout(8000),
          })
        : Promise.reject(new Error('USDA_API_KEY not configured')),
    ])

    if (offResponse.status === 'rejected' || !offResponse.value.ok) {
      return secureErrorResponse('Failed to search products', 500)
    }

    const data = await offResponse.value.json()
    const rawProducts: OFFSearchProduct[] = data.products ?? []

    const offProducts = rawProducts
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
          dataSource: 'off' as 'off' | 'usda',
          healthScore: {
            score: healthScore.score,
            grade: healthScore.grade,
            color: healthScore.color,
            nutriScore: healthScore.nutriScore,
            novaGroup: p.nova_group ?? null,
          },
        }
      })

    const offNames = new Set(offProducts.map((p) => (p.name ?? '').toLowerCase()))

    let usdaProducts: typeof offProducts = []
    if (usdaResponse.status === 'fulfilled' && usdaResponse.value.ok) {
      try {
        const usdaData = await usdaResponse.value.json()
        const usdaFoods: USDASearchFood[] = usdaData.foods ?? []

        usdaProducts = usdaFoods
          .filter((f) => {
            const titleName = toTitleCase(f.description)
            return !offNames.has(titleName.toLowerCase())
          })
          .map((f) => {
            const nutrients = f.foodNutrients ?? []
            const isOrganic = f.description.toLowerCase().includes('organic')
            const healthScore = calculateProductScore({
              nutriscoreGrade: undefined,
              additivesTags: [],
              isOrganic,
              allergensTags: [],
              fiberPer100g: getUSDANutrient(nutrients, 1079) || null,
              calories: getUSDANutrient(nutrients, 1008) || null,
              protein: getUSDANutrient(nutrients, 1003) || null,
              carbs: getUSDANutrient(nutrients, 1005) || null,
              fat: getUSDANutrient(nutrients, 1004) || null,
            })

            return {
              id: String(f.fdcId),
              name: toTitleCase(f.description),
              brand: f.brandOwner ?? f.brandName,
              imageUrl: undefined as string | undefined,
              quantity:
                f.servingSize != null && f.servingSizeUnit
                  ? `${f.servingSize} ${f.servingSizeUnit}`
                  : undefined,
              servingSize:
                f.servingSize != null && f.servingSizeUnit
                  ? `${f.servingSize} ${f.servingSizeUnit}`
                  : '100g',
              calories: Math.round(getUSDANutrient(nutrients, 1008)),
              protein: Math.round(getUSDANutrient(nutrients, 1003)),
              carbs: Math.round(getUSDANutrient(nutrients, 1005)),
              fat: Math.round(getUSDANutrient(nutrients, 1004)),
              fiber: Math.round(getUSDANutrient(nutrients, 1079)),
              sugar: Math.round(getUSDANutrient(nutrients, 2000)),
              sodium: Math.round(getUSDANutrient(nutrients, 1093)),
              categories: [] as string[],
              ingredients: f.ingredients ?? null,
              novaGroup: 1,
              dataSource: 'usda' as const,
              healthScore: {
                score: healthScore.score,
                grade: healthScore.grade,
                color: healthScore.color,
                nutriScore: healthScore.nutriScore,
                novaGroup: 1,
              },
            }
          })
      } catch {
        // USDA parse error — continue with OFF results only
      }
    }

    const products = [...offProducts, ...usdaProducts]

    return secureJsonResponse({
      products,
      total: data.count ?? products.length,
      page,
      pageSize: 20,
    })
  }
)
