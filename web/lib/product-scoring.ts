/**
 * Product Health Scoring — Yuka-style 0–100 scoring for food products.
 *
 * Algorithm (matches Yuka 2024 methodology):
 *   60% — Nutritional quality (Nutri-Score: A=100 … E=0)
 *   30% — Additive safety (penalise harmful E-numbers; 81 high-risk additives per EFSA/WHO)
 *   10% — Organic certification bonus
 *
 * Additional signal (not in score, but surfaced in UI):
 *   NOVA group — ultra-processing classification (Monteiro et al., BMJ 2024)
 *   Source: EFSA evaluations, IARC classifications, WHO/FAO guidance, Yuka methodology docs
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
  novaGroup: NovaGroup | null // 1–4 ultra-processing scale
}

export type NutriScoreGrade = 'a' | 'b' | 'c' | 'd' | 'e'
export type NovaGroup = 1 | 2 | 3 | 4

export interface FlaggedAdditive {
  code: string // e.g. "en:e621"
  name: string
  risk: 'avoid' | 'limited' | 'safe'
  description: string
}

// ---------------------------------------------------------------------------
// Additive Risk Database (81+ high-risk E-numbers)
// Sources: EFSA evaluations, IARC classifications, WHO guidance, Yuka 2024
// ---------------------------------------------------------------------------

const ADDITIVE_RISKS: Record<
  string,
  { name: string; risk: 'avoid' | 'limited' | 'safe'; description: string }
> = {
  // ── Azo colorants (linked to hyperactivity in children — EFSA 2008 & 2012) ──
  'en:e102': { name: 'Tartrazine', risk: 'avoid', description: 'Linked to hyperactivity in children; banned in some countries' },
  'en:e104': { name: 'Quinoline Yellow', risk: 'avoid', description: 'Linked to hyperactivity; restricted in several countries' },
  'en:e110': { name: 'Sunset Yellow FCF', risk: 'avoid', description: 'Linked to hyperactivity and allergic reactions in children' },
  'en:e122': { name: 'Carmoisine', risk: 'avoid', description: 'Azo dye; linked to hyperactivity; restricted in some countries' },
  'en:e123': { name: 'Amaranth', risk: 'avoid', description: 'Banned in USA; suspected carcinogen; hyperactivity link' },
  'en:e124': { name: 'Ponceau 4R', risk: 'avoid', description: 'Azo dye; hyperactivity link; restricted in some countries' },
  'en:e129': { name: 'Allura Red AC', risk: 'limited', description: 'Possible hyperactivity link; restricted in some countries' },
  'en:e131': { name: 'Patent Blue V', risk: 'limited', description: 'May cause allergic reactions; banned in USA/Australia' },
  'en:e132': { name: 'Indigotine', risk: 'safe', description: 'Generally safe; possible allergic reactions at high intake' },
  'en:e133': { name: 'Brilliant Blue FCF', risk: 'safe', description: 'Generally considered safe at approved levels' },
  'en:e142': { name: 'Green S', risk: 'limited', description: 'Banned in USA, Canada, Japan; limited safety data' },
  'en:e150a': { name: 'Plain caramel', risk: 'safe', description: 'Generally safe in food use' },
  'en:e150c': { name: 'Ammonia caramel', risk: 'limited', description: 'Contains 4-MEI; potential carcinogen at high doses' },
  'en:e150d': { name: 'Sulphite ammonia caramel', risk: 'limited', description: '4-MEI concerns; commonly in colas and dark sauces' },
  'en:e151': { name: 'Brilliant Black BN', risk: 'limited', description: 'Azo dye; hyperactivity link; banned in USA, Canada' },
  'en:e155': { name: 'Brown HT', risk: 'limited', description: 'Azo dye; banned in USA, Australia, Canada; allergy risk' },
  'en:e160a': { name: 'Beta-carotene', risk: 'safe', description: 'Natural vitamin A precursor; generally safe' },
  'en:e171': { name: 'Titanium dioxide', risk: 'avoid', description: 'Banned in EU food as of 2022; genotoxicity concerns (EFSA 2021)' },
  'en:e172': { name: 'Iron oxides', risk: 'safe', description: 'Generally safe in approved quantities' },

  // ── Preservatives ──
  'en:e200': { name: 'Sorbic acid', risk: 'safe', description: 'Generally considered safe; natural preservative' },
  'en:e202': { name: 'Potassium sorbate', risk: 'safe', description: 'Generally safe; may cause skin sensitivity in rare cases' },
  'en:e210': { name: 'Benzoic acid', risk: 'limited', description: 'Can form benzene with Vitamin C; hyperactivity at high doses' },
  'en:e211': { name: 'Sodium benzoate', risk: 'limited', description: 'Can form benzene with ascorbic acid; hyperactivity link' },
  'en:e212': { name: 'Potassium benzoate', risk: 'limited', description: 'Forms benzene with Vitamin C; similar concerns to E211' },
  'en:e213': { name: 'Calcium benzoate', risk: 'limited', description: 'Benzene formation concern; similar to E211' },
  'en:e214': { name: 'Ethyl 4-hydroxybenzoate', risk: 'limited', description: 'Paraben; potential endocrine disruption concerns' },
  'en:e215': { name: 'Sodium ethyl para-hydroxybenzoate', risk: 'limited', description: 'Paraben; endocrine disruption concerns' },
  'en:e216': { name: 'Propyl 4-hydroxybenzoate', risk: 'avoid', description: 'Paraben; banned in Denmark; endocrine disruptor concerns' },
  'en:e218': { name: 'Methyl 4-hydroxybenzoate', risk: 'limited', description: 'Paraben; potential endocrine disruption concerns' },
  'en:e220': { name: 'Sulphur dioxide', risk: 'limited', description: 'Destroys vitamin B1; may cause reactions in asthmatics' },
  'en:e221': { name: 'Sodium sulphite', risk: 'limited', description: 'Sulphite; can trigger asthma attacks' },
  'en:e222': { name: 'Sodium bisulphite', risk: 'limited', description: 'Sulphite; asthma trigger; destroys thiamine (B1)' },
  'en:e223': { name: 'Sodium metabisulphite', risk: 'limited', description: 'Sulphite; asthma trigger' },
  'en:e224': { name: 'Potassium metabisulphite', risk: 'limited', description: 'Sulphite; asthma trigger' },
  'en:e226': { name: 'Calcium sulphite', risk: 'limited', description: 'Sulphite; asthma trigger' },
  'en:e227': { name: 'Calcium bisulphite', risk: 'limited', description: 'Sulphite; asthma trigger' },
  'en:e228': { name: 'Potassium bisulphite', risk: 'limited', description: 'Sulphite; may cause reactions in asthmatics' },
  'en:e249': { name: 'Potassium nitrite', risk: 'avoid', description: 'Linked to colorectal cancer risk (IARC Group 2A)' },
  'en:e250': { name: 'Sodium nitrite', risk: 'avoid', description: 'Linked to colorectal cancer risk (IARC Group 2A)' },
  'en:e251': { name: 'Sodium nitrate', risk: 'avoid', description: 'Converts to nitrite in the body; cancer risk concerns' },
  'en:e252': { name: 'Potassium nitrate', risk: 'avoid', description: 'Converts to nitrite; linked to colorectal cancer risk' },

  // ── Antioxidants / acidity regulators ──
  'en:e310': { name: 'Propyl gallate', risk: 'limited', description: 'Possible endocrine disruption; not permitted for baby food' },
  'en:e311': { name: 'Octyl gallate', risk: 'limited', description: 'Gallate; possible allergic reactions' },
  'en:e312': { name: 'Dodecyl gallate', risk: 'limited', description: 'Gallate; possible allergic reactions' },
  'en:e320': { name: 'BHA (Butylated hydroxyanisole)', risk: 'avoid', description: 'Possible carcinogen (IARC Group 2B); endocrine disruptor' },
  'en:e321': { name: 'BHT (Butylated hydroxytoluene)', risk: 'limited', description: 'Possibly carcinogenic in high doses; limit intake' },
  'en:e385': { name: 'Calcium EDTA', risk: 'limited', description: 'EDTA chelator; may impair mineral absorption' },

  // ── Emulsifiers / stabilisers (gut microbiome concerns) ──
  'en:e407': { name: 'Carrageenan', risk: 'avoid', description: 'Animal studies show gut inflammation; avoid in formula for infants' },
  'en:e407a': { name: 'Processed Eucheuma seaweed', risk: 'limited', description: 'Degraded carrageenan component; gut inflammation concerns' },
  'en:e412': { name: 'Guar gum', risk: 'safe', description: 'Generally safe; may cause bloating at high intake' },
  'en:e415': { name: 'Xanthan gum', risk: 'safe', description: 'Generally safe; prebiotic properties' },
  'en:e422': { name: 'Glycerol', risk: 'safe', description: 'Generally safe in food use' },
  'en:e433': { name: 'Polysorbate 80', risk: 'limited', description: 'Emulsifier; animal studies show gut microbiome disruption' },
  'en:e434': { name: 'Polysorbate 40', risk: 'limited', description: 'Similar concerns to polysorbate 80' },
  'en:e435': { name: 'Polysorbate 60', risk: 'limited', description: 'Similar concerns to polysorbate 80' },
  'en:e436': { name: 'Polysorbate 65', risk: 'limited', description: 'Similar concerns to polysorbate 80' },
  'en:e450': { name: 'Diphosphates', risk: 'limited', description: 'High phosphate intake linked to cardiovascular and kidney risk' },
  'en:e451': { name: 'Triphosphates', risk: 'limited', description: 'High phosphate load; kidney stress concerns' },
  'en:e452': { name: 'Polyphosphates', risk: 'limited', description: 'High phosphate intake linked to kidney stress' },
  'en:e471': { name: 'Mono- and diglycerides of fatty acids', risk: 'limited', description: 'May contain trans fats; NOVA 4 marker' },
  'en:e472a': { name: 'Acetic acid esters (ACETEM)', risk: 'limited', description: 'Industrial emulsifier; NOVA 4 marker' },
  'en:e472b': { name: 'Lactic acid esters (LACTEM)', risk: 'limited', description: 'Industrial emulsifier; NOVA 4 marker' },
  'en:e472c': { name: 'Citric acid esters (CITREM)', risk: 'limited', description: 'Industrial emulsifier; NOVA 4 marker' },
  'en:e472e': { name: 'DATEM', risk: 'limited', description: 'Industrial emulsifier; NOVA 4 marker' },
  'en:e476': { name: 'Polyglycerol polyricinoleate (PGPR)', risk: 'limited', description: 'Industrial emulsifier; primarily used in cheap chocolate' },
  'en:e481': { name: 'Sodium stearoyl lactylate (SSL)', risk: 'limited', description: 'Industrial emulsifier; generally considered safe' },
  'en:e482': { name: 'Calcium stearoyl lactylate (CSL)', risk: 'limited', description: 'Industrial emulsifier; generally safe' },

  // ── Sweeteners ──
  'en:e420': { name: 'Sorbitol', risk: 'safe', description: 'Sugar alcohol; may cause digestive discomfort at high intake' },
  'en:e421': { name: 'Mannitol', risk: 'safe', description: 'Sugar alcohol; laxative effect at high intake' },
  'en:e950': { name: 'Acesulfame K', risk: 'limited', description: 'Some studies suggest metabolic effects; limit intake' },
  'en:e951': { name: 'Aspartame', risk: 'limited', description: 'Classified as "possibly carcinogenic" (IARC 2B, 2023); limit intake' },
  'en:e952': { name: 'Cyclamate', risk: 'avoid', description: 'Banned in USA; potential carcinogen and endocrine disruptor' },
  'en:e954': { name: 'Saccharin', risk: 'limited', description: 'Controversial; animal studies showed bladder cancer risk' },
  'en:e955': { name: 'Sucralose', risk: 'limited', description: 'May alter gut microbiome; 2023 studies raise DNA damage concerns' },
  'en:e957': { name: 'Thaumatin', risk: 'safe', description: 'Protein sweetener; generally safe' },
  'en:e960': { name: 'Steviol glycosides', risk: 'safe', description: 'Natural plant-derived sweetener; generally safe' },
  'en:e961': { name: 'Neotame', risk: 'limited', description: 'Aspartame derivative; limited long-term safety data' },
  'en:e962': { name: 'Salt of aspartame-acesulfame', risk: 'limited', description: 'Contains aspartame; IARC 2B concerns' },
  'en:e968': { name: 'Erythritol', risk: 'limited', description: '2023 study (Nature Medicine) linked to cardiovascular risk at high doses' },

  // ── Flavour enhancers ──
  'en:e620': { name: 'Glutamic acid', risk: 'safe', description: 'Natural amino acid; generally safe' },
  'en:e621': { name: 'Monosodium glutamate (MSG)', risk: 'safe', description: 'Generally safe; high sodium content; possible sensitivity in some' },
  'en:e622': { name: 'Monopotassium glutamate', risk: 'safe', description: 'Generally safe; reduce if sensitive to glutamates' },
  'en:e627': { name: 'Disodium guanylate', risk: 'safe', description: 'Generally safe; avoid if sensitive to purines' },
  'en:e631': { name: 'Disodium inosinate', risk: 'safe', description: 'Generally safe; avoid if sensitive to purines (gout)' },
  'en:e635': { name: "Disodium 5'-ribonucleotides", risk: 'safe', description: 'Generally safe; avoid if sensitive to purines' },

  // ── Miscellaneous (brominated/controversial) ──
  'en:e173': { name: 'Aluminium', risk: 'avoid', description: 'Neurotoxic at high levels; banned in several countries for food use' },
  'en:e900': { name: 'Dimethylpolysiloxane (PDMS)', risk: 'safe', description: 'Anti-foaming agent; generally safe' },
  'en:e924': { name: 'Potassium bromate', risk: 'avoid', description: 'Possible carcinogen (IARC 2B); banned in EU, UK, Canada' },
  'en:e928': { name: 'Benzoyl peroxide', risk: 'limited', description: 'Flour bleaching agent; banned in EU; irritant' },
  'en:e999': { name: 'Quillaja extract', risk: 'safe', description: 'Plant-derived foaming agent; generally safe' },
}

// ---------------------------------------------------------------------------
// NOVA Ultra-Processed Food Markers
// Group 4 indicators: industrial emulsifiers, synthetic colorants, flavourings,
// artificial sweeteners — Monteiro et al., BMJ 2024
// ---------------------------------------------------------------------------

const NOVA4_ADDITIVE_PREFIXES = ['en:e1', 'en:e47', 'en:e48', 'en:e4']
const NOVA4_ADDITIVE_CODES = new Set([
  'en:e150c', 'en:e150d', 'en:e171', 'en:e433', 'en:e434', 'en:e435',
  'en:e436', 'en:e471', 'en:e472a', 'en:e472b', 'en:e472c', 'en:e472e',
  'en:e476', 'en:e481', 'en:e482', 'en:e950', 'en:e951', 'en:e952',
  'en:e954', 'en:e955', 'en:e961', 'en:e962',
])

function detectNovaGroup(additivesTags: string[]): NovaGroup {
  if (additivesTags.length === 0) return 1
  const lowerTags = additivesTags.map((t) => t.toLowerCase())
  const hasNova4 = lowerTags.some(
    (tag) =>
      NOVA4_ADDITIVE_CODES.has(tag) ||
      NOVA4_ADDITIVE_PREFIXES.some((p) => tag.startsWith(p) && tag !== 'en:e160a')
  )
  if (hasNova4) return 4
  if (lowerTags.length > 5) return 3
  if (lowerTags.length > 0) return 2
  return 1
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
    }
  }
  const cappedPenalty = Math.min(additivePenalty, 30)
  const additiveContrib = 30 - cappedPenalty

  // --- Organic bonus (10%) ---
  const organicBonus = isOrganic ? 10 : 0

  // --- Total score ---
  const rawScore = nutriContrib + additiveContrib + organicBonus
  const score = Math.round(Math.max(0, Math.min(100, rawScore)))

  // Yuka behaviour: any 'avoid' additive forces score ≤ 24 (poor)
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

  // --- NOVA group ---
  const novaGroup = detectNovaGroup(additivesTags)

  return {
    score: finalScore,
    grade: gradeLabel,
    color,
    nutriScore: grade,
    additivesPenalty: cappedPenalty,
    organicBonus,
    flaggedAdditives,
    allergens,
    novaGroup,
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

export function novaGroupLabel(group: NovaGroup): string {
  switch (group) {
    case 1: return 'Unprocessed'
    case 2: return 'Culinary ingredient'
    case 3: return 'Processed'
    case 4: return 'Ultra-processed'
  }
}

export function novaGroupColor(group: NovaGroup): string {
  switch (group) {
    case 1: return 'green'
    case 2: return 'lime'
    case 3: return 'orange'
    case 4: return 'red'
  }
}

