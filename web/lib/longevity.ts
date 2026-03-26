// Longevity protocol utilities
// López-Otín 2023 Cell: 12 Hallmarks of Aging
// Sinclair 2019 Cell Metabolism: NAD+/mTOR/AMPK pathways
// Mandsager 2018 JAMA Network Open: VO2max + mortality
// Epel 2004 PNAS: telomere proxies

// VO2 max norms by age/sex (ACSM 2021 guidelines)
export interface VO2MaxNorm { poor: number; fair: number; good: number; excellent: number; superior: number }
export const VO2_MAX_NORMS: Record<string, Record<string, VO2MaxNorm>> = {
  male: {
    '20-29': { poor: 25, fair: 34, good: 42, excellent: 52, superior: 60 },
    '30-39': { poor: 23, fair: 32, good: 40, excellent: 49, superior: 57 },
    '40-49': { poor: 20, fair: 29, good: 36, excellent: 45, superior: 53 },
    '50-59': { poor: 18, fair: 25, good: 32, excellent: 40, superior: 47 },
    '60-69': { poor: 16, fair: 22, good: 29, excellent: 36, superior: 43 },
  },
  female: {
    '20-29': { poor: 20, fair: 28, good: 36, excellent: 45, superior: 53 },
    '30-39': { poor: 18, fair: 26, good: 33, excellent: 41, superior: 49 },
    '40-49': { poor: 16, fair: 23, good: 30, excellent: 38, superior: 46 },
    '50-59': { poor: 14, fair: 20, good: 27, excellent: 34, superior: 42 },
    '60-69': { poor: 12, fair: 18, good: 24, excellent: 31, superior: 38 },
  },
}

export function getAgeGroup(age: number): string {
  if (age < 30) return '20-29'
  if (age < 40) return '30-39'
  if (age < 50) return '40-49'
  if (age < 60) return '50-59'
  return '60-69'
}

export function cooperVO2Max(distanceMeters: number): number {
  return Math.round((distanceMeters - 504.9) / 44.73 * 10) / 10
}

export function nonExerciseVO2Max(age: number, sex: 'male' | 'female', bmi: number, exerciseRating: number): number {
  const base = sex === 'male' ? 56.363 : 44.868
  return Math.round((base + (1.921 * exerciseRating) - (0.381 * age) - (0.754 * bmi) + (sex === 'male' ? 10.987 : 0)) * 10) / 10
}

export function calculateFitnessAge(
  age: number, sex: 'male' | 'female',
  vo2max: number, rhr: number,
  weeklyExerciseHours: number, waistCircumferenceCm?: number
): number {
  let fitnessAge = age
  const ageGroup = getAgeGroup(age)
  const norms = VO2_MAX_NORMS[sex][ageGroup]
  if (vo2max >= norms.superior) fitnessAge -= 12
  else if (vo2max >= norms.excellent) fitnessAge -= 8
  else if (vo2max >= norms.good) fitnessAge -= 4
  else if (vo2max <= norms.poor) fitnessAge += 8
  else if (vo2max <= norms.fair) fitnessAge += 4
  if (rhr < 50) fitnessAge -= 4
  else if (rhr < 60) fitnessAge -= 2
  else if (rhr > 80) fitnessAge += 4
  else if (rhr > 70) fitnessAge += 2
  if (weeklyExerciseHours >= 7) fitnessAge -= 4
  else if (weeklyExerciseHours >= 4) fitnessAge -= 2
  else if (weeklyExerciseHours < 1) fitnessAge += 4
  if (waistCircumferenceCm) {
    const threshold = sex === 'male' ? 94 : 80
    if (waistCircumferenceCm > threshold + 10) fitnessAge += 4
    else if (waistCircumferenceCm > threshold) fitnessAge += 2
  }
  return Math.max(18, Math.round(fitnessAge))
}

// ============================================================
// 12 Hallmarks of Aging (López-Otín 2023 Cell)
// ============================================================

export interface HallmarkBehavior {
  behavior: string
  mechanism: string
}

export interface Hallmark {
  id: string
  name: string
  description: string
  pillar: string
  behaviors: HallmarkBehavior[]
}

export const HALLMARKS_OF_AGING: Hallmark[] = [
  {
    id: 'genomic-instability',
    name: 'Genomic Instability',
    description: 'Accumulation of DNA damage throughout life is a primary driver of aging',
    pillar: 'nutrition',
    behaviors: [
      { behavior: 'Sun protection (SPF 30+)', mechanism: 'Reduces UV-induced DNA double-strand breaks' },
      { behavior: 'Antioxidant-rich diet', mechanism: 'Neutralizes ROS causing oxidative DNA damage' },
      { behavior: 'Alcohol minimization', mechanism: 'Acetaldehyde is a direct DNA mutagen' },
    ],
  },
  {
    id: 'telomere-attrition',
    name: 'Telomere Attrition',
    description: 'Progressive telomere shortening is a key driver of replicative aging',
    pillar: 'sleep',
    behaviors: [
      { behavior: 'Stress reduction', mechanism: 'Chronic stress accelerates telomere shortening via cortisol (Epel 2004 PNAS)' },
      { behavior: 'Aerobic exercise ≥150 min/week', mechanism: 'Upregulates telomerase activity' },
      { behavior: 'Sleep 7–9 hours', mechanism: 'Sleep deprivation increases telomere attrition rate' },
    ],
  },
  {
    id: 'epigenetic-alterations',
    name: 'Epigenetic Alterations',
    description: 'Epigenetic drift alters gene expression patterns with aging',
    pillar: 'nutrition',
    behaviors: [
      { behavior: 'Mediterranean-style diet', mechanism: 'Polyphenols influence DNA methylation patterns' },
      { behavior: 'Time-restricted eating', mechanism: 'Fasting resets circadian epigenetic rhythms (Sinclair 2019)' },
      { behavior: 'Methyl-donor foods (leafy greens, eggs)', mechanism: 'Support healthy methylation via one-carbon metabolism' },
    ],
  },
  {
    id: 'proteostasis',
    name: 'Loss of Proteostasis',
    description: 'Failure of protein quality control leads to accumulation of misfolded proteins',
    pillar: 'fasting',
    behaviors: [
      { behavior: 'Intermittent fasting', mechanism: 'Activates proteasomal degradation of damaged proteins' },
      { behavior: 'Heat shock (sauna 4×/week)', mechanism: 'Induces HSPs to refold denatured proteins' },
      { behavior: 'Cold exposure', mechanism: 'Activates cold-shock proteins improving proteostasis' },
    ],
  },
  {
    id: 'autophagy',
    name: 'Disabled Macroautophagy',
    description: 'Impaired autophagy leads to accumulation of damaged cellular components',
    pillar: 'fasting',
    behaviors: [
      { behavior: 'Fasting 16+ hours', mechanism: 'Nutrient deprivation is the primary AMPK-mediated autophagy trigger' },
      { behavior: 'Zone 2 cardio', mechanism: 'Exercise activates AMPK-mediated autophagy' },
      { behavior: 'Spermidine (wheat germ, mushrooms)', mechanism: 'Potent autophagy inducer independent of caloric restriction' },
    ],
  },
  {
    id: 'nutrient-sensing',
    name: 'Deregulated Nutrient Sensing',
    description: 'Dysregulation of mTOR, AMPK, sirtuins accelerates aging',
    pillar: 'nutrition',
    behaviors: [
      { behavior: 'Caloric restriction (10–20%)', mechanism: 'Downregulates mTORC1, activates SIRT1/3 (Sinclair 2019)' },
      { behavior: 'Zone 2 exercise 150+ min/week', mechanism: 'Activates AMPK signaling pathway' },
      { behavior: 'NMN/NR supplementation', mechanism: 'NAD+ precursor activates sirtuin deacylases' },
    ],
  },
  {
    id: 'mitochondrial-dysfunction',
    name: 'Mitochondrial Dysfunction',
    description: 'Mitochondrial damage accumulates, reducing energy production and increasing ROS',
    pillar: 'exercise',
    behaviors: [
      { behavior: 'Endurance exercise (VO2max training)', mechanism: 'Stimulates mitochondrial biogenesis via PGC-1α' },
      { behavior: 'CoQ10 100–300 mg/day', mechanism: 'Essential cofactor in electron transport chain complex I/II/III' },
      { behavior: 'Cold exposure', mechanism: 'Activates brown adipose mitochondria via UCP1' },
    ],
  },
  {
    id: 'cellular-senescence',
    name: 'Cellular Senescence',
    description: 'Accumulation of senescent cells drives inflammation and tissue dysfunction',
    pillar: 'nutrition',
    behaviors: [
      { behavior: 'Anti-inflammatory diet', mechanism: 'Reduces SASP cytokine burden from senescent cells' },
      { behavior: 'Quercetin 500 mg (senolytic)', mechanism: 'Selectively eliminates senescent cells via Bcl-xL inhibition' },
      { behavior: 'Fasting', mechanism: 'Autophagy upregulates clearance of pre-senescent cells' },
    ],
  },
  {
    id: 'stem-cell-exhaustion',
    name: 'Stem Cell Exhaustion',
    description: 'Decline in stem cell activity impairs tissue regeneration',
    pillar: 'sleep',
    behaviors: [
      { behavior: 'Deep sleep 7–9 h', mechanism: 'GH secreted during slow-wave sleep activates muscle satellite cells' },
      { behavior: 'Resistance training', mechanism: 'Mechanical load activates muscle stem cells and IGF-1' },
      { behavior: 'Caloric restriction', mechanism: 'Preserves stem cell niche via mTOR inhibition' },
    ],
  },
  {
    id: 'intercellular-communication',
    name: 'Altered Intercellular Communication',
    description: 'Degraded signaling between cells drives chronic inflammatory paracrine loops',
    pillar: 'social',
    behaviors: [
      { behavior: 'Strong social connections', mechanism: 'Reduces pro-inflammatory cytokines IL-6, TNF-α' },
      { behavior: 'Oxytocin-generating activities', mechanism: 'Positive signaling molecules reduce systemic inflammaging' },
      { behavior: 'Sense of purpose (ikigai)', mechanism: 'Reduces allostatic load and downstream inflammatory signaling' },
    ],
  },
  {
    id: 'chronic-inflammation',
    name: 'Chronic Inflammation (Inflammaging)',
    description: 'Low-grade sterile inflammation is a hallmark and driver of most age-related diseases',
    pillar: 'nutrition',
    behaviors: [
      { behavior: 'Omega-3 fatty acids 2 g EPA+DHA/day', mechanism: 'Resolves inflammatory cascades via resolvins and protectins' },
      { behavior: 'Stress management (meditation)', mechanism: 'Lowers cortisol-driven NF-κB and inflammatory cytokines' },
      { behavior: 'Sleep 7–9 hours', mechanism: 'Sleep deprivation acutely increases CRP and IL-6' },
    ],
  },
  {
    id: 'dysbiosis',
    name: 'Dysbiosis',
    description: 'Gut microbiome imbalance drives systemic aging effects via the gut–immune axis',
    pillar: 'nutrition',
    behaviors: [
      { behavior: 'Dietary fiber 30 g+/day', mechanism: 'Feeds butyrate-producing Bifidobacterium and Faecalibacterium' },
      { behavior: 'Fermented foods daily', mechanism: 'Increases microbiome alpha-diversity (Sonnenburg 2021 Cell)' },
      { behavior: 'Probiotic supplementation', mechanism: 'Restores commensal bacterial populations post-dysbiosis' },
    ],
  },
]

// ============================================================
// LONGEVITY SCORE (Pillar-based)
// ============================================================

export interface PillarScores {
  sleep: number        // 0–100
  exercise: number     // 0–100
  nutrition: number    // 0–100
  fasting: number      // 0–100
  stress: number       // 0–100
  supplements: number  // 0–100
  social: number       // 0–100
  purpose: number      // 0–100
}

export interface LongevityScore {
  date: string
  pillar_scores: PillarScores
  overall_score: number
  epigenetic_age_proxy: number  // delta in years: negative = biologically younger
  blueprint_score: number
}

const PILLAR_WEIGHTS: Record<keyof PillarScores, number> = {
  sleep: 0.22,
  exercise: 0.25,
  nutrition: 0.18,
  fasting: 0.10,
  stress: 0.10,
  supplements: 0.05,
  social: 0.05,
  purpose: 0.05,
}

export function calculateLongevityScore(pillars: PillarScores): number {
  return Math.round(
    Object.entries(PILLAR_WEIGHTS).reduce(
      (sum, [key, weight]) => sum + (pillars[key as keyof PillarScores] ?? 0) * weight,
      0
    )
  )
}

// Estimate epigenetic age delta (proxy)
// Based on: Horvath 2013 clock proxies, Levine 2018 PhenoAge, Mandsager 2018 VO2max
// Returns delta in years: negative = younger than chronological, positive = older
export function estimateEpigeneticAge(
  chronological_age: number,
  vo2max: number | null,
  sleep_score: number,   // 0–100
  stress_score: number,  // 0–100
  bmi: number | null,
  diet_score: number     // 0–100
): number {
  void chronological_age
  let delta = 0

  // VO2max: strongest single predictor (Mandsager 2018 JAMA Netw Open)
  if (vo2max !== null) {
    if (vo2max >= 55) delta -= 8
    else if (vo2max >= 48) delta -= 5
    else if (vo2max >= 40) delta -= 2
    else if (vo2max >= 32) delta += 0
    else if (vo2max >= 24) delta += 3
    else delta += 6
  }

  // Sleep: 7–9 h optimal (Epel 2004 PNAS telomere data)
  delta += (50 - sleep_score) / 25   // −2 to +2 years

  // Chronic stress: cortisol-driven telomere shortening
  delta += (50 - stress_score) / 16.7  // −3 to +3 years

  // BMI: optimal 22–24
  if (bmi !== null) {
    if (bmi < 18.5 || bmi > 35) delta += 3
    else if (bmi > 30) delta += 2
    else if (bmi > 27) delta += 1
    else if (bmi >= 22 && bmi <= 24) delta -= 1
  }

  // Diet quality: Mediterranean / anti-inflammatory
  delta += (50 - diet_score) / 25  // −2 to +2 years

  return Math.round(delta * 10) / 10
}

// ============================================================
// LONGEVITY INTERVENTIONS (40+)
// ============================================================

export type EvidenceGrade = 'A' | 'B' | 'C' | 'D'

export interface LongevityIntervention {
  name: string
  category: string
  evidence_grade: EvidenceGrade
  mechanism: string
  dose: string
  citations: string[]
  hallmarks: string[]
}

export const LONGEVITY_INTERVENTIONS: LongevityIntervention[] = [
  // ── GRADE A ──────────────────────────────────────────────
  {
    name: 'Cardiorespiratory Exercise (VO2max)',
    category: 'Exercise',
    evidence_grade: 'A',
    mechanism: 'Mitochondrial biogenesis, AMPK activation, telomerase upregulation, BDNF increase, cardiac remodeling',
    dose: '150 min/week moderate + 75 min vigorous; dedicated VO2max intervals 2×/week',
    citations: ['Mandsager 2018 JAMA Netw Open', 'Fiuza-Luces 2013 Physiology', 'Rebelo-Marques 2018 Front Physiol'],
    hallmarks: ['mitochondrial-dysfunction', 'telomere-attrition', 'cellular-senescence'],
  },
  {
    name: 'Resistance Training',
    category: 'Exercise',
    evidence_grade: 'A',
    mechanism: 'Preserves muscle mass (anti-sarcopenia), activates stem cells, improves insulin sensitivity, mTOR anabolic signaling',
    dose: '2–3 sessions/week, all major muscle groups, progressive overload principle',
    citations: ['Peterson 2011 Am J Med', 'Beavers 2017 J Gerontol', 'Liu 2009 BMJ'],
    hallmarks: ['stem-cell-exhaustion', 'mitochondrial-dysfunction'],
  },
  {
    name: 'Sleep Optimization (7–9 hours)',
    category: 'Sleep',
    evidence_grade: 'A',
    mechanism: 'Glymphatic clearance of amyloid-β, GH secretion during SWS, cortisol rhythm, DNA repair, telomere maintenance',
    dose: '7–9 hours/night; consistent sleep/wake times; dark + cool (18–19°C) bedroom',
    citations: ['Walker 2017 Why We Sleep', 'Xie 2013 Science', 'Cappuccio 2010 Sleep'],
    hallmarks: ['telomere-attrition', 'chronic-inflammation', 'stem-cell-exhaustion'],
  },
  {
    name: 'Caloric Restriction (10–20%)',
    category: 'Nutrition',
    evidence_grade: 'A',
    mechanism: 'mTORC1 inhibition, SIRT1/3 activation, autophagy induction, reduced IGF-1, improved metabolic flexibility',
    dose: '10–20% below maintenance calories while preserving protein (≥1.6 g/kg)',
    citations: ['Fontana 2010 Nat Rev Mol Cell Biol', 'CALERIE 2022 Nat Aging', 'Sinclair 2019 Cell Metab'],
    hallmarks: ['nutrient-sensing', 'autophagy', 'cellular-senescence'],
  },
  {
    name: 'Time-Restricted Eating (16:8)',
    category: 'Fasting',
    evidence_grade: 'A',
    mechanism: 'Circadian clock entrainment, autophagy, metabolic flexibility, mTOR suppression, microbiome rhythm',
    dose: '16-hour fast, 8-hour eating window; stop eating ≥3 h before bed',
    citations: ['de Cabo 2019 NEJM', 'Wilkinson 2020 Cell Metab', 'Sutton 2018 Cell Metab'],
    hallmarks: ['nutrient-sensing', 'autophagy', 'epigenetic-alterations'],
  },
  {
    name: 'Mediterranean Diet',
    category: 'Nutrition',
    evidence_grade: 'A',
    mechanism: 'Anti-inflammatory polyphenols, antioxidants, microbiome support, reduced CVD/cancer incidence',
    dose: 'EVOO, fish 3×/week, legumes daily, colorful vegetables, minimal processed food',
    citations: ['Sofi 2010 BMJ', 'Martinez-Gonzalez 2019 Prog Mol Biol', 'Estruch 2018 NEJM'],
    hallmarks: ['chronic-inflammation', 'dysbiosis', 'genomic-instability'],
  },
  {
    name: 'Stress Reduction / Mindfulness',
    category: 'Stress',
    evidence_grade: 'A',
    mechanism: 'HPA axis regulation, telomerase preservation (Epel 2004), cortisol reduction, vagal tone increase',
    dose: '10–20 min/day meditation, yoga, or breathing exercises (4-7-8, box breathing, cyclic sighing)',
    citations: ['Epel 2004 PNAS', 'Jacobs 2011 Psychoneuroendocrinology', 'Carlson 2015 Cancer'],
    hallmarks: ['telomere-attrition', 'chronic-inflammation', 'intercellular-communication'],
  },
  {
    name: 'Zone 2 Cardio (Moderate Intensity Continuous)',
    category: 'Exercise',
    evidence_grade: 'A',
    mechanism: 'Mitochondrial biogenesis, fat oxidation, metabolic flexibility, AMPK activation, lactate clearance',
    dose: '3–4 hours/week at 60–70% HRmax (conversational pace); nasal breathing test',
    citations: ['Imai 2016 Cell Metab', 'Coggan 2000 J Appl Physiol', 'Holloszy 1971 Biochem Biophys Acta'],
    hallmarks: ['mitochondrial-dysfunction', 'nutrient-sensing'],
  },
  {
    name: 'Protein Adequacy (1.6–2.2 g/kg)',
    category: 'Nutrition',
    evidence_grade: 'A',
    mechanism: 'Prevents sarcopenia, preserves lean mass during CR, essential amino acids for anabolism',
    dose: '1.6–2.2 g/kg body weight/day; distribute 30–40 g per meal; leucine threshold ≥3 g/meal',
    citations: ['Morton 2018 Br J Sports Med', 'Wolfe 2017 J Gerontol', 'Stokes 2018 Nutrients'],
    hallmarks: ['stem-cell-exhaustion', 'proteostasis'],
  },
  // ── GRADE B ──────────────────────────────────────────────
  {
    name: 'NMN (Nicotinamide Mononucleotide)',
    category: 'Supplements',
    evidence_grade: 'B',
    mechanism: 'NAD+ precursor → sirtuin/PARP activation → DNA repair, mitochondrial function, circadian rhythm',
    dose: '250–500 mg/day in the morning; sublingual or liposomal for improved bioavailability',
    citations: ['Mills 2016 Cell Metab', 'Yoshino 2021 Science', 'Sinclair 2019 Cell Metab'],
    hallmarks: ['mitochondrial-dysfunction', 'genomic-instability', 'nutrient-sensing'],
  },
  {
    name: 'NR (Nicotinamide Riboside)',
    category: 'Supplements',
    evidence_grade: 'B',
    mechanism: 'Alternative NAD+ precursor; higher oral bioavailability vs NAD+; sirtuin activation',
    dose: '300–500 mg/day; stacking with pterostilbene or resveratrol may enhance efficacy',
    citations: ['Trammell 2016 Nat Commun', 'Airhart 2017 PLOS One', 'Elhassan 2019 Cell Rep'],
    hallmarks: ['mitochondrial-dysfunction', 'nutrient-sensing'],
  },
  {
    name: 'Resveratrol',
    category: 'Supplements',
    evidence_grade: 'B',
    mechanism: 'SIRT1 activator (xenohormesis), anti-inflammatory via NF-κB inhibition, mTOR modulation',
    dose: '250–500 mg/day trans-resveratrol with fat-containing meal for absorption',
    citations: ['Howitz 2003 Nature', 'Lagouge 2006 Cell', 'Turner 2011 J Nutr Sci Vitaminol'],
    hallmarks: ['nutrient-sensing', 'chronic-inflammation'],
  },
  {
    name: 'Metformin / AMPK Activation (Rx)',
    category: 'Pharmacological',
    evidence_grade: 'B',
    mechanism: 'AMPK activation, mTOR inhibition, glucose regulation, microbiome improvement via butyrate',
    dose: '500–2000 mg/day (prescription only); non-Rx: behavioral CR + exercise mimics AMPK activation',
    citations: ['TAME Trial 2022', 'Barzilai 2016 Cell Metab', 'Martin-Montalvo 2013 Nat Commun'],
    hallmarks: ['nutrient-sensing', 'chronic-inflammation', 'dysbiosis'],
  },
  {
    name: 'Rapamycin / mTOR Inhibitors',
    category: 'Pharmacological',
    evidence_grade: 'B',
    mechanism: 'mTORC1 inhibition extends lifespan in multiple model organisms by 9–26%',
    dose: 'Research context; intermittent low-dose (1–6 mg/week) under physician supervision only',
    citations: ['Harrison 2009 Nature', 'Mannick 2014 Sci Transl Med', 'Blagosklonny 2019 Oncotarget'],
    hallmarks: ['nutrient-sensing', 'autophagy', 'cellular-senescence'],
  },
  {
    name: 'Cold Water Immersion / Cold Shower',
    category: 'Hormesis',
    evidence_grade: 'B',
    mechanism: 'Cold-shock proteins, brown fat activation, norepinephrine surge (+300%), autophagy, mitochondria',
    dose: '2–3 min cold shower or 11–15 min/week cold water (10–15°C); morning timing preferred',
    citations: ['Søberg 2021 Cell Metab', 'Espeland 2022 Int J Environ Res', 'Bleakley 2012 Cochrane'],
    hallmarks: ['mitochondrial-dysfunction', 'proteostasis', 'cellular-senescence'],
  },
  {
    name: 'Sauna (Heat Shock Therapy)',
    category: 'Hormesis',
    evidence_grade: 'B',
    mechanism: 'HSP70/90 induction, GH surge (5–9×), cardiovascular conditioning, plasma volume expansion',
    dose: '4× per week, 20 min at 80–100°C; 2 rounds with cool-down per Laukkanen protocol',
    citations: ['Laukkanen 2018 JAMA Intern Med', 'Ignatowicz 2016 Folia Med Cracov', 'Laukkanen 2016 JAMA Intern Med'],
    hallmarks: ['proteostasis', 'mitochondrial-dysfunction'],
  },
  {
    name: 'Omega-3 Fatty Acids (EPA + DHA)',
    category: 'Supplements',
    evidence_grade: 'B',
    mechanism: 'Resolves inflammation via SPMs (resolvins/protectins), telomere length preservation, brain DHA',
    dose: '2–4 g EPA+DHA/day with food; triglyceride form preferred over ethyl ester',
    citations: ['Kiecolt-Glaser 2013 Brain Behav Immun', 'Farzaneh-Far 2010 JAMA', 'REDUCE-IT 2018 NEJM'],
    hallmarks: ['chronic-inflammation', 'telomere-attrition'],
  },
  {
    name: 'Vitamin D3 + K2',
    category: 'Supplements',
    evidence_grade: 'B',
    mechanism: 'Telomere maintenance, immune modulation (T-reg), calcium metabolism, cardiometabolic protection',
    dose: '2000–5000 IU D3/day + 100–200 mcg MK-7 K2; target serum 25(OH)D: 40–60 ng/mL',
    citations: ['Charoenngam 2020 Nutrients', 'Infante 2019 Nutrients', 'Holick 2011 NEJM'],
    hallmarks: ['telomere-attrition', 'chronic-inflammation', 'genomic-instability'],
  },
  {
    name: 'High-Intensity Interval Training (HIIT)',
    category: 'Exercise',
    evidence_grade: 'B',
    mechanism: 'Superior mitochondrial biogenesis vs MICT, VO2max improvement, time efficiency',
    dose: '2×/week; 4–6 rounds of 30 s maximal effort / 3–4 min recovery (Tabata or 4×4)',
    citations: ['Gibala 2006 J Physiol', 'Laursen 2002 Sports Med', 'Weston 2014 J Physiol'],
    hallmarks: ['mitochondrial-dysfunction', 'nutrient-sensing'],
  },
  {
    name: 'Dietary Fiber (30 g+/day)',
    category: 'Nutrition',
    evidence_grade: 'B',
    mechanism: 'Microbiome diversity, butyrate production (colonocyte fuel), reduced systemic inflammation, glycemic control',
    dose: 'Psyllium, legumes, vegetables, fruits; prebiotic fiber (inulin, FOS) especially beneficial',
    citations: ['Sonnenburg 2021 Cell', 'Koh 2016 Cell', 'Topping 2001 J Nutr'],
    hallmarks: ['dysbiosis', 'chronic-inflammation'],
  },
  {
    name: 'Magnesium (Glycinate / Threonate)',
    category: 'Supplements',
    evidence_grade: 'B',
    mechanism: 'DNA repair cofactor (>300 enzymes), sleep quality (threonate crosses BBB), NMDA modulation',
    dose: '300–400 mg elemental magnesium/day; threonate 1.5–2 g for cognitive benefit',
    citations: ['Barbagallo 2009 Arch Biochem Biophys', 'Slutsky 2010 Neuron', 'Zhang 2022 Nutrients'],
    hallmarks: ['genomic-instability'],
  },
  // ── GRADE C ──────────────────────────────────────────────
  {
    name: 'Quercetin + Dasatinib (Senolytic)',
    category: 'Senolytics',
    evidence_grade: 'C',
    mechanism: 'Selectively eliminates senescent cells via Bcl-2/Bcl-xL inhibition; reduces SASP',
    dose: 'Quercetin 1000 mg + Dasatinib 100 mg (Rx); intermittent pulse (2 days/month)',
    citations: ['Zhu 2015 Aging Cell', 'Justice 2019 EBioMedicine', 'Kirkland 2017 EBioMedicine'],
    hallmarks: ['cellular-senescence'],
  },
  {
    name: 'Spermidine',
    category: 'Supplements',
    evidence_grade: 'C',
    mechanism: 'Polyamine that robustly induces autophagy; extends lifespan in yeast, flies, worms, mice',
    dose: '1–2 mg/day from food (wheat germ ~5 mg/40 g, aged cheese, mushrooms) or supplement',
    citations: ['Eisenberg 2016 Nat Med', 'Madeo 2019 Science', 'Kiechl 2018 Am J Clin Nutr'],
    hallmarks: ['autophagy', 'cellular-senescence'],
  },
  {
    name: 'Lithium Microdose',
    category: 'Supplements',
    evidence_grade: 'C',
    mechanism: 'GSK-3β inhibition, neurogenesis, telomere preservation, neuroprotection vs dementia',
    dose: 'Microdose: 150–300 mcg/day (vs 900 mg+ therapeutic); naturally present in some water supplies',
    citations: ['Harari 2016 J Alzheimers Dis', 'Forlenza 2019 Bipolar Disord', 'Nunes 2013 Eur Neuropsychopharmacol'],
    hallmarks: ['telomere-attrition', 'intercellular-communication'],
  },
  {
    name: 'Fisetin (Senolytic Flavonoid)',
    category: 'Senolytics',
    evidence_grade: 'C',
    mechanism: 'Senolytic activity, reduces senescent cell burden; anti-neuroinflammatory properties',
    dose: '20 mg/kg body weight for 2 days/month (senolytic pulse); 100–500 mg/day (anti-inflammatory)',
    citations: ['Yousefzadeh 2018 EBioMedicine', 'Currais 2017 Aging Cell'],
    hallmarks: ['cellular-senescence', 'chronic-inflammation'],
  },
  {
    name: 'Astaxanthin',
    category: 'Supplements',
    evidence_grade: 'C',
    mechanism: 'Potent carotenoid antioxidant (6000× vitamin C), mitochondrial membrane protection, anti-inflammatory',
    dose: '8–12 mg/day with fat; natural Haematococcus pluvialis preferred over synthetic',
    citations: ['Ambati 2014 Marine Drugs', 'Park 2010 Nutr Metab Cardiovasc Dis'],
    hallmarks: ['mitochondrial-dysfunction', 'genomic-instability'],
  },
  {
    name: 'Alpha-Lipoic Acid (R-ALA)',
    category: 'Supplements',
    evidence_grade: 'C',
    mechanism: 'Mitochondrial antioxidant, glucose transporter upregulation, glutathione recycler, AMPK activation',
    dose: '300–600 mg/day R-ALA form; take on empty stomach 30 min before meals',
    citations: ['Packer 1997 Free Radic Biol Med', 'Yadav 2014 J Diet Suppl'],
    hallmarks: ['mitochondrial-dysfunction', 'nutrient-sensing'],
  },
  {
    name: 'Berberine',
    category: 'Supplements',
    evidence_grade: 'C',
    mechanism: 'AMPK activator, glucose/lipid regulation, microbiome modulation; "natural metformin" profile',
    dose: '500 mg 2–3×/day with meals; cycle 8 weeks on / 4 weeks off to avoid tolerance',
    citations: ['Yin 2008 Metabolism', 'Zhang 2008 J Clin Endocrinol Metab'],
    hallmarks: ['nutrient-sensing', 'chronic-inflammation'],
  },
  {
    name: 'Pterostilbene',
    category: 'Supplements',
    evidence_grade: 'C',
    mechanism: 'Resveratrol analog with 4× higher oral bioavailability; SIRT1 activation, antioxidant',
    dose: '50–250 mg/day; synergistic with NMN/NR stacks',
    citations: ['Paul 2010 Mol Nutr Food Res', 'Bhatt 2012 J Agric Food Chem'],
    hallmarks: ['nutrient-sensing', 'genomic-instability'],
  },
  {
    name: 'Ashwagandha (KSM-66)',
    category: 'Adaptogens',
    evidence_grade: 'C',
    mechanism: 'Cortisol reduction (−28%), thyroid support, testosterone preservation, anti-inflammatory withanolides',
    dose: '600 mg KSM-66/day with meals; 8–12 week cycles with 4-week break',
    citations: ['Chandrasekhar 2012 Indian J Psychol Med', 'Wankhede 2015 J Int Soc Sports Nutr'],
    hallmarks: ['chronic-inflammation', 'intercellular-communication'],
  },
  {
    name: 'EGCG (Green Tea Extract)',
    category: 'Supplements',
    evidence_grade: 'C',
    mechanism: 'AMPK activation, autophagy induction, anti-inflammatory via NF-κB, DNA oxidation protection',
    dose: '400–800 mg EGCG/day (or 4–6 cups green tea); between meals to avoid iron chelation',
    citations: ['Hursel 2009 Obes Rev', 'Bose 2008 Obesity', 'Khan 2006 J Nutr'],
    hallmarks: ['autophagy', 'genomic-instability'],
  },
  {
    name: 'Prolonged Fasting (5:2 / 3-Day)',
    category: 'Fasting',
    evidence_grade: 'C',
    mechanism: 'Deep autophagy, stem cell regeneration (3-day fast), IGF-1 reset, metabolic reprogramming',
    dose: '5:2: 500–600 kcal 2 non-consecutive days/week; 3-day fast quarterly under medical supervision',
    citations: ['Longo 2015 Cell Metab', 'Cheng 2014 Cell Stem Cell', 'Mattson 2018 Cell Metab'],
    hallmarks: ['autophagy', 'stem-cell-exhaustion', 'nutrient-sensing'],
  },
  {
    name: 'Creatine Monohydrate',
    category: 'Supplements',
    evidence_grade: 'C',
    mechanism: 'ATP resynthesis, muscle mass preservation, cognitive benefit, homocysteine reduction',
    dose: '3–5 g/day; no loading phase required; post-workout timing marginally optimal',
    citations: ['Rawson 2011 Sports Med', 'Rae 2003 Proc R Soc Lond', 'Brose 2003 J Gerontol'],
    hallmarks: ['mitochondrial-dysfunction', 'stem-cell-exhaustion'],
  },
  {
    name: 'Fermented Foods',
    category: 'Nutrition',
    evidence_grade: 'C',
    mechanism: 'Microbiome diversity increase, immunomodulation, reduced inflammatory markers (72 immune proteins)',
    dose: 'Daily: yogurt, kefir, kimchi, sauerkraut, miso; Wastyk 2021: 6 servings/day vs high-fiber group',
    citations: ['Wastyk 2021 Cell', 'Sonnenburg 2021 Cell', 'Hill 2014 Nat Rev Microbiol'],
    hallmarks: ['dysbiosis', 'chronic-inflammation'],
  },
  {
    name: 'Taurine',
    category: 'Supplements',
    evidence_grade: 'C',
    mechanism: 'Taurine declines with age; Singh 2023 Science: restoration extends lifespan in mice/worms',
    dose: '2–4 g/day; Singh 2023 showed supplementation restores youthful signaling profiles',
    citations: ['Singh 2023 Science', 'Ripps 2012 Mol Vis'],
    hallmarks: ['mitochondrial-dysfunction', 'chronic-inflammation'],
  },
  {
    name: 'Social Connection & Purpose',
    category: 'Social',
    evidence_grade: 'C',
    mechanism: 'Oxytocin release, reduced allostatic load, lower inflammatory cytokines, telomere maintenance',
    dose: 'Daily meaningful interaction; weekly community engagement; cultivate ikigai / purpose',
    citations: ['Holt-Lunstad 2015 Perspect Psychol Sci', 'Boyle 2009 Arch Gen Psychiatry'],
    hallmarks: ['intercellular-communication', 'chronic-inflammation'],
  },
  {
    name: 'Red / NIR Photobiomodulation',
    category: 'Hormesis',
    evidence_grade: 'C',
    mechanism: 'Cytochrome c oxidase stimulation → mitochondrial ATP, reduced ROS, anti-inflammatory',
    dose: '10–20 min, 3×/week; wavelengths 630–670 nm (red) and 810–850 nm (NIR)',
    citations: ['Hamblin 2016 FEBS J', 'Mead 2008 Prog Biophys Mol Biol'],
    hallmarks: ['mitochondrial-dysfunction', 'chronic-inflammation'],
  },
  {
    name: 'CoQ10 / Ubiquinol',
    category: 'Supplements',
    evidence_grade: 'C',
    mechanism: 'Electron transport chain cofactor (Complex I–III); declines with age and with statin use',
    dose: '100–300 mg/day ubiquinol form (reduced) with fat; essential if on statins',
    citations: ['Rosenfeldt 2007 J Card Surg', 'Langsjoen 2008 Biofactors'],
    hallmarks: ['mitochondrial-dysfunction'],
  },
  // ── GRADE D ──────────────────────────────────────────────
  {
    name: 'Young Plasma Transfusion (Parabiosis)',
    category: 'Experimental',
    evidence_grade: 'D',
    mechanism: 'Circulating young blood factors (GDF11, TIMP2) may rejuvenate aging tissues via systemic signaling',
    dose: 'Experimental only; Alkahest, Elevian clinical trials ongoing; not recommended outside research',
    citations: ['Conboy 2005 Nature', 'Loffredo 2013 Cell', 'Horowitz 2020 Nature'],
    hallmarks: ['intercellular-communication', 'stem-cell-exhaustion'],
  },
  {
    name: 'Therapeutic Plasma Exchange (TPE)',
    category: 'Experimental',
    evidence_grade: 'D',
    mechanism: 'Conboy 2020: dilution of pro-aging plasma factors shows rejuvenation equivalent to young blood',
    dose: '1–2 exchanges in clinical setting only; replaces plasma with albumin solution',
    citations: ['Conboy 2020 Aging', 'Mehdipour 2020 GeroScience'],
    hallmarks: ['intercellular-communication', 'chronic-inflammation'],
  },
  {
    name: 'Partial Epigenetic Reprogramming',
    category: 'Experimental',
    evidence_grade: 'D',
    mechanism: 'OSK Yamanaka factors reset epigenetic clocks in animal models; restores youthful gene expression',
    dose: 'Pre-clinical; Altos Labs, Turn Biotechnologies, Life Biosciences in development; not available',
    citations: ['Ocampo 2016 Cell', 'Lu 2020 Nature', 'Sinclair 2020 Aging'],
    hallmarks: ['epigenetic-alterations', 'genomic-instability'],
  },
  {
    name: 'CAR-T Senolytic Therapy',
    category: 'Experimental',
    evidence_grade: 'D',
    mechanism: 'Engineered T-cells targeting uPAR surface marker on senescent cells; Amor 2020 mouse data',
    dose: 'Pre-clinical only; Amor 2020 Nature demonstrated metabolic + physical fitness improvements in mice',
    citations: ['Amor 2020 Nature'],
    hallmarks: ['cellular-senescence'],
  },
  {
    name: 'GLP-1 / Semaglutide',
    category: 'Pharmacological',
    evidence_grade: 'D',
    mechanism: 'Beyond weight loss: anti-inflammatory, cardiometabolic, neuroprotection; SELECT 2023 showed −20% MACE',
    dose: '0.25–2.4 mg/week subcutaneous (Rx only); longevity-specific benefit under active investigation',
    citations: ['SELECT 2023 NEJM', 'Nauck 2021 Cell Metab'],
    hallmarks: ['nutrient-sensing', 'chronic-inflammation'],
  },
  {
    name: 'Hyperbaric Oxygen Therapy (HBOT)',
    category: 'Experimental',
    evidence_grade: 'D',
    mechanism: 'Shalev 2020: 60 sessions → telomere length +20%, senescent cells −37%; needs large RCT replication',
    dose: '60 sessions × 90 min at 2 ATA; daily 5×/week; results are preliminary',
    citations: ['Shalev 2020 Aging', 'Efrati 2021 Int J Mol Sci'],
    hallmarks: ['telomere-attrition', 'cellular-senescence'],
  },
]

// ============================================================
// BRYAN JOHNSON BLUEPRINT CHECKLIST
// ============================================================

export interface BlueprintItem {
  id: string
  label: string
  category: string
  frequency: 'daily' | 'weekly' | 'monthly'
  description: string
}

export const BLUEPRINT_CHECKLIST: BlueprintItem[] = [
  { id: 'bp-wake', label: 'Wake at consistent time', category: 'Sleep', frequency: 'daily', description: 'Same wake time every day (5:30 am in Blueprint); anchors circadian rhythm' },
  { id: 'bp-sunlight', label: 'Morning sunlight (10 min)', category: 'Circadian', frequency: 'daily', description: 'Within 30 min of wake; suppresses residual melatonin, sets cortisol awakening response' },
  { id: 'bp-no-caffeine', label: 'No caffeine after noon', category: 'Sleep', frequency: 'daily', description: 'Caffeine half-life 5–7 h; evening intake degrades deep sleep architecture by 20%' },
  { id: 'bp-tre', label: 'Time-restricted eating (16:8)', category: 'Fasting', frequency: 'daily', description: 'First meal: 11 am–12 pm; last meal: 7 pm; no food in last 3 h before sleep' },
  { id: 'bp-veggies', label: 'Dark leafy greens (300 g)', category: 'Nutrition', frequency: 'daily', description: 'Kale, spinach, chard; dietary nitrates improve endothelial function; methyl donors' },
  { id: 'bp-olive-oil', label: 'Extra virgin olive oil (30 ml)', category: 'Nutrition', frequency: 'daily', description: 'Oleocanthal: COX-1/2 inhibitor (equivalent to ibuprofen); polyphenols preserve telomeres' },
  { id: 'bp-steps', label: '10,000+ steps', category: 'Movement', frequency: 'daily', description: 'NEAT (non-exercise activity thermogenesis); independent all-cause mortality predictor' },
  { id: 'bp-workout', label: 'Structured workout (1 hour)', category: 'Exercise', frequency: 'daily', description: 'Blueprint: 1 h/day, 7 days/week; combination zone 2 cardio + resistance training' },
  { id: 'bp-sleep', label: 'Sleep 8+ hours in bed', category: 'Sleep', frequency: 'daily', description: 'Blueprint prioritizes sleep above all; tracks with Eight Sleep for temperature regulation' },
  { id: 'bp-nmn', label: 'NMN/NR supplement', category: 'Supplements', frequency: 'daily', description: '500 mg NMN or equivalent NR; take in the morning with first meal' },
  { id: 'bp-vitamin-d', label: 'Vitamin D3 + K2', category: 'Supplements', frequency: 'daily', description: '2000–5000 IU D3 + 100 mcg MK-7 K2; bone, immune, telomere protection' },
  { id: 'bp-omega3', label: 'Omega-3 (EPA+DHA ≥2 g)', category: 'Supplements', frequency: 'daily', description: 'High-quality fish oil triglyceride form; reduces inflammaging, preserves telomeres' },
  { id: 'bp-alcohol-free', label: 'Alcohol-free day', category: 'Nutrition', frequency: 'daily', description: 'Blueprint: zero alcohol; acetaldehyde is a Group 1 IARC carcinogen and sleep disruptor' },
  { id: 'bp-meditation', label: 'Meditation / HRV training', category: 'Stress', frequency: 'daily', description: '10–20 min daily; increases vagal tone, reduces cortisol, preserves telomeres (Epel 2004)' },
  { id: 'bp-cold', label: 'Cold exposure (2–3 min)', category: 'Hormesis', frequency: 'daily', description: 'Cold shower or ice bath; +300% norepinephrine surge, brown fat activation, autophagy' },
  { id: 'bp-zone2', label: 'Zone 2 cardio (45 min)', category: 'Exercise', frequency: 'weekly', description: '3–4× per week at 60–70% HRmax; mitochondrial biogenesis foundation' },
  { id: 'bp-strength', label: 'Progressive strength training', category: 'Exercise', frequency: 'weekly', description: '3× per week; tracks all lifts with progressive overload; Blueprint uses 3–4 day PPL split' },
  { id: 'bp-sauna', label: 'Sauna 4×/week (20 min)', category: 'Hormesis', frequency: 'weekly', description: 'Finnish sauna 80–100°C; induces HSP70, cardiovascular conditioning, GH surge 5–9×' },
  { id: 'bp-vo2max', label: 'VO2max interval session', category: 'Exercise', frequency: 'weekly', description: '1× per week; 4–6 × 4 min at 90%+ HRmax (Norwegian 4×4 protocol)' },
  { id: 'bp-labs', label: 'Biomarker tracking', category: 'Monitoring', frequency: 'monthly', description: 'Blueprint tests 50+ biomarkers quarterly: lipids, HbA1c, CRP, CBC, hormones, epigenetic clock' },
]

export function calculateBlueprintScore(completedIds: string[]): number {
  const completed = new Set(completedIds)
  const daily = BLUEPRINT_CHECKLIST.filter(i => i.frequency === 'daily')
  const weekly = BLUEPRINT_CHECKLIST.filter(i => i.frequency === 'weekly')
  const monthly = BLUEPRINT_CHECKLIST.filter(i => i.frequency === 'monthly')
  const dailyScore = daily.filter(i => completed.has(i.id)).length / daily.length
  const weeklyScore = weekly.filter(i => completed.has(i.id)).length / weekly.length
  const monthlyScore = monthly.filter(i => completed.has(i.id)).length / monthly.length
  return Math.round((dailyScore * 0.6 + weeklyScore * 0.3 + monthlyScore * 0.1) * 100)
}

// Projected healthspan gain (years) based on intervention adherence
export function projectedHealthspanGain(overallScore: number): { conservative: number; optimistic: number } {
  // Based on CALERIE, Blue Zones meta-analyses, and composite intervention data
  // Full adherence (score 100) → estimated 14–25 years of additional healthy lifespan vs sedentary baseline
  const conservative = Math.round(overallScore / 100 * 14 * 10) / 10
  const optimistic = Math.round(overallScore / 100 * 25 * 10) / 10
  return { conservative, optimistic }
}

// Legacy interface kept for backward compatibility with existing longevity page
export interface LongevityInputs {
  vo2max?: number; vo2maxAge?: number; vo2maxSex?: 'male' | 'female'
  restingHR?: number
  sleepHoursAvg?: number
  dailyStepsAvg?: number
  bmi?: number
  hrv?: number
  canBalanceOneLeg10s?: boolean
  srtScore?: number
}

export function calculateVitalityScore(inputs: LongevityInputs): { score: number; breakdown: Record<string, number>; grade: string } {
  const breakdown: Record<string, number> = {}
  if (inputs.vo2max && inputs.vo2maxAge && inputs.vo2maxSex) {
    const ageGroup = getAgeGroup(inputs.vo2maxAge)
    const norms = VO2_MAX_NORMS[inputs.vo2maxSex][ageGroup]
    if (inputs.vo2max >= norms.superior) breakdown.vo2max = 30
    else if (inputs.vo2max >= norms.excellent) breakdown.vo2max = 24
    else if (inputs.vo2max >= norms.good) breakdown.vo2max = 18
    else if (inputs.vo2max >= norms.fair) breakdown.vo2max = 10
    else breakdown.vo2max = 4
  }
  if (inputs.restingHR) {
    if (inputs.restingHR < 50) breakdown.rhr = 15
    else if (inputs.restingHR < 60) breakdown.rhr = 12
    else if (inputs.restingHR < 70) breakdown.rhr = 8
    else if (inputs.restingHR < 80) breakdown.rhr = 5
    else breakdown.rhr = 2
  }
  if (inputs.sleepHoursAvg) {
    if (inputs.sleepHoursAvg >= 7 && inputs.sleepHoursAvg <= 9) breakdown.sleep = 15
    else if (inputs.sleepHoursAvg >= 6 && inputs.sleepHoursAvg <= 9.5) breakdown.sleep = 10
    else breakdown.sleep = 4
  }
  if (inputs.dailyStepsAvg) {
    if (inputs.dailyStepsAvg >= 10000) breakdown.steps = 15
    else if (inputs.dailyStepsAvg >= 7500) breakdown.steps = 11
    else if (inputs.dailyStepsAvg >= 5000) breakdown.steps = 7
    else breakdown.steps = 3
  }
  if (inputs.bmi) {
    if (inputs.bmi >= 18.5 && inputs.bmi < 25) breakdown.bmi = 10
    else if (inputs.bmi < 27) breakdown.bmi = 7
    else if (inputs.bmi < 30) breakdown.bmi = 4
    else breakdown.bmi = 1
  }
  if (inputs.hrv) {
    if (inputs.hrv >= 60) breakdown.hrv = 10
    else if (inputs.hrv >= 40) breakdown.hrv = 7
    else if (inputs.hrv >= 20) breakdown.hrv = 4
    else breakdown.hrv = 2
  }
  if (inputs.canBalanceOneLeg10s !== undefined) {
    breakdown.functional = inputs.canBalanceOneLeg10s ? 3 : 0
  }
  if (inputs.srtScore !== undefined) {
    breakdown.functional = (breakdown.functional ?? 0) + Math.round(inputs.srtScore / 10 * 2)
  }
  const score = Math.min(100, Object.values(breakdown).reduce((a, b) => a + b, 0))
  const grade = score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : score >= 50 ? 'Average' : score >= 35 ? 'Below Average' : 'Poor'
  return { score, breakdown, grade }
}
