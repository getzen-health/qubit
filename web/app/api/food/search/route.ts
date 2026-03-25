import { NextRequest, NextResponse } from 'next/server'
import { calculateProductScore } from '@/lib/product-scoring'

interface OFFSearchProduct {
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
  const query = searchParams.get('q')?.trim()
  const page = parseInt(searchParams.get('page') ?? '1', 10)

  if (!query) {
    return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
  }

  try {
    const url = new URL('https://world.openfoodfacts.org/cgi/search.pl')
    url.searchParams.set('search_terms', query)
    url.searchParams.set('search_simple', '1')
    url.searchParams.set('action', 'process')
    url.searchParams.set('json', '1')
    url.searchParams.set('page_size', '20')
    url.searchParams.set('page', String(page))
    url.searchParams.set(
      'fields',
      'id,product_name,brands,image_url,nutriscore_grade,additives_tags,allergens_tags,labels_tags,nutriments'
    )

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'kquarks Health App - https://github.com/qxlsz/kquarks',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to search products' }, { status: 500 })
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
          calories: Math.round(p.nutriments?.['energy-kcal_100g'] ?? 0),
          protein: Math.round(p.nutriments?.proteins_100g ?? 0),
          carbs: Math.round(p.nutriments?.carbohydrates_100g ?? 0),
          fat: Math.round(p.nutriments?.fat_100g ?? 0),
          healthScore: {
            score: healthScore.score,
            grade: healthScore.grade,
            color: healthScore.color,
            nutriScore: healthScore.nutriScore,
          },
        }
      })

    return NextResponse.json({
      products,
      total: data.count ?? products.length,
      page,
      pageSize: 20,
    })
  } catch (error) {
    console.error('Food search error:', error)
    return NextResponse.json({ error: 'Failed to search products' }, { status: 500 })
  }
}
