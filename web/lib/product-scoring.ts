/**
 * Product Health Scoring — Yuka-style 0–100 scoring for food products.
 *
 * Algorithm:
 *   60% — Nutritional quality (Nutri-Score: A=100 … E=0)
 *   30% — Additive safety (penalise harmful E-numbers)
 *   10% — Organic certification bonus
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProductScore {
  score: number // 0–100
  grade: 'excellent' | 'good' | 'mediocre' | 'poor'
  color: string // tailwind colour token
  nutriScore: NutriScoreGrade | null
  additivesPenalty: number // 0–30
  organicBonus: number // 0 or 10
  flaggedAdditives: FlaggedAdditive[]
  allergens: string[]
}

export type NutriScoreGrade = 'a' | 'b' | 'c' | 'd' | 'e'

export interface FlaggedAdditive {
  code: string // e.g. "en:e621"
  name: string
  risk: 'avoid' | 'limited' | 'safe'
  description: string
}

// ---------------------------------------------------------------------------
// Additive Risk Database
// E-numbers mapped to risk level and description.
// Sources: EFSA evaluations, IARC classifications, WHO guidance.
// ---------------------------------------------------------------------------

const ADDITIVE_RISKS: Record<
  string,
  { name: string; risk: 'avoid' | 'limited' | 'safe'; description: string }
> = {
  // Nitrites / nitrates — processed meat carcinogens (IARC Group 2A)
  'en:e249': { name: 'Potassium nitrite', risk: 'avoid', description: 'Linked to colorectal cancer risk (IARC Group 2A)' },
  'en:e250': { name: 'Sodium nitrite', risk: 'avoid', description: 'Linked to colorectal cancer risk (IARC Group 2A)' },
  'en:e251': { name: 'Sodium nitrate', risk: 'avoid', description: 'Converts to nitrite in the body; cancer risk concerns' },
  'en:e252': { name: 'Potassium nitrate', risk: 'avoid', description: 'Converts to nitrite in the body; cancer risk concerns' },

  // Controversial sweeteners
  'en:e951': { name: 'Aspartame', risk: 'limited', description: 'Classified as "possibly carcinogenic" (IARC 2B) — limit intake' },
  'en:e950': { name: 'Acesulfame K', risk: 'limited', description: 'Some studies suggest metabolic effects; avoid in large amounts' },
  'en:e954': { name: 'Saccharin', risk: 'limited', description: 'Controversial; some animal studies show bladder cancer risk' },
  'en:e955': { name: 'Sucralose', risk: 'limited', description: 'May alter gut microbiome; recent studies raise concerns' },

  // Controversial colours
  'en:e102': { name: 'Tartrazine (E102)', risk: 'avoid', description: 'Linked to hyperactivity in children; banned in some countries' },
  'en:e104': { name: 'Quinoline Yellow (E104)', risk: 'avoid', description: 'Linked to hyperactivity; restricted in several countries' },
  'en:e110': { name: 'Sunset Yellow (E110)', risk: 'avoid', description: 'Linked to hyperactivity and allergic reactions in children' },
  'en:e122': { name: 'Carmoisine (E122)', risk: 'avoid', description: 'Linked to hyperactivity; restricted in some countries' },
  'en:e124': { name: 'Ponceau 4R (E124)', risk: 'avoid', description: 'Linked to hyperactivity; restricted in some countries' },
  'en:e129': { name: 'Allura Red (E129)', risk: 'limited', description: 'Possible hyperactivity link; restricted in some countries' },
  'en:e133': { name: 'Brilliant Blue (E133)', risk: 'safe', description: 'Generally considered safe at approved levels' },
  'en:e171': { name: 'Titanium dioxide (E171)', risk: 'avoid', description: 'Banned in EU food as of 2022; genotoxicity concerns' },

  // Preservatives
  'en:e211': { name: 'Sodium benzoate (E211)', risk: 'limited', description: 'Can form benzene with vitamin C; hyperactivity link' },
  'en:e220': { name: 'Sulphur dioxide (E220)', risk: 'limited', description: 'Destroys vitamin B1; may cause reactions in asthmatics' },
  'en:e228': { name: 'Potassium bisulphite (E228)', risk: 'limited', description: 'Sulphite — may cause reactions in asthmatics' },

  // Emulsifiers with gut-health concerns
  'en:e433': { name: 'Polysorbate 80 (E433)', risk: 'limited', description: 'Animal studies show gut microbiome disruption' },
  'en:e471': { name: 'Mono/diglycerides (E471)', risk: 'safe', description: 'Generally considered safe; derived from fats' },
  'en:e472e': { name: 'DATEM (E472e)', risk: 'safe', description: 'Generally considered safe' },

  // Glutamate / flavour enhancers
  'en:e621': { name: 'Monosodium glutamate (MSG)', risk: 'safe', description: 'Generally considered safe; high sodium content' },
  'en:e627': { name: 'Disodium guanylate (E627)', risk: 'safe', description: 'Generally safe; avoid if sensitive to purines' },
  'en:e631': { name: 'Disodium inosinate (E631)', risk: 'safe', description: 'Generally safe; avoid if sensitive to purines' },

  // BHA / BHT — oxidation prevention
  'en:e320': { name: 'BHA (E320)', risk: 'avoid', description: 'Possible carcinogen (IARC Group 2B); endocrine disruptor' },
  'en:e321': { name: 'BHT (E321)', risk: 'limited', description: 'Possibly carcinogenic in high doses; limit intake' },

  // Phosphates (high intake linked to kidney stress)
  'en:e452': { name: 'Polyphosphates (E452)', risk: 'limited', description: 'High intake linked to kidney stress and mineral absorption issues' },
  'en:e450': { name: 'Diphosphates (E450)', risk: 'limited', description: 'High phosphate intake linked to cardiovascular risk' },
}

// ---------------------------------------------------------------------------
// Nutri-Score → numeric (0–100)
// ---------------------------------------------------------------------------

const NUTRI_SCORE_MAP: Record<NutriScoreGrade, number> = {
  a: 100,
  b: 75,
  c: 50,
  d: 25,
  e: 0,
}

// ---------------------------------------------------------------------------
// Main scoring function
// ---------------------------------------------------------------------------

export function calculateProductScore(params: {
  nutriscoreGrade?: string | null
  additivesTags?: string[]
  isOrganic?: boolean
  allergensTags?: string[]
}): ProductScore {
  const { nutriscoreGrade, additivesTags = [], isOrganic = false, allergensTags = [] } = params

  // --- Nutritional quality (60%) ---
  const grade = (nutriscoreGrade?.toLowerCase() ?? null) as NutriScoreGrade | null
  const nutriBase = grade != null ? NUTRI_SCORE_MAP[grade] ?? 50 : 50
  const nutriContrib = nutriBase * 0.6

  // --- Additive safety (30%) ---
  const flaggedAdditives: FlaggedAdditive[] = []
  let additivePenalty = 0

  for (const tag of additivesTags) {
    const risk = ADDITIVE_RISKS[tag.toLowerCase()]
    if (risk) {
      flaggedAdditives.push({ code: tag, ...risk })
      if (risk.risk === 'avoid') additivePenalty += 15
      else if (risk.risk === 'limited') additivePenalty += 7
      // 'safe' = no penalty
    }
  }
  // Cap penalty at 30
  const cappedPenalty = Math.min(additivePenalty, 30)
  const additiveContrib = 30 - cappedPenalty

  // --- Organic bonus (10%) ---
  const organicBonus = isOrganic ? 10 : 0

  // --- Total score ---
  const rawScore = nutriContrib + additiveContrib + organicBonus
  const score = Math.round(Math.max(0, Math.min(100, rawScore)))

  // Force score below 25 if any 'avoid' additive present (matches Yuka behaviour)
  const hasAvoid = flaggedAdditives.some((a) => a.risk === 'avoid')
  const finalScore = hasAvoid ? Math.min(score, 24) : score

  // --- Grade & color ---
  let gradeLabel: ProductScore['grade']
  let color: string
  if (finalScore >= 75) { gradeLabel = 'excellent'; color = 'green' }
  else if (finalScore >= 50) { gradeLabel = 'good'; color = 'lime' }
  else if (finalScore >= 25) { gradeLabel = 'mediocre'; color = 'orange' }
  else { gradeLabel = 'poor'; color = 'red' }

  // --- Allergens (clean up tags) ---
  const allergens = allergensTags.map((a) =>
    a.replace(/^en:/, '').replace(/-/g, ' ')
  )

  return {
    score: finalScore,
    grade: gradeLabel,
    color,
    nutriScore: grade,
    additivesPenalty: cappedPenalty,
    organicBonus,
    flaggedAdditives,
    allergens,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function scoreToEmoji(score: number): string {
  if (score >= 75) return '🟢'
  if (score >= 50) return '🟡'
  if (score >= 25) return '🟠'
  return '🔴'
}

export function scoreToLabel(score: number): string {
  if (score >= 75) return 'Excellent'
  if (score >= 50) return 'Good'
  if (score >= 25) return 'Mediocre'
  return 'Poor'
}
