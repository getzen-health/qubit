// Brand health/trust scores based on transparency, product quality, and recall history
export interface BrandScore {
  brand: string
  score: number  // 0-100
  tier: 'trusted' | 'acceptable' | 'questionable'
  notes: string
}

// Scores based on Consumer Reports, EWG, and public recall databases
const BRAND_DATABASE: Record<string, BrandScore> = {
  "whole foods": { brand: "Whole Foods / 365", score: 82, tier: 'trusted', notes: 'High ingredient standards, organic options, fewer additives' },
  "trader joe's": { brand: "Trader Joe's", score: 79, tier: 'trusted', notes: 'Generally clean ingredients, transparent sourcing' },
  "kind": { brand: "KIND", score: 75, tier: 'trusted', notes: 'Simple ingredients, low processing. Watch sugar content.' },
  "clif": { brand: "CLIF", score: 68, tier: 'acceptable', notes: 'Sports nutrition focus. Some organic. Higher sugar for athletes.' },
  "kraft": { brand: "Kraft / Mondelez", score: 42, tier: 'questionable', notes: 'Frequent use of artificial colors, preservatives, HFCS.' },
  "general mills": { brand: "General Mills", score: 48, tier: 'questionable', notes: 'Cereal products high in sugar. Some better options available.' },
  "kellogg's": { brand: "Kellogg's", score: 44, tier: 'questionable', notes: 'High sugar, artificial ingredients in many products.' },
  "nestle": { brand: "Nestlé", score: 40, tier: 'questionable', notes: 'Mixed portfolio. Water practices controversy. Some healthier lines.' },
  "pepsi": { brand: "PepsiCo", score: 38, tier: 'questionable', notes: 'High sugar/sodium. Diet products use artificial sweeteners.' },
  "coca-cola": { brand: "Coca-Cola", score: 36, tier: 'questionable', notes: 'High sugar beverages. Artificial sweeteners in diet lines.' },
}

export function getBrandScore(brandName?: string): BrandScore | null {
  if (!brandName) return null
  const lower = brandName.toLowerCase()
  for (const [key, score] of Object.entries(BRAND_DATABASE)) {
    if (lower.includes(key)) return score
  }
  return null
}

const TIER_COLORS = { trusted: 'text-green-600', acceptable: 'text-yellow-600', questionable: 'text-red-600' }
export function getBrandTierColor(tier: BrandScore['tier']): string { return TIER_COLORS[tier] }
