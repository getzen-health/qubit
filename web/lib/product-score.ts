// Yuka-style product health score (0-100)
export interface ScoreBreakdown {
  total: number
  nutritionScore: number     // 0-60 points (60% weight)
  additivesScore: number     // 0-30 points (30% weight)
  organicBonus: number       // 0-10 points (10% weight)
  grade: 'excellent' | 'good' | 'mediocre' | 'poor'
  details: string[]
}

// Nutri-Score A=+5, B=+4, C=+3, D=+2, E=+1
const NUTRISCORE_POINTS: Record<string, number> = { a: 60, b: 48, c: 36, d: 24, e: 12 }

// Additives risk: class E1xx-E9xx
function scoreAdditives(additives: string[]): { score: number; details: string[] } {
  const HIGH_RISK = ['e102', 'e110', 'e122', 'e124', 'e129', 'e211', 'e621']
  const MODERATE_RISK = ['e471', 'e472', 'e433', 'e322', 'e415']
  let score = 30
  const details: string[] = []
  for (const a of additives) {
    const code = a.toLowerCase().replace(/^[a-z-]+:/, '').replace(/[^e0-9]/g, '')
    if (HIGH_RISK.includes(code)) { score -= 15; details.push(`${a}: high concern`) }
    else if (MODERATE_RISK.includes(code)) { score -= 5; details.push(`${a}: moderate concern`) }
  }
  return { score: Math.max(0, score), details }
}

export function calculateProductScore(product: {
  nutriscore_grade?: string
  additives_tags?: string[]
  labels_tags?: string[]
}): ScoreBreakdown {
  const nutriGrade = (product.nutriscore_grade ?? '').toLowerCase()
  const nutritionScore = NUTRISCORE_POINTS[nutriGrade] ?? 30
  const { score: additivesScore, details: addDetails } = scoreAdditives(product.additives_tags ?? [])
  const isOrganic = (product.labels_tags ?? []).some(l => l.includes('organic') || l.includes('bio'))
  const organicBonus = isOrganic ? 10 : 0
  const total = Math.min(100, nutritionScore + additivesScore + organicBonus)
  const grade = total >= 75 ? 'excellent' : total >= 50 ? 'good' : total >= 25 ? 'mediocre' : 'poor'
  const details = [`Nutrition (Nutri-Score ${nutriGrade.toUpperCase() || '?'}): ${nutritionScore}/60`, `Additives: ${additivesScore}/30`, ...(isOrganic ? ['Organic/Bio: +10'] : []), ...addDetails]
  return { total, nutritionScore, additivesScore, organicBonus, grade, details }
}
