// Suggest healthier alternatives to scanned products
export interface ProductAlternative {
  name: string
  brand?: string
  score: number
  reason: string
  barcode?: string
}

// Category-based alternatives mapping
// In production: query Open Food Facts with same category + higher nutriscore
export async function findAlternatives(
  productCategory: string,
  currentScore: number,
  nutriscoreGrade?: string
): Promise<ProductAlternative[]> {
  if (currentScore >= 75) return [] // Product already good, no alternatives needed

  try {
    const grade = nutriscoreGrade?.toLowerCase() ?? 'e'
    // Find products in same category with better Nutri-Score
    const betterGrades = grade === 'e' ? ['a', 'b'] : grade === 'd' ? ['a', 'b', 'c'] : ['a', 'b']

    const results: ProductAlternative[] = []
    for (const betterGrade of betterGrades.slice(0, 2)) {
      const url = `https://world.openfoodfacts.org/cgi/search.pl?action=process&json=1&page_size=3&nutriscore_grade=${betterGrade}&search_terms=${encodeURIComponent(productCategory)}&fields=code,product_name,brands,nutriscore_grade,nutriments`
      const res = await fetch(url, { next: { revalidate: 86400 } })
      const data = await res.json()

      for (const p of (data.products ?? []).slice(0, 2)) {
        if (!p.product_name) continue
        results.push({
          name: p.product_name,
          brand: p.brands,
          score: betterGrade === 'a' ? 90 : betterGrade === 'b' ? 75 : 60,
          reason: `Nutri-Score ${betterGrade.toUpperCase()} — ${betterGrade === 'a' ? 'excellent nutrition' : 'better nutrition'}`,
          barcode: p.code,
        })
      }
    }

    return results.slice(0, 4)
  } catch {
    return []
  }
}
