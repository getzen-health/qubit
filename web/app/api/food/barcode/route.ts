import { NextRequest, NextResponse } from 'next/server'

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
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const barcode = searchParams.get('code')

  if (!barcode) {
    return NextResponse.json({ error: 'Barcode is required' }, { status: 400 })
  }

  try {
    // Use Open Food Facts API (free, no API key needed)
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      {
        headers: {
          'User-Agent': 'Quarks Health App - https://github.com/qxlsz/quarks',
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch product data' }, { status: 500 })
    }

    const data = await response.json()

    if (data.status !== 1 || !data.product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const product: OpenFoodFactsProduct = data.product
    const nutriments = product.nutriments || {}

    // Prefer serving size values, fall back to 100g
    const hasServing = nutriments['energy-kcal_serving'] !== undefined
    const multiplier = hasServing ? 1 : 1 // If using 100g, user can adjust serving

    const food = {
      name: product.product_name || 'Unknown Product',
      brand: product.brands,
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
    }

    return NextResponse.json({ food })
  } catch (error) {
    console.error('Barcode lookup error:', error)
    return NextResponse.json({ error: 'Failed to lookup barcode' }, { status: 500 })
  }
}
