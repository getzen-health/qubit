/**
 * Medication interaction logic — curated database + FDA OpenFDA API
 *
 * Research basis:
 * - Bailey et al. 2013 (CMAJ): Grapefruit-drug interactions
 * - Haller & Benowitz 2000 (NEJM): Ephedra-cardiac event interactions
 * - Sood et al. 2008 (J Gen Intern Med): Herb-drug interactions in surgical patients
 * - NIH Office of Dietary Supplements: Supplement-drug interaction database
 * - Memorial Sloan Kettering: About Herbs database
 */

export interface MedicationProfile {
  name: string
  genericName?: string
  category: string
  commonUses: string[]
  foodInteractions: FoodInteraction[]
  supplementInteractions: SupplementInteraction[]
  timingNotes?: string
}

export interface FoodInteraction {
  food: string
  severity: 'Major' | 'Moderate' | 'Minor'
  mechanism: string
  effect: string
  recommendation: string
}

export interface SupplementInteraction {
  supplement: string
  severity: 'Major' | 'Moderate' | 'Minor'
  mechanism: string
  effect: string
  recommendation: string
}

export interface DrugDrugInteraction {
  drug1: string
  drug2: string
  severity: 'Major' | 'Moderate' | 'Minor' | 'Contraindicated'
  description: string
  mechanism: string
  clinicalSignificance: string
  recommendation: string
}

export const SEVERITY_COLORS: Record<string, string> = {
  Contraindicated:
    'bg-red-100 border-red-400 text-red-900 dark:bg-red-950/50 dark:border-red-700 dark:text-red-200',
  Major: 'bg-red-50 border-red-300 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300',
  Moderate:
    'bg-orange-50 border-orange-300 text-orange-800 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-300',
  Minor:
    'bg-yellow-50 border-yellow-300 text-yellow-800 dark:bg-yellow-950/30 dark:border-yellow-800 dark:text-yellow-300',
}

export const SEVERITY_BADGE_COLORS: Record<string, string> = {
  Contraindicated: 'bg-red-600 text-white',
  Major: 'bg-red-500 text-white',
  Moderate: 'bg-orange-500 text-white',
  Minor: 'bg-yellow-500 text-white',
}

// ─── Curated drug-drug and drug-supplement interactions ───────────────────────

export const KNOWN_INTERACTIONS: DrugDrugInteraction[] = [
  // Warfarin
  {
    drug1: 'warfarin',
    drug2: 'vitamin k',
    severity: 'Major',
    description: 'Vitamin K directly opposes the anticoagulant effect of warfarin.',
    mechanism:
      'Vitamin K is required for coagulation factor synthesis; warfarin inhibits this process.',
    clinicalSignificance: 'Significant reduction in INR; may lead to clotting events.',
    recommendation:
      'Maintain consistent dietary Vitamin K intake; avoid sudden large changes.',
  },
  {
    drug1: 'warfarin',
    drug2: 'fish oil',
    severity: 'Moderate',
    description:
      'Fish oil (omega-3 fatty acids) may increase bleeding risk when combined with warfarin.',
    mechanism:
      'Omega-3 fatty acids inhibit platelet aggregation and may have additive anticoagulant effects.',
    clinicalSignificance: 'Increased INR and bleeding risk at high fish oil doses (>3 g/day).',
    recommendation: 'Monitor INR more frequently; limit fish oil to <3 g/day.',
  },
  {
    drug1: 'warfarin',
    drug2: 'ginkgo',
    severity: 'Major',
    description:
      'Ginkgo biloba increases bleeding risk with warfarin through additive anticoagulant effects.',
    mechanism: 'Ginkgo inhibits platelet-activating factor and has antiplatelet effects.',
    clinicalSignificance:
      'Increased risk of serious bleeding including intracranial hemorrhage.',
    recommendation:
      'Avoid combination; if Ginkgo is essential, monitor INR closely and watch for bleeding signs.',
  },
  {
    drug1: 'warfarin',
    drug2: 'garlic',
    severity: 'Moderate',
    description: 'Garlic supplements may enhance the anticoagulant effect of warfarin.',
    mechanism: 'Garlic inhibits platelet aggregation via ajoene and allicin compounds.',
    clinicalSignificance: 'Increased bleeding risk; elevated INR reported in case studies.',
    recommendation:
      'Use dietary garlic in moderation; avoid high-dose garlic supplements.',
  },
  {
    drug1: 'warfarin',
    drug2: 'ginger',
    severity: 'Moderate',
    description: 'Ginger may potentiate the anticoagulant effects of warfarin.',
    mechanism: 'Ginger inhibits thromboxane synthesis and platelet aggregation.',
    clinicalSignificance: 'Moderate increase in bleeding risk; INR elevation possible.',
    recommendation: 'Limit high-dose ginger supplements; monitor INR.',
  },
  {
    drug1: 'warfarin',
    drug2: 'cranberry',
    severity: 'Moderate',
    description: 'Cranberry juice/supplements may increase warfarin effect and bleeding risk.',
    mechanism:
      'Cranberry may inhibit CYP2C9, the enzyme responsible for warfarin metabolism.',
    clinicalSignificance: 'Case reports of elevated INR and bleeding events.',
    recommendation:
      'Limit cranberry juice to small amounts; monitor INR if consuming regularly.',
  },
  {
    drug1: 'warfarin',
    drug2: 'coenzyme q10',
    severity: 'Moderate',
    description:
      'CoQ10 has structural similarities to Vitamin K and may reduce warfarin effectiveness.',
    mechanism:
      'CoQ10 may have mild Vitamin K-like activity, potentially opposing warfarin.',
    clinicalSignificance: 'Case reports of reduced INR in patients taking CoQ10.',
    recommendation: 'Monitor INR closely when starting or stopping CoQ10.',
  },
  // SSRIs
  {
    drug1: 'ssri',
    drug2: "st. john's wort",
    severity: 'Major',
    description:
      "St. John's Wort combined with SSRIs can cause life-threatening serotonin syndrome.",
    mechanism:
      "St. John's Wort inhibits serotonin reuptake; combined with SSRIs leads to serotonin excess.",
    clinicalSignificance:
      'Risk of serotonin syndrome: agitation, hyperthermia, tachycardia — potentially fatal.',
    recommendation:
      "Avoid combination entirely. Never combine St. John's Wort with any antidepressant.",
  },
  {
    drug1: 'ssri',
    drug2: '5-htp',
    severity: 'Major',
    description:
      '5-HTP is a direct serotonin precursor; combining with SSRIs dramatically increases serotonin.',
    mechanism: '5-HTP is converted to serotonin in the brain; SSRIs prevent its reuptake.',
    clinicalSignificance: 'High risk of serotonin syndrome — potentially life-threatening.',
    recommendation:
      'Avoid combination. Consult a psychiatrist before taking any serotonergic supplement.',
  },
  // Digoxin
  {
    drug1: 'digoxin',
    drug2: "st. john's wort",
    severity: 'Major',
    description: "St. John's Wort significantly reduces digoxin blood levels by up to 25%.",
    mechanism:
      "St. John's Wort induces P-glycoprotein and CYP3A4, accelerating digoxin clearance.",
    clinicalSignificance:
      'Sub-therapeutic digoxin levels; risk of heart failure or arrhythmia recurrence.',
    recommendation:
      "Do not use St. John's Wort with digoxin. If discontinued, recheck digoxin levels.",
  },
  // Statins
  {
    drug1: 'statin',
    drug2: 'coenzyme q10',
    severity: 'Minor',
    description: 'Statins inhibit the mevalonate pathway, reducing endogenous CoQ10 synthesis.',
    mechanism:
      'HMG-CoA reductase inhibition also reduces farnesyl pyrophosphate needed for CoQ10.',
    clinicalSignificance:
      'Reduced CoQ10 levels may contribute to statin-related myopathy; supplementation may help.',
    recommendation: 'Consider CoQ10 100–200 mg/day if experiencing muscle pain on statins.',
  },
  {
    drug1: 'statin',
    drug2: 'red yeast rice',
    severity: 'Major',
    description:
      'Red yeast rice contains monacolin K (identical to lovastatin); combining doubles the statin dose.',
    mechanism:
      'Additive HMG-CoA reductase inhibition leads to excessive cholesterol lowering and toxicity.',
    clinicalSignificance: 'Increased risk of rhabdomyolysis, liver damage.',
    recommendation: 'Never combine red yeast rice with prescription statins.',
  },
  // ACE Inhibitors
  {
    drug1: 'ace inhibitor',
    drug2: 'potassium',
    severity: 'Major',
    description:
      'ACE inhibitors increase potassium retention; potassium supplements can cause dangerous hyperkalemia.',
    mechanism: 'ACE inhibitors reduce aldosterone, increasing renal potassium retention.',
    clinicalSignificance: 'Hyperkalemia can cause fatal cardiac arrhythmias.',
    recommendation:
      'Avoid potassium supplements with ACE inhibitors unless specifically prescribed.',
  },
  // Metformin
  {
    drug1: 'metformin',
    drug2: 'vitamin b12',
    severity: 'Moderate',
    description:
      'Long-term metformin use depletes Vitamin B12 levels in 10–30% of patients.',
    mechanism:
      'Metformin impairs calcium-dependent membrane action needed for ileal B12 absorption.',
    clinicalSignificance:
      'B12 deficiency can cause peripheral neuropathy, anemia, and cognitive changes.',
    recommendation:
      'Supplement B12 1000 mcg/day if on long-term metformin; check B12 annually.',
  },
  // Levothyroxine / thyroid medications
  {
    drug1: 'levothyroxine',
    drug2: 'calcium',
    severity: 'Major',
    description: 'Calcium significantly reduces levothyroxine absorption from the GI tract.',
    mechanism: 'Calcium binds to levothyroxine forming insoluble complexes.',
    clinicalSignificance:
      'Hypothyroidism may worsen; TSH levels rise; dose adjustments needed.',
    recommendation:
      'Take levothyroxine on empty stomach 30–60 min before breakfast; separate calcium by 4+ hours.',
  },
  {
    drug1: 'levothyroxine',
    drug2: 'iron',
    severity: 'Major',
    description: 'Iron supplements significantly impair levothyroxine absorption.',
    mechanism: 'Iron forms insoluble complexes with levothyroxine in the GI tract.',
    clinicalSignificance:
      'Inadequate thyroid replacement; worsened hypothyroid symptoms; increased TSH.',
    recommendation: 'Separate levothyroxine and iron by at least 4 hours.',
  },
  {
    drug1: 'levothyroxine',
    drug2: 'magnesium',
    severity: 'Moderate',
    description: 'Magnesium supplements can reduce the absorption of levothyroxine.',
    mechanism: 'Magnesium may bind to levothyroxine in the GI tract, reducing bioavailability.',
    clinicalSignificance: 'Reduced levothyroxine efficacy; may need dose adjustment.',
    recommendation: 'Separate magnesium and levothyroxine by at least 4 hours.',
  },
  // Beta-blockers
  {
    drug1: 'beta blocker',
    drug2: 'ephedra',
    severity: 'Major',
    description:
      'Ephedra/ephedrine counteracts beta-blocker effects and increases cardiovascular risk.',
    mechanism:
      'Ephedra stimulates alpha and beta receptors, opposing the receptor blockade of beta-blockers.',
    clinicalSignificance:
      'Hypertension, tachycardia; risk of serious cardiovascular events. (Haller & Benowitz 2000, NEJM)',
    recommendation:
      'Avoid ephedra-containing products (including some weight-loss/pre-workout supplements) with beta-blockers.',
  },
  {
    drug1: 'beta blocker',
    drug2: 'caffeine',
    severity: 'Moderate',
    description:
      'High caffeine intake may partially antagonize the heart-rate-lowering effect of beta-blockers.',
    mechanism:
      'Caffeine stimulates the sympathetic nervous system, partially opposing beta-blockade.',
    clinicalSignificance:
      'Reduced antihypertensive/heart rate control; may worsen palpitations.',
    recommendation: 'Limit caffeine to <200 mg/day; avoid caffeine supplements and energy drinks.',
  },
  // Immunosuppressants
  {
    drug1: 'cyclosporine',
    drug2: 'echinacea',
    severity: 'Major',
    description:
      'Echinacea stimulates the immune system, directly opposing immunosuppressant therapy.',
    mechanism:
      'Echinacea activates T-lymphocytes and macrophages, counteracting immunosuppression.',
    clinicalSignificance:
      'Risk of transplant rejection; reduced effectiveness of immunosuppressant therapy.',
    recommendation:
      'Strictly avoid echinacea and immune-stimulating supplements with any immunosuppressant.',
  },
  {
    drug1: 'tacrolimus',
    drug2: 'echinacea',
    severity: 'Major',
    description: 'Echinacea immune stimulation directly opposes tacrolimus immunosuppression.',
    mechanism:
      'Echinacea activates T-lymphocytes and macrophages, counteracting immunosuppression.',
    clinicalSignificance: 'Risk of transplant rejection; organ loss.',
    recommendation: 'Strictly avoid echinacea with tacrolimus.',
  },
  // MAOIs
  {
    drug1: 'maoi',
    drug2: 'tyramine',
    severity: 'Contraindicated',
    description:
      'MAOIs prevent breakdown of tyramine in food, causing potentially fatal hypertensive crisis.',
    mechanism:
      'MAO-A in the gut/liver normally breaks down dietary tyramine; MAOI inhibition leads to tyramine accumulation.',
    clinicalSignificance:
      'Severe hypertensive crisis: sudden severe headache, hypertension >180 mmHg, possible stroke or death.',
    recommendation:
      'Strict low-tyramine diet required: avoid aged cheeses, cured meats, fermented foods, beer, wine.',
  },
  // Clopidogrel
  {
    drug1: 'clopidogrel',
    drug2: 'ginkgo',
    severity: 'Moderate',
    description:
      'Ginkgo has antiplatelet effects that are additive with clopidogrel antiplatelet therapy.',
    mechanism:
      'Ginkgo inhibits platelet-activating factor; combined with clopidogrel the antiplatelet effect is amplified.',
    clinicalSignificance: 'Increased bleeding risk, including spontaneous bruising and GI bleeding.',
    recommendation:
      'Avoid ginkgo with clopidogrel; report any unusual bleeding to your doctor.',
  },
  // Antibiotics
  {
    drug1: 'antibiotic',
    drug2: 'probiotic',
    severity: 'Minor',
    description: 'Antibiotics can kill probiotic organisms if taken simultaneously.',
    mechanism:
      'Antibiotics have broad-spectrum activity that kills both pathogenic and probiotic bacteria.',
    clinicalSignificance:
      'Reduced probiotic efficacy; reduced benefit for antibiotic-associated diarrhea prevention.',
    recommendation:
      'Take probiotics at least 2 hours after antibiotics; continue for 1 week after the course ends.',
  },
  // Aspirin
  {
    drug1: 'aspirin',
    drug2: 'fish oil',
    severity: 'Moderate',
    description:
      'Both aspirin and fish oil have antiplatelet effects; combination increases bleeding risk.',
    mechanism:
      'Additive platelet inhibition through different mechanisms (COX-1 inhibition + reduced thromboxane).',
    clinicalSignificance: 'Increased bleeding time; higher risk of GI bleeding.',
    recommendation:
      'Generally acceptable under physician supervision for cardiovascular benefit; monitor for bleeding signs.',
  },
]

// ─── Curated medication profiles ─────────────────────────────────────────────

const MEDICATION_PROFILES: MedicationProfile[] = [
  {
    name: 'Warfarin',
    genericName: 'warfarin',
    category: 'Anticoagulant',
    commonUses: [
      'Blood clot prevention',
      'Atrial fibrillation',
      'Prosthetic heart valves',
      'DVT/PE treatment',
    ],
    timingNotes: 'Take at the same time each day. INR monitoring required.',
    foodInteractions: [
      {
        food: 'Vitamin K-rich foods (spinach, kale, broccoli, Brussels sprouts)',
        severity: 'Major',
        mechanism: 'Vitamin K directly antagonizes warfarin anticoagulant effect',
        effect: 'Reduced anticoagulation; increased clotting risk',
        recommendation:
          'Maintain consistent Vitamin K intake. Do not suddenly increase or decrease consumption.',
      },
      {
        food: 'Grapefruit',
        severity: 'Moderate',
        mechanism: 'Grapefruit inhibits CYP3A4 enzyme involved in warfarin metabolism',
        effect: 'Potential increase in warfarin levels and bleeding risk',
        recommendation: 'Limit grapefruit and grapefruit juice. (Bailey et al. 2013, CMAJ)',
      },
      {
        food: 'Cranberry juice',
        severity: 'Moderate',
        mechanism: 'Possible CYP2C9 inhibition; increases warfarin anticoagulation',
        effect: 'Elevated INR; increased bleeding risk',
        recommendation: 'Limit to small amounts; monitor INR if consumed regularly.',
      },
      {
        food: 'Alcohol',
        severity: 'Moderate',
        mechanism: 'Acute alcohol inhibits warfarin metabolism; chronic use induces it',
        effect: 'Unpredictable INR changes; increased bleeding risk',
        recommendation: 'Limit alcohol to 1–2 drinks occasionally; avoid binge drinking.',
      },
    ],
    supplementInteractions: [
      {
        supplement: 'Fish Oil / Omega-3',
        severity: 'Moderate',
        mechanism: 'Additive antiplatelet and anticoagulant effects',
        effect: 'Increased bleeding risk; elevated INR',
        recommendation: 'Limit to <3 g/day; monitor INR.',
      },
      {
        supplement: 'Vitamin K',
        severity: 'Major',
        mechanism: 'Direct antagonism of warfarin mechanism of action',
        effect: 'Significantly reduced anticoagulation effect',
        recommendation: 'Avoid vitamin K supplements unless specifically prescribed.',
      },
      {
        supplement: 'Ginkgo Biloba',
        severity: 'Major',
        mechanism: 'Additive platelet inhibition',
        effect: 'Significantly increased bleeding risk',
        recommendation: 'Avoid entirely with warfarin.',
      },
    ],
  },
  {
    name: 'Levothyroxine',
    genericName: 'levothyroxine',
    category: 'Thyroid Hormone',
    commonUses: ['Hypothyroidism', 'Thyroid cancer management'],
    timingNotes:
      'Take on empty stomach 30–60 minutes before breakfast. Separate from other medications/supplements by 4 hours.',
    foodInteractions: [
      {
        food: 'Soy products (tofu, edamame, soy milk)',
        severity: 'Moderate',
        mechanism: 'Soy may inhibit levothyroxine absorption in the gut',
        effect: 'Reduced thyroid hormone levels; hypothyroid symptoms',
        recommendation: 'Separate soy consumption by 4 hours from levothyroxine dose.',
      },
      {
        food: 'Coffee/Espresso',
        severity: 'Moderate',
        mechanism: 'Coffee reduces levothyroxine absorption in the jejunum',
        effect: 'Reduced levothyroxine bioavailability by up to 25%',
        recommendation: 'Do not drink coffee within 1 hour of taking levothyroxine.',
      },
      {
        food: 'High-fiber foods (immediately after dose)',
        severity: 'Minor',
        mechanism: 'Dietary fiber may bind levothyroxine in the GI tract',
        effect: 'Slightly reduced absorption',
        recommendation: 'Take levothyroxine 30–60 min before eating; consistent diet is fine.',
      },
    ],
    supplementInteractions: [
      {
        supplement: 'Calcium',
        severity: 'Major',
        mechanism: 'Calcium forms insoluble complexes with levothyroxine',
        effect: 'Significantly reduced absorption; worsened hypothyroidism',
        recommendation: 'Separate calcium supplements by at least 4 hours.',
      },
      {
        supplement: 'Iron',
        severity: 'Major',
        mechanism: 'Iron forms insoluble complexes with levothyroxine in the GI tract',
        effect: 'Significantly reduced absorption; worsened hypothyroidism',
        recommendation: 'Separate iron supplements by at least 4 hours.',
      },
      {
        supplement: 'Magnesium',
        severity: 'Moderate',
        mechanism: 'Magnesium may bind levothyroxine in the GI tract',
        effect: 'Reduced absorption',
        recommendation: 'Separate magnesium by at least 4 hours.',
      },
    ],
  },
  {
    name: 'Metformin',
    genericName: 'metformin',
    category: 'Antidiabetic',
    commonUses: ['Type 2 diabetes', 'Insulin resistance', 'PCOS'],
    timingNotes: 'Take with meals to reduce GI side effects.',
    foodInteractions: [
      {
        food: 'Alcohol',
        severity: 'Major',
        mechanism:
          'Alcohol inhibits lactate metabolism; combined with metformin increases lactic acidosis risk',
        effect: 'Risk of lactic acidosis (rare but serious)',
        recommendation: 'Limit alcohol consumption; avoid binge drinking.',
      },
    ],
    supplementInteractions: [
      {
        supplement: 'Vitamin B12',
        severity: 'Moderate',
        mechanism: 'Metformin impairs calcium-dependent ileal B12 absorption',
        effect: 'B12 deficiency: peripheral neuropathy, anemia, cognitive changes',
        recommendation:
          'Monitor B12 annually; consider 1000 mcg B12 supplement daily.',
      },
    ],
  },
  {
    name: 'MAOIs',
    genericName: 'phenelzine, tranylcypromine, selegiline',
    category: 'Antidepressant / MAO Inhibitor',
    commonUses: ["Depression", "Parkinson's disease (selegiline)", 'Anxiety disorders'],
    timingNotes:
      'Strict dietary restrictions required. Two-week washout before/after other antidepressants.',
    foodInteractions: [
      {
        food: 'Tyramine-rich foods (aged cheese, cured meats, fermented foods)',
        severity: 'Major',
        mechanism:
          'MAOIs prevent tyramine breakdown in the gut, causing massive norepinephrine release',
        effect: 'Hypertensive crisis: severe headache, severe hypertension, possible stroke or death',
        recommendation:
          'Strict avoidance: aged/hard cheeses, salami, pepperoni, soy sauce, miso, draft beer, red wine.',
      },
    ],
    supplementInteractions: [
      {
        supplement: "St. John's Wort",
        severity: 'Major',
        mechanism:
          "St. John's Wort is serotonergic; combined with MAOIs causes severe serotonin syndrome",
        effect: 'Potentially fatal serotonin syndrome (see MAOI + SSRI interaction above)',
        recommendation: "Never combine. Allow 2-week washout period.",
      },
    ],
  },
  {
    name: 'Statins',
    genericName: 'atorvastatin, simvastatin, rosuvastatin, lovastatin',
    category: 'Cholesterol-Lowering',
    commonUses: ['High cholesterol', 'Cardiovascular disease prevention'],
    timingNotes: 'Some statins taken in the evening; others anytime. Check with your pharmacist.',
    foodInteractions: [
      {
        food: 'Grapefruit',
        severity: 'Major',
        mechanism:
          'Grapefruit inhibits CYP3A4 in the gut wall, dramatically increasing statin blood levels',
        effect: 'Up to 15-fold increase in simvastatin/lovastatin levels; risk of rhabdomyolysis',
        recommendation:
          'Avoid grapefruit with simvastatin and lovastatin. Rosuvastatin/pravastatin are safer alternatives. (Bailey et al. 2013, CMAJ)',
      },
    ],
    supplementInteractions: [
      {
        supplement: 'CoQ10',
        severity: 'Minor',
        mechanism: 'Statins reduce endogenous CoQ10 synthesis via mevalonate pathway inhibition',
        effect:
          'Reduced CoQ10 levels may contribute to statin-related muscle pain and fatigue',
        recommendation:
          'Consider CoQ10 100–200 mg/day if experiencing muscle pain on statins.',
      },
      {
        supplement: 'Red Yeast Rice',
        severity: 'Major',
        mechanism:
          'Red yeast rice contains monacolin K (identical to lovastatin) — additive statin toxicity',
        effect: 'Risk of rhabdomyolysis, liver damage',
        recommendation: 'Never combine red yeast rice with prescription statins.',
      },
    ],
  },
]

// ─── OpenFDA API integration ──────────────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000

interface CachedSearchResult {
  data: Array<{ name: string; rxcui: string }>
  timestamp: number
}

export async function searchMedications(
  query: string,
): Promise<Array<{ name: string; rxcui: string }>> {
  if (!query || query.trim().length < 2) return []

  const key = `med_search_${query.toLowerCase().trim()}`

  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(key)
      if (cached) {
        const parsed: CachedSearchResult = JSON.parse(cached)
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS) return parsed.data
      }
    } catch {
      // ignore cache read errors
    }
  }

  try {
    const q = encodeURIComponent(query.trim())
    const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:%22${q}%22+openfda.generic_name:%22${q}%22&limit=5`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return []

    const json = await res.json()
    const results: Array<{ name: string; rxcui: string }> = []

    for (const item of json.results ?? []) {
      const brands: string[] = item.openfda?.brand_name ?? []
      const generics: string[] = item.openfda?.generic_name ?? []
      const rxcuis: string[] = item.openfda?.rxcui ?? []
      for (const name of [...brands, ...generics]) {
        if (!results.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
          results.push({ name, rxcui: rxcuis[0] ?? '' })
        }
      }
    }

    const final = results.slice(0, 10)

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify({ data: final, timestamp: Date.now() }))
      } catch {
        // ignore cache write errors
      }
    }

    return final
  } catch {
    return []
  }
}

// ─── Interaction checker ──────────────────────────────────────────────────────

export function checkMedicationInteractions(
  medications: string[],
  supplements: string[] = [],
): DrugDrugInteraction[] {
  const all = [...medications, ...supplements].map((s) => s.toLowerCase().trim())

  return KNOWN_INTERACTIONS.filter((ix) => {
    const d1 = ix.drug1.toLowerCase()
    const d2 = ix.drug2.toLowerCase()
    const has1 = all.some((item) => item.includes(d1) || d1.includes(item))
    const has2 = all.some((item) => item.includes(d2) || d2.includes(item))
    return has1 && has2
  })
}

export function getMedicationDetails(name: string): MedicationProfile | undefined {
  const q = name.toLowerCase().trim()
  return MEDICATION_PROFILES.find(
    (m) =>
      m.name.toLowerCase() === q ||
      (m.genericName && m.genericName.toLowerCase().split(/[,\s]+/).some((g) => g === q)),
  )
}

export function getMedicationFoodInteractions(
  medicationNames: string[],
): Array<{ medication: string; interactions: FoodInteraction[] }> {
  return medicationNames
    .map((name) => {
      const profile = getMedicationDetails(name)
      return profile && profile.foodInteractions.length > 0
        ? { medication: profile.name, interactions: profile.foodInteractions }
        : null
    })
    .filter((x): x is { medication: string; interactions: FoodInteraction[] } => x !== null)
}

export function getMedicationSupplementInteractions(
  medicationNames: string[],
): Array<{ medication: string; interactions: SupplementInteraction[] }> {
  return medicationNames
    .map((name) => {
      const profile = getMedicationDetails(name)
      return profile && profile.supplementInteractions.length > 0
        ? { medication: profile.name, interactions: profile.supplementInteractions }
        : null
    })
    .filter(
      (x): x is { medication: string; interactions: SupplementInteraction[] } => x !== null,
    )
}
