import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { scoreFoodProduct } from '@/lib/food-scoring'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

interface OpenFoodFactsProduct {
  product_name?: string
  brands?: string
  nutriments?: {
    'energy-kcal_100g'?: number
    'energy-kcal_serving'?: number
    proteins_100g?: number
    proteins_serving?: number
    carbohydrates_100g?: number
    carbohydrates_serving?: number
    fat_100g?: number
    fat_serving?: number
    fiber_100g?: number
    fiber_serving?: number
    sugars_100g?: number
    sugars_serving?: number
    sodium_100g?: number
    sodium_serving?: number
  }
  serving_size?: string
  image_url?: string
  code?: string
  nutriscore_grade?: string
  additives_tags?: string[]
  allergens_tags?: string[]
  ingredients_text?: string
  labels_tags?: string[]
  categories_tags?: string[]
  quantity?: string
  nova_group?: number
}

const querySchema = z.object({
  barcode: z.string().min(8).max(14).regex(/^[0-9]+$/, 'Barcode must be numeric'),
})

/**
 * Check product allergens against user's personal allergen list.
 * Normalizes both sides to lowercase for comparison.
 */
function detectAllergenWarnings(
  productAllergenTags: string[],
  ingredientsText: string | undefined,
  userAllergens: string[]
): string[] {
  const warnings: string[] = []
  const ingredientsLower = (ingredientsText ?? '').toLowerCase()

  for (const userAllergen of userAllergens) {
    const allergenLower = userAllergen.toLowerCase()

    const inProductTags = productAllergenTags.some((tag) =>
      tag.toLowerCase().includes(allergenLower)
    )
    const inIngredients = ingredientsLower.includes(allergenLower)

    if (inProductTags || inIngredients) {
      warnings.push(userAllergen)
    }
  }

  return warnings
}

export const GET = createSecureApiHandler(
  {
    rateLimit: 'foodScan',
    requireAuth: true,
    querySchema,
    auditAction: 'READ',
    auditResource: 'food_product',
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (async (request: NextRequest, { query, supabase, user }: { query: unknown; supabase: import('@supabase/supabase-js').SupabaseClient; user: import('@supabase/supabase-js').User }) : Promise<NextResponse> => {
    const { barcode } = query as z.infer<typeof querySchema>

    // Fetch product from Open Food Facts
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,brands,nutriments,serving_size,image_url,code,nutriscore_grade,additives_tags,allergens_tags,ingredients_text,labels_tags,categories_tags,quantity,nova_group`,
      {
        headers: {
          'User-Agent': 'kquarks Health App - https://github.com/qxlsz/kquarks',
        },
        next: { revalidate: 3600 },
      }
    )

    if (!response.ok) {
      return secureErrorResponse('Failed to fetch product data', 502)
    }

    const data = await response.json()

    if (data.status !== 1 || !data.product) {
      return secureErrorResponse('Product not found', 404)
    }

    const product: OpenFoodFactsProduct = data.product
    const nutriments = product.nutriments || {}
    const hasServing = nutriments['energy-kcal_serving'] !== undefined

    // Fetch user health profile for personalised QuarkScore™ Context Fit pillar
    let userProfile: { primary_goal?: string; health_conditions?: string[]; dietary_preferences?: string[] } | undefined
    if (user) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('primary_goal, health_conditions, dietary_preferences')
        .eq('user_id', user.id)
        .single()
      if (profile) userProfile = profile
    }

    const { score, grade, components, pillars, flags } = scoreFoodProduct(product, userProfile)

    const food = {
      name: product.product_name || 'Unknown Product',
      brand: product.brands,
      quantity: product.quantity,
      calories: Math.round(
        (hasServing ? nutriments['energy-kcal_serving'] : nutriments['energy-kcal_100g']) || 0
      ),
      protein: Math.round(
        (hasServing ? nutriments.proteins_serving : nutriments.proteins_100g) || 0
      ),
      carbs: Math.round(
        (hasServing ? nutriments.carbohydrates_serving : nutriments.carbohydrates_100g) || 0
      ),
      fat: Math.round(
        (hasServing ? nutriments.fat_serving : nutriments.fat_100g) || 0
      ),
      fiber: Math.round(
        (hasServing ? nutriments.fiber_serving : nutriments.fiber_100g) || 0
      ),
      sugar: Math.round(
        (hasServing ? nutriments.sugars_serving : nutriments.sugars_100g) || 0
      ),
      sodium: Math.round(
        (hasServing ? nutriments.sodium_serving : nutriments.sodium_100g) || 0
      ),
      servingSize: product.serving_size || '100g',
      barcode: product.code ?? barcode,
      imageUrl: product.image_url,
      score,
      grade,
      score_components: components,
      ingredients: product.ingredients_text || null,
      categories: product.categories_tags?.slice(0, 5) ?? [],
      novaGroup: product.nova_group ?? null,
      allergensTags: product.allergens_tags ?? [],
    }

    // Fetch user's personal allergen list and compute warnings
    let allergenWarnings: string[] = []
    if (user) {
      const { data: userAllergens } = await supabase
        .from('user_allergens')
        .select('allergen')
        .eq('user_id', user.id)

      if (userAllergens && userAllergens.length > 0) {
        const allergenNames = userAllergens.map((a: { allergen: string }) => a.allergen)
        allergenWarnings = detectAllergenWarnings(
          food.allergensTags,
          product.ingredients_text,
          allergenNames
        )
      }

      // Record scan history (legacy)
      void Promise.resolve(
        supabase.from('product_scans').insert({
          user_id: user.id,
          barcode: food.barcode,
          product_name: food.name,
          brand: food.brand ?? null,
          health_score: score,
          nova_group: food.novaGroup ?? null,
          nutriscore: product.nutriscore_grade ?? null,
          thumbnail_url: food.imageUrl ?? null,
        })
      ).catch(() => {
        // Non-critical: scan history failure should not block the response
      })

      // Also save to scan_history (fire-and-forget, don't block response)
      void Promise.resolve(
        supabase.from('scan_history').upsert({
          user_id: user.id,
          barcode: food.barcode,
          product_name: food.name,
          brand: food.brand ?? null,
          score: score ?? null,
          score_components: components,
          image_url: food.imageUrl ?? null,
        }, { onConflict: 'user_id,barcode' })
      ).catch(() => {
        // Non-critical: scan history failure should not block the response
      })
    }

    return NextResponse.json({ food, allergenWarnings, score, grade, score_components: components, pillars, flags, dataSource: 'off' }, { status: 200, headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' } })
  }) as unknown as Parameters<typeof createSecureApiHandler>[1]
)
