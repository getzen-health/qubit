// Food search with Open Food Facts + USDA FoodData Central fallback
export interface FoodSearchResult {
  id: string
  name: string
  brand?: string
  barcode?: string
  calories?: number
  source: 'openfoodfacts' | 'usda'
  imageUrl?: string
}

export async function searchFoodDatabase(query: string): Promise<FoodSearchResult[]> {
  const results: FoodSearchResult[] = []

  // Primary: Open Food Facts
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10&fields=code,product_name,brands,nutriments,image_small_url`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    const data = await res.json()
    for (const p of data.products ?? []) {
      if (!p.product_name) continue
      results.push({
        id: p.code ?? p._id,
        name: p.product_name,
        brand: p.brands,
        barcode: p.code,
        calories: p.nutriments?.['energy-kcal_100g'],
        source: 'openfoodfacts',
        imageUrl: p.image_small_url,
      })
    }
  } catch { /* fallthrough to USDA */ }

  // Fallback: USDA FoodData Central (no API key needed for basic search)
  if (results.length < 5) {
    try {
      const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=5&api_key=DEMO_KEY`
      const res = await fetch(url, { next: { revalidate: 3600 } })
      const data = await res.json()
      for (const food of data.foods ?? []) {
        const calNutrient = food.foodNutrients?.find((n: any) => n.nutrientName === 'Energy')
        results.push({
          id: String(food.fdcId),
          name: food.description,
          brand: food.brandOwner,
          calories: calNutrient?.value,
          source: 'usda',
        })
      }
    } catch { /* ignore */ }
  }

  // Rank: prefer results with images and known calories
  return results.sort((a, b) => {
    const scoreA = (a.imageUrl ? 2 : 0) + (a.calories ? 1 : 0) + (a.brand ? 1 : 0)
    const scoreB = (b.imageUrl ? 2 : 0) + (b.calories ? 1 : 0) + (b.brand ? 1 : 0)
    return scoreB - scoreA
  })
}

export async function lookupBarcode(barcode: string): Promise<FoodSearchResult | null> {
  // Try Open Food Facts first
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=code,product_name,brands,nutriments,image_small_url,nutriscore_grade,additives_tags,ecoscore_grade`, { next: { revalidate: 86400 } })
    const data = await res.json()
    if (data.status === 1 && data.product?.product_name) {
      return {
        id: data.product.code,
        name: data.product.product_name,
        brand: data.product.brands,
        barcode,
        calories: data.product.nutriments?.['energy-kcal_100g'],
        source: 'openfoodfacts',
        imageUrl: data.product.image_small_url,
      }
    }
  } catch { /* fallthrough */ }

  // Fallback: USDA by barcode (GTIN search)
  try {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${barcode}&api_key=DEMO_KEY`
    const res = await fetch(url, { next: { revalidate: 86400 } })
    const data = await res.json()
    const food = data.foods?.[0]
    if (food) {
      return {
        id: String(food.fdcId),
        name: food.description,
        brand: food.brandOwner,
        barcode,
        calories: food.foodNutrients?.find((n: any) => n.nutrientName === 'Energy')?.value,
        source: 'usda',
      }
    }
  } catch { /* ignore */ }

  return null
}
