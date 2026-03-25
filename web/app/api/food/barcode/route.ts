import { NextRequest } from 'next/server'
import { z } from 'zod'
import { calculateProductScore } from '@/lib/product-scoring'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
  barcodeSchema,
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
  packaging?: string
  nova_group?: number
}

interface USDAFood {
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

function getNutrient(nutrients: USDAFood['foodNutrients'], id: number): number {
  return nutrients.find((n) => n.nutrientId === id)?.value ?? 0
}

const querySchema = barcodeSchema.extend({
  code: z.string().min(8).max(14).regex(/^[0-9]+$/, 'Barcode must be numeric'),
}).omit({ barcode: true })

export const GET = createSecureApiHandler(
  {
    rateLimit: 'foodScan',
    requireAuth: true,
    querySchema,
    auditAction: 'READ',
    auditResource: 'food_product',
  },
  async (request: NextRequest, { query, supabase, user }) => {
    const { code: barcode } = query as z.infer<typeof querySchema>

    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,brands,nutriments,serving_size,image_url,code,nutriscore_grade,additives_tags,allergens_tags,ingredients_text,labels_tags,categories_tags,quantity,nova_group`,
      {
        headers: {
          'User-Agent': 'kquarks Health App - https://github.com/qxlsz/kquarks',
        },
      }
    )

    if (!response.ok) {
      return secureErrorResponse('Failed to fetch product data', 500)
    }

    const data = await response.json()

    if (data.status !== 1 || !data.product) {
      // Fallback to USDA FoodData Central
      // Get USDA API key from environment.
      // To enable USDA lookups, set USDA_API_KEY in your environment.
      // Free keys available at https://fdc.nal.usda.gov/api-guide.html
      const usdaKey = process.env.USDA_API_KEY
      if (!usdaKey) {
        console.warn('[food/barcode] USDA_API_KEY not set — skipping USDA fallback. Set USDA_API_KEY to enable it.')
        return secureErrorResponse('Product not found in any database', 404)
      }
      const usdaUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(barcode)}&dataType=Branded&pageSize=1&api_key=${usdaKey}`

      let usdaRes: Response
      try {
        usdaRes = await fetch(usdaUrl, {
          headers: { 'User-Agent': 'KQuarks/1.0' },
          signal: AbortSignal.timeout(8000),
        })
      } catch {
        return secureErrorResponse('Product not found in any database', 404)
      }

      if (!usdaRes.ok) {
        return secureErrorResponse('Product not found in any database', 404)
      }

      const usdaData = await usdaRes.json()
      const usdaFoods: USDAFood[] = usdaData.foods ?? []
      if (!usdaFoods.length) {
        return secureErrorResponse('Product not found in any database', 404)
      }

      const usdaFood = usdaFoods[0]
      const nutrients = usdaFood.foodNutrients ?? []
      const isOrganic = usdaFood.description.toLowerCase().includes('organic')

      const healthScore = calculateProductScore({
        nutriscoreGrade: undefined,
        additivesTags: [],
        isOrganic,
        allergensTags: [],
        fiberPer100g: getNutrient(nutrients, 1079) || null,
        calories: getNutrient(nutrients, 1008) || null,
        protein: getNutrient(nutrients, 1003) || null,
        carbs: getNutrient(nutrients, 1005) || null,
        fat: getNutrient(nutrients, 1004) || null,
      })

      const usdaMapped = {
        name: toTitleCase(usdaFood.description),
        brand: usdaFood.brandOwner ?? usdaFood.brandName,
        quantity:
          usdaFood.servingSize != null && usdaFood.servingSizeUnit
            ? `${usdaFood.servingSize} ${usdaFood.servingSizeUnit}`
            : undefined,
        calories: Math.round(getNutrient(nutrients, 1008)),
        protein: Math.round(getNutrient(nutrients, 1003)),
        carbs: Math.round(getNutrient(nutrients, 1005)),
        fat: Math.round(getNutrient(nutrients, 1004)),
        fiber: Math.round(getNutrient(nutrients, 1079)),
        sugar: Math.round(getNutrient(nutrients, 2000)),
        sodium: Math.round(getNutrient(nutrients, 1093)),
        servingSize:
          usdaFood.servingSize != null && usdaFood.servingSizeUnit
            ? `${usdaFood.servingSize} ${usdaFood.servingSizeUnit}`
            : '100g',
        barcode,
        imageUrl: null,
        healthScore,
        ingredients: usdaFood.ingredients ?? null,
        categories: [],
        novaGroup: 1,
        allergens: [],
      }

      if (user) {
        supabase.from('product_scans').insert({
          user_id: user.id,
          barcode,
          product_name: usdaMapped.name,
          brand: usdaMapped.brand ?? null,
          health_score: healthScore.score,
          nova_group: 1,
          nutriscore: null,
          thumbnail_url: null,
        }).then(() => {})
      }

      return secureJsonResponse({ food: usdaMapped, dataSource: 'usda' })
    }

    const product: OpenFoodFactsProduct = data.product
    const nutriments = product.nutriments || {}

    const hasServing = nutriments['energy-kcal_serving'] !== undefined

    const isOrganic = (product.labels_tags ?? []).some(
      (l) => l.includes('organic') || l.includes('bio')
    )

    const healthScore = calculateProductScore({
      nutriscoreGrade: product.nutriscore_grade,
      additivesTags: product.additives_tags ?? [],
      isOrganic,
      allergensTags: product.allergens_tags ?? [],
      fiberPer100g: nutriments.fiber_100g ?? null,
      calories: nutriments['energy-kcal_100g'] ?? null,
      protein: nutriments.proteins_100g ?? null,
      carbs: nutriments.carbohydrates_100g ?? null,
      fat: nutriments.fat_100g ?? null,
    })

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
      barcode: product.code,
      imageUrl: product.image_url,
      healthScore,
      ingredients: product.ingredients_text || null,
      categories: product.categories_tags?.slice(0, 5) ?? [],
      novaGroup: product.nova_group ?? null,
    }

    if (user) {
      supabase.from('product_scans').insert({
        user_id: user.id,
        barcode: food.barcode ?? barcode,
        product_name: food.name,
        brand: food.brand ?? null,
        health_score: healthScore.score,
        nova_group: food.novaGroup ?? null,
        nutriscore: product.nutriscore_grade ?? null,
        thumbnail_url: food.imageUrl ?? null,
      }).then(() => {})
    }

    return secureJsonResponse({ food, dataSource: 'off' })
  }
)
