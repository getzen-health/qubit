export type HealthGoal = 'muscle' | 'sleep' | 'stress' | 'heart' | 'brain' | 'gut' | 'energy' | 'longevity' | 'immunity' | 'hormones' | 'weight'
export type EvidenceGrade = 'A' | 'B' | 'C'
export type DietPattern = 'vegan' | 'vegetarian' | 'omnivore' | 'carnivore' | 'keto'

export interface SupplementRecommendation {
  name: string
  dose: string
  timing: string
  evidence: EvidenceGrade
  evidence_summary: string
  priority: 'Essential' | 'Beneficial' | 'Experimental'
  for_goals: HealthGoal[]
  contraindications: string[]
  monthly_cost_usd: string
  interaction_notes?: string
  emoji: string
}

export interface RecommendedStack {
  essential: SupplementRecommendation[]
  beneficial: SupplementRecommendation[]
  experimental: SupplementRecommendation[]
  avoid: { name: string; reason: string }[]
  total_monthly_cost: string
  priority_order: string[]
}

export const SUPPLEMENT_RECOMMENDATIONS: SupplementRecommendation[] = [
  {
    name: 'Creatine Monohydrate',
    dose: '3–5g/day',
    timing: 'Post-workout with carbs',
    evidence: 'A',
    evidence_summary: 'Strongest evidence of any performance supplement; improves strength, power, and lean mass.',
    priority: 'Essential',
    for_goals: ['muscle', 'brain', 'energy'],
    contraindications: ['kidney disease'],
    monthly_cost_usd: '$8–15',
    emoji: '💪',
  },
  {
    name: 'Vitamin D3 + K2',
    dose: '2000–4000 IU D3 + 90–180mcg K2',
    timing: 'With largest fat-containing meal',
    evidence: 'A',
    evidence_summary: 'Deficiency affects >1B people; correcting it improves immunity, mood, bone density, and testosterone.',
    priority: 'Essential',
    for_goals: ['immunity', 'hormones', 'heart', 'muscle', 'brain'],
    contraindications: ['warfarin (K2 interaction)', 'hypercalcemia'],
    monthly_cost_usd: '$10–18',
    interaction_notes: 'K2 directs calcium to bones; take together for synergistic benefit.',
    emoji: '☀️',
  },
  {
    name: 'Magnesium Glycinate',
    dose: '300–400mg elemental',
    timing: '1–2h before bed',
    evidence: 'B',
    evidence_summary: 'Tarleton et al. (PLoS ONE 2017): magnesium glycinate significantly reduced anxiety and depression scores.',
    priority: 'Essential',
    for_goals: ['sleep', 'stress', 'muscle', 'heart', 'hormones'],
    contraindications: ['kidney failure', 'myasthenia gravis'],
    monthly_cost_usd: '$12–20',
    emoji: '😴',
  },
  {
    name: 'Omega-3 (EPA + DHA)',
    dose: '1–3g combined EPA+DHA/day',
    timing: 'With fat-containing meal; split if >2g',
    evidence: 'A',
    evidence_summary: 'Meta-analyses confirm reductions in triglycerides, inflammation, and cardiovascular risk.',
    priority: 'Essential',
    for_goals: ['heart', 'brain', 'immunity', 'stress', 'longevity'],
    contraindications: ['fish/shellfish allergy (use algal oil)', 'blood thinners at high dose'],
    monthly_cost_usd: '$15–30',
    interaction_notes: 'Algal-oil DHA/EPA for vegans; achieves identical plasma levels.',
    emoji: '🐟',
  },
  {
    name: 'Protein Powder',
    dose: 'Fill gap to 1.6–2.2g/kg body weight',
    timing: 'Post-workout or as needed',
    evidence: 'A',
    evidence_summary: 'Morton et al. (BJSM 2018): protein ≥1.6g/kg maximises muscle protein synthesis in resistance-trained adults.',
    priority: 'Essential',
    for_goals: ['muscle', 'weight', 'energy'],
    contraindications: ['dairy allergy (choose plant-based)', 'kidney disease (consult MD)'],
    monthly_cost_usd: '$25–45',
    emoji: '🥤',
  },
  {
    name: 'L-Theanine',
    dose: '100–200mg',
    timing: 'As needed; stacks with caffeine (1:2 ratio)',
    evidence: 'B',
    evidence_summary: 'Hidese et al. (Nutrients 2019): L-theanine improved stress, anxiety, and sleep quality without sedation.',
    priority: 'Beneficial',
    for_goals: ['stress', 'sleep', 'brain', 'energy'],
    contraindications: [],
    monthly_cost_usd: '$8–15',
    interaction_notes: 'Pairs synergistically with caffeine for focused calm.',
    emoji: '🍵',
  },
  {
    name: 'Ashwagandha KSM-66',
    dose: '300–600mg/day',
    timing: 'With food; morning or bedtime',
    evidence: 'B',
    evidence_summary: 'KSM-66 extract reduces cortisol ~28%, improves VO2 max, sleep, and testosterone in stressed adults.',
    priority: 'Beneficial',
    for_goals: ['stress', 'hormones', 'sleep', 'muscle', 'energy'],
    contraindications: ['thyroid disorders (monitor TSH)', 'autoimmune disease', 'pregnancy'],
    monthly_cost_usd: '$15–25',
    emoji: '🌿',
  },
  {
    name: "Lion's Mane",
    dose: '500–1000mg/day',
    timing: 'Morning with food',
    evidence: 'B',
    evidence_summary: "Mori et al. (Int J Mol Sci 2021): Lion's Mane stimulates NGF synthesis, improving cognition and mild depression.",
    priority: 'Beneficial',
    for_goals: ['brain', 'immunity', 'gut'],
    contraindications: ['mushroom allergy'],
    monthly_cost_usd: '$20–35',
    emoji: '🍄',
  },
  {
    name: 'Probiotics (Multi-strain)',
    dose: '10–50B CFU, multi-strain',
    timing: '30 min before meals or with food',
    evidence: 'A',
    evidence_summary: 'Cochrane reviews: multi-strain probiotics reduce IBS symptoms, improve immunity, and modulate mood via gut-brain axis.',
    priority: 'Essential',
    for_goals: ['gut', 'immunity', 'brain', 'weight'],
    contraindications: ['immunocompromised (consult MD)', 'severe illness'],
    monthly_cost_usd: '$20–40',
    emoji: '🦠',
  },
  {
    name: 'CoQ10 (Ubiquinol)',
    dose: '100–200mg/day',
    timing: 'Morning with fat-containing meal',
    evidence: 'B',
    evidence_summary: 'CoQ10 improves mitochondrial energy production; ubiquinol form has ~3× better bioavailability after age 40.',
    priority: 'Beneficial',
    for_goals: ['energy', 'heart', 'longevity'],
    contraindications: ['blood thinners (additive effect)', 'chemotherapy'],
    monthly_cost_usd: '$20–40',
    emoji: '⚡',
  },
  {
    name: 'Vitamin B Complex',
    dose: 'As labeled (100% RDI each B vitamin)',
    timing: 'Morning with food',
    evidence: 'A',
    evidence_summary: 'B12, B6, folate deficiencies cause fatigue, anemia, and neurological decline; repletion rapidly reverses symptoms.',
    priority: 'Essential',
    for_goals: ['energy', 'brain', 'stress', 'hormones'],
    contraindications: ['B6 >100mg long-term causes neuropathy'],
    monthly_cost_usd: '$8–15',
    interaction_notes: 'Vegans are at high risk for B12 deficiency; sublingual methylcobalamin preferred.',
    emoji: '⚡',
  },
  {
    name: 'Zinc Picolinate',
    dose: '15–30mg/day',
    timing: 'Between meals or bedtime',
    evidence: 'A',
    evidence_summary: 'Zinc is essential for 300+ enzymes; deficiency impairs immunity, testosterone synthesis, and wound healing.',
    priority: 'Essential',
    for_goals: ['immunity', 'hormones', 'muscle', 'gut'],
    contraindications: ['>40mg/day depletes copper (add 1–2mg copper)'],
    monthly_cost_usd: '$8–12',
    emoji: '🦠',
  },
  {
    name: 'Iron (Bisglycinate)',
    dose: 'Per deficiency test (typically 18–65mg)',
    timing: 'Fasted or with vitamin C',
    evidence: 'A',
    evidence_summary: 'Iron-deficiency anemia is the world\'s most prevalent nutritional deficiency; bisglycinate form causes less GI upset.',
    priority: 'Essential',
    for_goals: ['energy', 'immunity', 'hormones'],
    contraindications: ['hemochromatosis', 'do not supplement without confirmed deficiency'],
    monthly_cost_usd: '$8–15',
    interaction_notes: 'Avoid with calcium, coffee, tea, zinc within 2h.',
    emoji: '🩸',
  },
  {
    name: 'Collagen Peptides',
    dose: '10–15g/day',
    timing: '1h before training or with vitamin C',
    evidence: 'B',
    evidence_summary: 'Shaw et al. (Am J Clin Nutr 2017): collagen + vitamin C pre-exercise doubled collagen synthesis in tendons/ligaments.',
    priority: 'Beneficial',
    for_goals: ['muscle', 'gut', 'longevity'],
    contraindications: ['fish/shellfish allergy (choose bovine)'],
    monthly_cost_usd: '$20–35',
    interaction_notes: 'Vitamin C co-administration required for collagen synthesis.',
    emoji: '🦴',
  },
  {
    name: 'NAC (N-Acetyl Cysteine)',
    dose: '600mg/day (up to 1200mg)',
    timing: 'With food',
    evidence: 'B',
    evidence_summary: 'NAC is the precursor to glutathione; meta-analyses show benefits for respiratory health, OCD, and addiction.',
    priority: 'Beneficial',
    for_goals: ['immunity', 'brain', 'longevity', 'gut'],
    contraindications: ['asthma (use caution)', 'nitroglycerin interaction'],
    monthly_cost_usd: '$10–18',
    emoji: '🛡️',
  },
  {
    name: 'Berberine',
    dose: '500mg 3× daily with meals',
    timing: 'Split across meals for steady plasma levels',
    evidence: 'B',
    evidence_summary: 'Yin et al. (Metabolism 2008): berberine comparable to metformin for HbA1c reduction; activates AMPK pathway.',
    priority: 'Beneficial',
    for_goals: ['weight', 'gut', 'heart', 'longevity'],
    contraindications: ['diabetes medications (additive hypoglycemia)', 'pregnancy', 'metformin'],
    monthly_cost_usd: '$15–25',
    emoji: '🌿',
  },
  {
    name: 'NMN (Nicotinamide Mononucleotide)',
    dose: '250–500mg/day',
    timing: 'Morning on empty stomach',
    evidence: 'C',
    evidence_summary: 'Human trials emerging; animal data robust for NAD+ precursor restoring mitochondrial function and cellular repair.',
    priority: 'Experimental',
    for_goals: ['longevity', 'energy', 'brain'],
    contraindications: ['hormone-sensitive cancers (theoretical)'],
    monthly_cost_usd: '$40–80',
    emoji: '🧬',
  },
  {
    name: 'Spermidine',
    dose: '1–5mg/day',
    timing: 'With food',
    evidence: 'C',
    evidence_summary: 'Madeo et al. (Science 2018): spermidine induces autophagy; epidemiological data links higher intake to longevity.',
    priority: 'Experimental',
    for_goals: ['longevity', 'brain', 'immunity'],
    contraindications: [],
    monthly_cost_usd: '$30–60',
    emoji: '🧬',
  },
  {
    name: 'Rhodiola Rosea',
    dose: '200–600mg/day (3% rosavins)',
    timing: 'Morning, away from food',
    evidence: 'B',
    evidence_summary: 'Darbinyan et al. (Phytomedicine 2000): Rhodiola significantly reduced mental fatigue and improved attention in stressful conditions.',
    priority: 'Beneficial',
    for_goals: ['stress', 'energy', 'brain'],
    contraindications: ['bipolar disorder', 'MAOIs'],
    monthly_cost_usd: '$15–25',
    emoji: '🌸',
  },
  {
    name: 'Bacopa Monnieri',
    dose: '300mg/day (55% bacosides)',
    timing: 'With fat-containing meal',
    evidence: 'B',
    evidence_summary: 'Meta-analysis (J Altern Complement Med 2014): Bacopa improved memory acquisition and retention; onset at 6–8 weeks.',
    priority: 'Beneficial',
    for_goals: ['brain', 'stress'],
    contraindications: ['thyroid medications', 'anticholinergic drugs'],
    monthly_cost_usd: '$12–20',
    emoji: '🧠',
  },
  {
    name: 'Phosphatidylserine',
    dose: '100–300mg/day',
    timing: 'With meals',
    evidence: 'B',
    evidence_summary: 'FDA-qualified claim: phosphatidylserine may reduce risk of cognitive dysfunction and dementia; cortisol-lowering effect.',
    priority: 'Beneficial',
    for_goals: ['brain', 'stress', 'longevity'],
    contraindications: ['blood thinners'],
    monthly_cost_usd: '$20–35',
    emoji: '🧠',
  },
  {
    name: 'Alpha-Lipoic Acid',
    dose: '300–600mg/day',
    timing: 'Fasted (food reduces bioavailability 30%)',
    evidence: 'B',
    evidence_summary: 'Both water- and fat-soluble antioxidant; improves insulin sensitivity and regenerates vitamins C and E.',
    priority: 'Beneficial',
    for_goals: ['weight', 'longevity', 'energy', 'heart'],
    contraindications: ['diabetes medications (additive hypoglycemia)', 'thyroid medications'],
    monthly_cost_usd: '$10–20',
    emoji: '🛡️',
  },
  {
    name: 'Curcumin (+ Piperine)',
    dose: '500–1000mg curcuminoids + 5–10mg piperine',
    timing: 'With fat-containing meal',
    evidence: 'B',
    evidence_summary: 'Hewlings & Kalman (Foods 2017): curcumin reduces CRP and inflammatory cytokines; piperine increases bioavailability 2000%.',
    priority: 'Beneficial',
    for_goals: ['immunity', 'brain', 'longevity', 'gut', 'heart'],
    contraindications: ['blood thinners', 'gallbladder disease', 'piperine interacts with many drugs'],
    monthly_cost_usd: '$15–25',
    emoji: '🟡',
  },
  {
    name: 'Quercetin',
    dose: '500–1000mg/day',
    timing: 'With meals',
    evidence: 'C',
    evidence_summary: 'Preclinical senolytic activity and anti-inflammatory properties; human longevity trials ongoing (Mayo Clinic).',
    priority: 'Experimental',
    for_goals: ['longevity', 'immunity'],
    contraindications: ['quinolone antibiotics', 'cyclosporine'],
    monthly_cost_usd: '$15–25',
    emoji: '🍎',
  },
  {
    name: 'Resveratrol',
    dose: '100–500mg/day',
    timing: 'With fat-containing meal',
    evidence: 'C',
    evidence_summary: 'Activates sirtuins (SIRT1) and AMPK in vitro; human bioavailability is poor — pterostilbene may be superior.',
    priority: 'Experimental',
    for_goals: ['longevity', 'heart', 'brain'],
    contraindications: ['blood thinners', 'estrogen-sensitive cancers'],
    monthly_cost_usd: '$15–30',
    emoji: '🍷',
  },
  {
    name: 'Melatonin',
    dose: '0.5–3mg (low dose preferred)',
    timing: '30–60 min before target sleep time',
    evidence: 'A',
    evidence_summary: 'Cochrane review: melatonin reduces sleep-onset latency for jet lag and shift work; 0.5mg as effective as 5mg.',
    priority: 'Beneficial',
    for_goals: ['sleep', 'longevity', 'brain'],
    contraindications: ['autoimmune disease', 'anticoagulants', 'pregnancy'],
    monthly_cost_usd: '$5–10',
    emoji: '🌙',
  },
  {
    name: 'Glycine',
    dose: '3g before bed',
    timing: '1h before bed',
    evidence: 'B',
    evidence_summary: 'Bannai et al. (Sleep Biol Rhythms 2012): 3g glycine before bed reduced daytime sleepiness and improved sleep quality.',
    priority: 'Beneficial',
    for_goals: ['sleep', 'gut', 'longevity', 'muscle'],
    contraindications: ['schizophrenia (conflicting evidence)'],
    monthly_cost_usd: '$8–12',
    emoji: '💤',
  },
  {
    name: 'Taurine',
    dose: '1–3g/day',
    timing: 'Pre-exercise or with meals',
    evidence: 'B',
    evidence_summary: 'Ito et al. (Life 2022): taurine levels decline with age; supplementation improved mitochondrial function and lifespan in mice.',
    priority: 'Beneficial',
    for_goals: ['heart', 'energy', 'longevity', 'muscle'],
    contraindications: [],
    monthly_cost_usd: '$8–15',
    emoji: '💙',
  },
  {
    name: 'Prebiotic Fiber (Inulin/FOS)',
    dose: '5–10g/day',
    timing: 'With meals; start low to minimize gas',
    evidence: 'A',
    evidence_summary: 'Meta-analysis (Am J Clin Nutr 2022): prebiotic supplementation significantly increases Bifidobacterium and reduces LPS.',
    priority: 'Beneficial',
    for_goals: ['gut', 'immunity', 'weight', 'brain'],
    contraindications: ['SIBO (may worsen symptoms)', 'IBS-D (use caution)'],
    monthly_cost_usd: '$10–20',
    emoji: '🌾',
  },
  {
    name: 'Digestive Enzymes',
    dose: 'As labeled with meals',
    timing: 'Start of each meal',
    evidence: 'B',
    evidence_summary: 'EPI and exocrine insufficiency trials show benefit; also reduces bloating from lectins and FODMAPs in healthy adults.',
    priority: 'Beneficial',
    for_goals: ['gut', 'weight', 'immunity'],
    contraindications: ['pancreatitis', 'pork allergy (if porcine-derived)'],
    monthly_cost_usd: '$15–30',
    emoji: '🔬',
  },
  {
    name: 'Vitamin C',
    dose: '500–1000mg/day',
    timing: 'With meals; split doses if >500mg',
    evidence: 'A',
    evidence_summary: 'Cochrane review: vitamin C reduces duration/severity of colds; essential cofactor for collagen and norepinephrine synthesis.',
    priority: 'Essential',
    for_goals: ['immunity', 'stress', 'longevity', 'gut'],
    contraindications: ['kidney stones history (>1g/day)', 'hemochromatosis'],
    monthly_cost_usd: '$5–10',
    emoji: '🍊',
  },
  {
    name: 'Electrolytes (Sodium/Potassium/Magnesium)',
    dose: 'Per activity level (1000–2000mg sodium for athletes)',
    timing: 'During/after exercise; morning',
    evidence: 'A',
    evidence_summary: 'Essential for muscle contraction, hydration, and nerve function; performance degrades with even 2% fluid loss.',
    priority: 'Essential',
    for_goals: ['muscle', 'energy', 'heart'],
    contraindications: ['hypertension (monitor sodium)', 'kidney disease'],
    monthly_cost_usd: '$15–30',
    emoji: '💧',
  },
  {
    name: 'DHEA',
    dose: '25–50mg/day',
    timing: 'Morning with food',
    evidence: 'B',
    evidence_summary: 'DHEA declines ~2%/year after age 30; supplementation improves bone density, libido, and well-being in deficient adults.',
    priority: 'Experimental',
    for_goals: ['hormones', 'longevity', 'energy'],
    contraindications: ['hormone-sensitive cancers', 'PCOS', 'liver disease'],
    monthly_cost_usd: '$10–20',
    emoji: '🔬',
  },
  {
    name: 'Iodine',
    dose: '150–300mcg/day',
    timing: 'With food',
    evidence: 'A',
    evidence_summary: 'Iodine is essential for thyroid hormone synthesis; deficiency is the leading cause of preventable intellectual disability globally.',
    priority: 'Essential',
    for_goals: ['hormones', 'energy', 'brain'],
    contraindications: ['thyroid disorders (consult MD)', 'Hashimoto\'s'],
    monthly_cost_usd: '$5–10',
    emoji: '🦋',
  },
  {
    name: 'Selenium',
    dose: '55–200mcg/day',
    timing: 'With food',
    evidence: 'B',
    evidence_summary: 'Selenium is a cofactor for glutathione peroxidase; deficiency impairs thyroid function and immune response.',
    priority: 'Beneficial',
    for_goals: ['immunity', 'hormones', 'longevity'],
    contraindications: ['>400mcg/day is toxic (selenosis)'],
    monthly_cost_usd: '$5–10',
    emoji: '🛡️',
  },
  {
    name: 'Citrulline Malate',
    dose: '6–8g pre-workout',
    timing: '30–60 min before exercise',
    evidence: 'B',
    evidence_summary: 'Pérez-Guisado & Jakeman (J Strength Cond Res 2010): citrulline reduced muscle soreness 40% and increased rep count.',
    priority: 'Beneficial',
    for_goals: ['muscle', 'energy', 'heart'],
    contraindications: ['blood pressure medications (additive)'],
    monthly_cost_usd: '$12–20',
    emoji: '🏋️',
  },
  {
    name: 'Beta-Glucan',
    dose: '1–3g/day',
    timing: 'With meals',
    evidence: 'A',
    evidence_summary: 'Vetvicka & Vetvickova (Am J Immunol 2015): beta-glucan significantly enhanced innate immune responses across multiple trials.',
    priority: 'Beneficial',
    for_goals: ['immunity', 'gut', 'heart', 'weight'],
    contraindications: [],
    monthly_cost_usd: '$10–20',
    emoji: '🛡️',
  },
  {
    name: 'Chlorella / Spirulina',
    dose: '3–10g/day',
    timing: 'With meals',
    evidence: 'B',
    evidence_summary: 'Rich in bioavailable plant protein, iron, B12 analogs, and chlorophyll; supports detox and immune function.',
    priority: 'Beneficial',
    for_goals: ['immunity', 'energy', 'longevity', 'gut'],
    contraindications: ['autoimmune disease', 'phenylketonuria (phenylalanine content)'],
    monthly_cost_usd: '$15–25',
    interaction_notes: 'Vegans: spirulina B12 analogues do not reliably substitute for methylcobalamin — supplement separately.',
    emoji: '🌊',
  },
]

// ─── Medication interaction lookup ────────────────────────────────────────────

const MEDICATION_INTERACTIONS: Record<string, { supplement: string; reason: string }[]> = {
  warfarin: [
    { supplement: 'Omega-3 (EPA + DHA)', reason: 'Additive anticoagulant effect; increases bleeding risk at high doses.' },
    { supplement: 'Vitamin K2', reason: 'Vitamin K antagonises warfarin; alters INR unpredictably.' },
    { supplement: 'Curcumin (+ Piperine)', reason: 'Curcumin inhibits platelet aggregation; potentiates anticoagulation.' },
  ],
  metformin: [
    { supplement: 'Berberine', reason: 'Additive glucose-lowering; risk of hypoglycaemia.' },
    { supplement: 'Alpha-Lipoic Acid', reason: 'Additive insulin-sensitising effect; monitor blood glucose.' },
  ],
  ssri: [
    { supplement: 'Rhodiola Rosea', reason: 'Mild MAO inhibition; serotonin syndrome risk at high doses.' },
    { supplement: 'Ashwagandha KSM-66', reason: 'May potentiate sedative/CNS effects; use with caution.' },
  ],
  levothyroxine: [
    { supplement: 'Iodine', reason: 'Excess iodine can worsen thyroid disorders; consult prescriber.' },
    { supplement: 'Selenium', reason: 'Selenium affects thyroid hormone conversion; monitor TSH.' },
  ],
  statins: [
    { supplement: 'CoQ10 (Ubiquinol)', reason: 'Statins deplete CoQ10 — supplementation is often recommended, not contraindicated.' },
    { supplement: 'Berberine', reason: 'Berberine increases statin plasma levels via CYP3A4 inhibition; dose reduction may be needed.' },
  ],
}

// ─── Goal → supplement relevance weights ──────────────────────────────────────

function goalScore(rec: SupplementRecommendation, goals: HealthGoal[]): number {
  const matchCount = rec.for_goals.filter(g => goals.includes(g)).length
  return matchCount
}

// ─── Diet-specific adjustments ────────────────────────────────────────────────

function isDietRelevant(rec: SupplementRecommendation, diet: DietPattern): boolean {
  if (diet === 'vegan' || diet === 'vegetarian') {
    if (rec.name === 'Iron (Bisglycinate)') return true  // plant-iron less bioavailable
    if (rec.name === 'Vitamin B Complex') return true    // B12 deficiency risk
    if (rec.name === 'Omega-3 (EPA + DHA)') return true  // need algal oil
  }
  if (diet === 'keto' || diet === 'carnivore') {
    if (rec.name === 'Prebiotic Fiber (Inulin/FOS)') return true
    if (rec.name === 'Probiotics (Multi-strain)') return true
    if (rec.name === 'Electrolytes (Sodium/Potassium/Magnesium)') return true
  }
  return false
}

// ─── Main recommender ─────────────────────────────────────────────────────────

export function getRecommendations(
  goals: HealthGoal[],
  diet: DietPattern,
  current_supplements: string[],
  deficiencies?: string[],
  medications?: string[],
  age?: number,
  sex?: 'male' | 'female'
): RecommendedStack {
  const currentLower = current_supplements.map(s => s.toLowerCase())
  const deficiencyLower = (deficiencies ?? []).map(d => d.toLowerCase())
  const medicationLower = (medications ?? []).map(m => m.toLowerCase())

  // Build avoid list from medications
  const avoidList: { name: string; reason: string }[] = []
  for (const med of medicationLower) {
    const key = Object.keys(MEDICATION_INTERACTIONS).find(k => med.includes(k))
    if (key) {
      for (const item of MEDICATION_INTERACTIONS[key]) {
        if (!avoidList.find(a => a.name === item.supplement)) {
          avoidList.push({ name: item.supplement, reason: item.reason })
        }
      }
    }
  }
  const avoidNames = new Set(avoidList.map(a => a.name))

  const scored = SUPPLEMENT_RECOMMENDATIONS
    .filter(rec => !avoidNames.has(rec.name))
    .filter(rec => !currentLower.includes(rec.name.toLowerCase()))
    .map(rec => {
      let score = goalScore(rec, goals) * 10
      // Boost for known deficiencies
      for (const def of deficiencyLower) {
        if (rec.name.toLowerCase().includes(def) || def.includes(rec.name.toLowerCase().split(' ')[0])) {
          score += 20
        }
      }
      // Boost for diet-specific needs
      if (isDietRelevant(rec, diet)) score += 8
      // Age-specific boosts
      if (age && age > 40) {
        if (['CoQ10 (Ubiquinol)', 'NMN (Nicotinamide Mononucleotide)', 'Phosphatidylserine', 'DHEA'].includes(rec.name)) score += 5
      }
      // Sex-specific boosts
      if (sex === 'female' && ['Iron (Bisglycinate)', 'Collagen Peptides', 'Iodine'].includes(rec.name)) score += 5
      if (sex === 'male' && ['Zinc Picolinate', 'Ashwagandha KSM-66'].includes(rec.name)) score += 3
      return { rec, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)

  const essential: SupplementRecommendation[] = []
  const beneficial: SupplementRecommendation[] = []
  const experimental: SupplementRecommendation[] = []

  for (const { rec } of scored) {
    if (rec.priority === 'Essential') essential.push(rec)
    else if (rec.priority === 'Beneficial') beneficial.push(rec)
    else experimental.push(rec)
  }

  // Calculate total monthly cost (use midpoint of range)
  const allRecs = [...essential, ...beneficial, ...experimental]
  let totalLow = 0
  let totalHigh = 0
  for (const r of allRecs.slice(0, 12)) {
    const match = r.monthly_cost_usd.replace('$', '').split('–')
    totalLow += parseInt(match[0] ?? '0')
    totalHigh += parseInt(match[1] ?? match[0] ?? '0')
  }
  const total_monthly_cost = allRecs.length === 0 ? '$0' : `$${totalLow}–${totalHigh}`

  // Priority order: top 3 essentials
  const priority_order = essential.slice(0, 3).map(r => r.name)
  if (priority_order.length < 3 && beneficial.length > 0) {
    priority_order.push(...beneficial.slice(0, 3 - priority_order.length).map(r => r.name))
  }

  return { essential, beneficial, experimental, avoid: avoidList, total_monthly_cost, priority_order }
}

// ─── Stack scorer ─────────────────────────────────────────────────────────────

export function stackScore(stack: string[]): {
  coverage: number
  interaction_risk: 'Low' | 'Medium' | 'High'
  redundancies: string[]
  gaps: string[]
} {
  const allGoals: HealthGoal[] = ['muscle', 'sleep', 'stress', 'heart', 'brain', 'gut', 'energy', 'longevity', 'immunity', 'hormones', 'weight']
  const coveredGoals = new Set<HealthGoal>()
  const stackLower = stack.map(s => s.toLowerCase())

  for (const supp of SUPPLEMENT_RECOMMENDATIONS) {
    if (stackLower.some(s => s.includes(supp.name.toLowerCase().split(' ')[0]))) {
      supp.for_goals.forEach(g => coveredGoals.add(g))
    }
  }

  const coverage = Math.round((coveredGoals.size / allGoals.length) * 100)
  const gaps = allGoals.filter(g => !coveredGoals.has(g))

  // Detect redundancies (supplements sharing >2 goals)
  const redundancies: string[] = []
  for (let i = 0; i < SUPPLEMENT_RECOMMENDATIONS.length; i++) {
    for (let j = i + 1; j < SUPPLEMENT_RECOMMENDATIONS.length; j++) {
      const a = SUPPLEMENT_RECOMMENDATIONS[i]
      const b = SUPPLEMENT_RECOMMENDATIONS[j]
      const inStack = stackLower.some(s => s.includes(a.name.toLowerCase().split(' ')[0])) &&
        stackLower.some(s => s.includes(b.name.toLowerCase().split(' ')[0]))
      if (!inStack) continue
      const shared = a.for_goals.filter(g => b.for_goals.includes(g)).length
      if (shared >= 3) {
        redundancies.push(`${a.name} + ${b.name} (${shared} shared goals)`)
      }
    }
  }

  // Interaction risk based on stack size and known interactions
  let risk: 'Low' | 'Medium' | 'High' = 'Low'
  if (stack.length > 8) risk = 'Medium'
  if (stack.length > 14) risk = 'High'

  return { coverage, interaction_risk: risk, redundancies, gaps }
}
