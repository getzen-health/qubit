import { NextRequest, NextResponse } from 'next/server'
import { calculateProductScore } from '@/lib/product-scoring'

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
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const category = searchParams.get('category')?.trim()
  const currentScore = parseInt(searchParams.get('currentScore') ?? '0', 10)

  if (!category) {
    return NextResponse.json({ error: 'category is required' }, { status: 400 })
  }

  // Only suggest alternatives if current product is mediocre or poor
  if (currentScore >= 75) {
    return NextResponse.json({ alternatives: [] })
  }

  try {
    // Search OpenFoodFacts for products in same category with Nutri-Score A or B
    const url = new URL(`https://world.openfoodfacts.org/category/${encodeURIComponent(category)}.json`)
    url.searchParams.set('fields', 'id,product_name,brands,image_url,nutriscore_grade,additives_tags,allergens_tags,labels_tags,nutriments')
    url.searchParams.set('page_size', '40')

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'kquarks Health App - https://github.com/qxlsz/kquarks',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ alternatives: [] })
    }

    const data = await response.json()
    const rawProducts: OFFProduct[] = data.products ?? []

    // Score all products, keep only those better than current
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

    return NextResponse.json({ alternatives: scored })
  } catch (error) {
    console.error('Alternatives lookup error:', error)
    return NextResponse.json({ alternatives: [] })
  }
}
