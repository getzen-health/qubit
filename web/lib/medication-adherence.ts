/**
 * Medication Adherence Library
 *
 * Research basis:
 * - Osterberg & Blaschke 2005 (NEJM): Non-adherence causes ~125,000 deaths/year in US
 * - Seden et al. 2010 (Br J Clin Pharmacol): 85+ drugs affected by grapefruit (CYP3A4)
 * - WHO 2003: 5-dimension framework for adherence (patient, socioeconomic, therapy, condition, system)
 * - MAPEC trial 2010: Bedtime ACE inhibitors reduce cardiovascular events vs. morning dosing
 * - Scheen 2005: Chronopharmacology — timing affects bioavailability and efficacy
 */

// ─── Core interfaces ──────────────────────────────────────────────────────────

export type MedicationFrequency =
  | 'once_daily'
  | 'twice_daily'
  | 'three_daily'
  | 'four_daily'
  | 'weekly'
  | 'as_needed'

export interface MedicationEntry {
  id: string
  name: string
  dose?: number
  unit?: string
  frequency: MedicationFrequency
  times_of_day: string[]      // e.g. ["08:00", "20:00"]
  with_food: boolean
  start_date: string          // ISO date
  end_date?: string
  prescribing_doctor?: string
  indication?: string
  notes?: string
  is_active?: boolean
  created_at?: string
}

export interface MedicationLog {
  id?: string
  medication_id: string
  scheduled_time: string      // ISO timestamp
  taken_at: string | null     // null = missed
  skipped?: boolean
  notes?: string
}

// ─── Drug-food interactions ───────────────────────────────────────────────────

export type InteractionSeverity = 'major' | 'moderate' | 'minor'

export interface DrugFoodInteraction {
  drug_pattern: string          // Case-insensitive name fragment to match
  food: string
  severity: InteractionSeverity
  mechanism: string
  recommendation: string
}

export const DRUG_FOOD_INTERACTIONS: DrugFoodInteraction[] = [
  // ── Grapefruit / CYP3A4 inhibition ──────────────────────────────────────
  {
    drug_pattern: 'simvastatin|lovastatin|atorvastatin',
    food: 'Grapefruit / grapefruit juice',
    severity: 'major',
    mechanism: 'Grapefruit furanocoumarins irreversibly inhibit CYP3A4 in the gut wall, dramatically increasing statin plasma levels and myopathy risk.',
    recommendation: 'Avoid grapefruit and grapefruit juice entirely while taking affected statins.',
  },
  {
    drug_pattern: 'amlodipine|felodipine|nifedipine|verapamil|diltiazem',
    food: 'Grapefruit / grapefruit juice',
    severity: 'major',
    mechanism: 'CYP3A4 inhibition increases calcium channel blocker bioavailability, causing excessive BP reduction and reflex tachycardia.',
    recommendation: 'Avoid grapefruit. Switch to orange juice if a citrus drink is desired.',
  },
  {
    drug_pattern: 'cyclosporine|tacrolimus|sirolimus',
    food: 'Grapefruit / grapefruit juice',
    severity: 'major',
    mechanism: 'CYP3A4 inhibition raises immunosuppressant levels, increasing nephrotoxicity and infection risk.',
    recommendation: 'Strictly avoid all grapefruit products. Drug level monitoring is essential.',
  },
  {
    drug_pattern: 'buspirone|triazolam|midazolam',
    food: 'Grapefruit / grapefruit juice',
    severity: 'moderate',
    mechanism: 'CYP3A4 inhibition increases CNS drug levels, heightening sedation.',
    recommendation: 'Avoid grapefruit on the day of dosing.',
  },

  // ── Vitamin K + warfarin ─────────────────────────────────────────────────
  {
    drug_pattern: 'warfarin',
    food: 'Vitamin K–rich foods (kale, spinach, broccoli, Brussels sprouts)',
    severity: 'major',
    mechanism: 'Dietary vitamin K provides substrate for coagulation factor synthesis, directly opposing warfarin\'s anticoagulant effect and lowering INR.',
    recommendation: 'Do not eliminate vitamin K foods; maintain consistent daily intake. Monitor INR closely if diet changes.',
  },

  // ── Calcium / thyroid ────────────────────────────────────────────────────
  {
    drug_pattern: 'levothyroxine|synthroid|liothyronine',
    food: 'Calcium-rich foods (dairy, fortified foods), calcium supplements',
    severity: 'moderate',
    mechanism: 'Calcium binds levothyroxine in the gut, reducing absorption by up to 40%.',
    recommendation: 'Take levothyroxine 30–60 min before breakfast on an empty stomach. Separate calcium by ≥4 hours.',
  },
  {
    drug_pattern: 'levothyroxine|synthroid|liothyronine',
    food: 'Coffee / espresso',
    severity: 'moderate',
    mechanism: 'Coffee decreases levothyroxine absorption, reducing free T4 levels.',
    recommendation: 'Wait at least 30–60 minutes after taking levothyroxine before drinking coffee.',
  },

  // ── Fluoroquinolones + dairy / antacids ──────────────────────────────────
  {
    drug_pattern: 'ciprofloxacin|levofloxacin|moxifloxacin|norfloxacin',
    food: 'Dairy products (milk, yogurt, cheese), calcium-fortified juices',
    severity: 'moderate',
    mechanism: 'Divalent cations (Ca²⁺, Mg²⁺) chelate fluoroquinolones in the gut, reducing antibiotic bioavailability by up to 50%.',
    recommendation: 'Take fluoroquinolones 2 hours before or 6 hours after dairy or antacids.',
  },

  // ── MAOIs + tyramine ─────────────────────────────────────────────────────
  {
    drug_pattern: 'phenelzine|tranylcypromine|isocarboxazid|selegiline|rasagiline',
    food: 'Tyramine-rich foods (aged cheese, cured meats, fermented products, red wine, tap beer)',
    severity: 'major',
    mechanism: 'MAO-A inhibition prevents tyramine metabolism. Accumulated tyramine triggers massive norepinephrine release, causing hypertensive crisis (BP >180/120 mmHg).',
    recommendation: 'Strictly avoid all tyramine-rich foods. Hypertensive crisis can be life-threatening. Continue diet for 2 weeks after stopping MAOI.',
  },

  // ── Tetracyclines + iron / calcium ───────────────────────────────────────
  {
    drug_pattern: 'tetracycline|doxycycline|minocycline',
    food: 'Iron supplements, dairy, antacids',
    severity: 'moderate',
    mechanism: 'Iron and calcium ions chelate tetracycline molecules, reducing GI absorption by up to 80%.',
    recommendation: 'Take tetracyclines on an empty stomach, or at least 2 hours before / 3 hours after iron or dairy.',
  },

  // ── Metronidazole / tinidazole + alcohol ─────────────────────────────────
  {
    drug_pattern: 'metronidazole|tinidazole',
    food: 'Alcohol (beer, wine, spirits)',
    severity: 'major',
    mechanism: 'Inhibition of aldehyde dehydrogenase causes acetaldehyde accumulation — disulfiram-like reaction (flushing, nausea, vomiting, hypotension).',
    recommendation: 'Strictly avoid alcohol during treatment and for 48–72 hours after the last dose.',
  },

  // ── Alcohol + benzodiazepines ────────────────────────────────────────────
  {
    drug_pattern: 'diazepam|lorazepam|alprazolam|clonazepam|temazepam|oxazepam',
    food: 'Alcohol',
    severity: 'major',
    mechanism: 'Additive CNS depression via GABA-A receptor potentiation. Risk of respiratory depression, loss of consciousness.',
    recommendation: 'Avoid alcohol entirely while taking benzodiazepines.',
  },

  // ── Alcohol + opioids ────────────────────────────────────────────────────
  {
    drug_pattern: 'codeine|oxycodone|hydrocodone|morphine|tramadol|fentanyl',
    food: 'Alcohol',
    severity: 'major',
    mechanism: 'Synergistic CNS and respiratory depression. Fatal combination even at therapeutic opioid doses.',
    recommendation: 'Strictly avoid alcohol with any opioid medication.',
  },

  // ── Alcohol + acetaminophen / paracetamol ────────────────────────────────
  {
    drug_pattern: 'acetaminophen|paracetamol|tylenol',
    food: 'Alcohol (>3 drinks/day)',
    severity: 'moderate',
    mechanism: 'Alcohol induces CYP2E1, increasing toxic NAPQI metabolite production; depletes glutathione, raising hepatotoxicity risk.',
    recommendation: 'Limit or avoid alcohol. Do not exceed 2 g/day of acetaminophen in regular drinkers.',
  },

  // ── St John's Wort + CYP3A4 substrates ──────────────────────────────────
  {
    drug_pattern: 'oral contraceptive|ethinylestradiol|desogestrel|norethindrone',
    food: 'St. John\'s Wort (herbal supplement)',
    severity: 'major',
    mechanism: 'Hyperforin activates pregnane X receptor, strongly inducing CYP3A4 and P-glycoprotein, reducing hormonal contraceptive plasma levels.',
    recommendation: 'Do not combine. Use additional non-hormonal contraception and inform your physician.',
  },
  {
    drug_pattern: 'sertraline|fluoxetine|paroxetine|citalopram|escitalopram',
    food: 'St. John\'s Wort (herbal supplement)',
    severity: 'major',
    mechanism: 'Dual serotonin reuptake inhibition plus MAO-A inhibition by St. John\'s Wort may cause serotonin syndrome.',
    recommendation: 'Do not combine SSRIs with St. John\'s Wort. Consult prescriber before starting any herbal supplement.',
  },
  {
    drug_pattern: 'cyclosporine|tacrolimus|warfarin|digoxin|indinavir',
    food: 'St. John\'s Wort (herbal supplement)',
    severity: 'major',
    mechanism: 'CYP3A4 and P-gp induction dramatically lowers drug plasma levels, risking treatment failure.',
    recommendation: 'Avoid St. John\'s Wort with narrow-therapeutic-index drugs.',
  },

  // ── Bisphosphonates + food ───────────────────────────────────────────────
  {
    drug_pattern: 'alendronate|risedronate|ibandronate|zoledronate',
    food: 'Any food, coffee, mineral water',
    severity: 'moderate',
    mechanism: 'Food reduces bisphosphonate bioavailability by >90% via chelation and altered gastric pH.',
    recommendation: 'Take with plain water 30 min before any food or drink. Remain upright for 30 minutes after dose.',
  },

  // ── Statins + high-fat meals ─────────────────────────────────────────────
  {
    drug_pattern: 'rosuvastatin|pravastatin|fluvastatin',
    food: 'Grapefruit / grapefruit juice',
    severity: 'minor',
    mechanism: 'These statins are minimally metabolized by CYP3A4; grapefruit has only minor effect compared to simvastatin/lovastatin.',
    recommendation: 'No strict restriction needed, though high-volume grapefruit is best avoided as a precaution.',
  },

  // ── Fat-soluble vitamins + fat ────────────────────────────────────────────
  {
    drug_pattern: 'vitamin d|vitamin a|vitamin e|vitamin k',
    food: 'High-fat meal (positive interaction)',
    severity: 'minor',
    mechanism: 'Fat-soluble vitamins require dietary fat for micellar solubilization and chylomicron incorporation for absorption.',
    recommendation: 'Take fat-soluble vitamins with the largest fat-containing meal of the day to maximize absorption.',
  },

  // ── Iron + vitamin C ─────────────────────────────────────────────────────
  {
    drug_pattern: 'ferrous sulfate|ferrous gluconate|iron supplement|ferrous fumarate',
    food: 'Vitamin C / citrus (positive interaction)',
    severity: 'minor',
    mechanism: 'Ascorbic acid reduces Fe³⁺ to more soluble Fe²⁺ and chelates iron in a soluble complex, enhancing non-heme iron absorption.',
    recommendation: 'Take iron with a small glass of orange juice or 250 mg vitamin C to enhance absorption.',
  },
  {
    drug_pattern: 'ferrous sulfate|ferrous gluconate|iron supplement|ferrous fumarate',
    food: 'Tea, coffee, whole grains, dairy',
    severity: 'moderate',
    mechanism: 'Tannins, phytates, and calcium bind iron in insoluble complexes, reducing absorption by 50–90%.',
    recommendation: 'Take iron on an empty stomach or with vitamin C, away from tea, coffee, and dairy.',
  },

  // ── Metformin + alcohol ───────────────────────────────────────────────────
  {
    drug_pattern: 'metformin',
    food: 'Alcohol (especially binge drinking)',
    severity: 'moderate',
    mechanism: 'Alcohol impairs lactate clearance; combined with metformin\'s inhibition of hepatic gluconeogenesis, lactic acidosis risk increases.',
    recommendation: 'Limit alcohol consumption. Avoid binge drinking entirely while on metformin.',
  },

  // ── Lithium + caffeine / sodium ───────────────────────────────────────────
  {
    drug_pattern: 'lithium',
    food: 'Low-sodium diet, heavy caffeine, excessive fluid loss',
    severity: 'moderate',
    mechanism: 'Lithium renal clearance parallels sodium; low sodium or dehydration causes lithium retention, elevating serum levels toward toxicity.',
    recommendation: 'Maintain consistent sodium and fluid intake. Avoid drastic dietary changes. Monitor lithium levels.',
  },

  // ── Digoxin + licorice / high-fiber ──────────────────────────────────────
  {
    drug_pattern: 'digoxin',
    food: 'Licorice (glycyrrhizin), high-fiber bran',
    severity: 'moderate',
    mechanism: 'Licorice causes pseudohyperaldosteronism and hypokalemia, potentiating digoxin toxicity. High fiber reduces digoxin absorption.',
    recommendation: 'Avoid large amounts of licorice. Take digoxin consistently with or without food. Monitor potassium levels.',
  },

  // ── ACE inhibitors + potassium ────────────────────────────────────────────
  {
    drug_pattern: 'lisinopril|enalapril|ramipril|captopril|perindopril',
    food: 'Potassium supplements, salt substitutes (KCl), high-potassium foods in excess',
    severity: 'moderate',
    mechanism: 'ACE inhibitors reduce aldosterone, impairing potassium excretion. Combined with high potassium intake, risk of hyperkalemia (arrhythmia).',
    recommendation: 'Avoid potassium supplements unless prescribed. Use regular table salt, not KCl salt substitutes.',
  },

  // ── NSAIDs + alcohol ──────────────────────────────────────────────────────
  {
    drug_pattern: 'ibuprofen|naproxen|aspirin|diclofenac|celecoxib',
    food: 'Alcohol',
    severity: 'moderate',
    mechanism: 'Both NSAIDs and alcohol damage gastric mucosa and inhibit prostaglandin-mediated cytoprotection, increasing GI bleeding risk.',
    recommendation: 'Avoid alcohol while taking NSAIDs, especially with regular use. Use a proton pump inhibitor if needed.',
  },

  // ── Quinolones + antacids ─────────────────────────────────────────────────
  {
    drug_pattern: 'ciprofloxacin|levofloxacin',
    food: 'Antacids containing Al³⁺/Mg²⁺',
    severity: 'moderate',
    mechanism: 'Polyvalent cation chelation reduces fluoroquinolone absorption by 50–90%.',
    recommendation: 'Separate fluoroquinolone dosing by at least 2 hours before or 6 hours after antacids.',
  },

  // ── Azole antifungals + food ──────────────────────────────────────────────
  {
    drug_pattern: 'itraconazole',
    food: 'Fatty meal (positive — capsule form) / acidic beverage (Posaconazole)',
    severity: 'minor',
    mechanism: 'Itraconazole capsules require acid and fat for dissolution. Food increases bioavailability by up to 4-fold.',
    recommendation: 'Take itraconazole capsules with a full meal. Switch to the solution form for fasting patients.',
  },

  // ── Corticosteroids + calcium ─────────────────────────────────────────────
  {
    drug_pattern: 'prednisone|prednisolone|dexamethasone|methylprednisolone',
    food: 'Low calcium / low vitamin D intake',
    severity: 'moderate',
    mechanism: 'Glucocorticoids decrease intestinal calcium absorption and increase renal calcium loss, promoting osteoporosis with prolonged use.',
    recommendation: 'Ensure adequate calcium (1200 mg/day) and vitamin D (800–1000 IU/day) intake when on long-term corticosteroids.',
  },

  // ── MAT – Naltrexone + alcohol ────────────────────────────────────────────
  {
    drug_pattern: 'naltrexone',
    food: 'Opioids (including opioid-containing cough syrups)',
    severity: 'major',
    mechanism: 'Naltrexone competitively blocks opioid receptors. Taking opioids will precipitate acute withdrawal or be ineffective.',
    recommendation: 'Patients on naltrexone must not use opioids. Ensure opioid-free status (7–10 days) before starting.',
  },

  // ── Quinidine / Class I + grapefruit ──────────────────────────────────────
  {
    drug_pattern: 'quinidine|amiodarone',
    food: 'Grapefruit / grapefruit juice',
    severity: 'moderate',
    mechanism: 'CYP3A4 inhibition raises antiarrhythmic drug levels, increasing QT-prolongation risk.',
    recommendation: 'Avoid grapefruit products while on antiarrhythmic therapy.',
  },

  // ── PDE5 inhibitors + grapefruit ─────────────────────────────────────────
  {
    drug_pattern: 'sildenafil|tadalafil|vardenafil',
    food: 'Grapefruit / grapefruit juice',
    severity: 'moderate',
    mechanism: 'CYP3A4 inhibition elevates PDE5 inhibitor plasma levels, increasing hypotension and adverse effect risk.',
    recommendation: 'Avoid grapefruit and grapefruit juice when taking PDE5 inhibitors.',
  },

  // ── Antidepressants + tyramine (less than MAOIs) ─────────────────────────
  {
    drug_pattern: 'linezolid',
    food: 'Tyramine-rich foods (aged cheese, cured meats, soy sauce)',
    severity: 'major',
    mechanism: 'Linezolid has mild MAOI activity. Tyramine accumulation can cause serotonin syndrome and hypertensive reactions.',
    recommendation: 'Avoid high-tyramine foods during linezolid therapy (typically short-course, 10–14 days).',
  },

  // ── Melatonin + caffeine / light ─────────────────────────────────────────
  {
    drug_pattern: 'melatonin',
    food: 'Caffeine (coffee, tea, energy drinks)',
    severity: 'minor',
    mechanism: 'Caffeine inhibits adenosine receptors and may reduce melatonin efficacy; both affect circadian rhythm signaling.',
    recommendation: 'Avoid caffeine in the 4–6 hours before taking melatonin.',
  },
]

// ─── Chronopharmacology tips ──────────────────────────────────────────────────

export interface ChronopharmacologyTip {
  drug_class: string
  examples: string[]
  optimal_timing: string
  reason: string
  evidence?: string
}

export const CHRONOPHARMACOLOGY_TIPS: ChronopharmacologyTip[] = [
  {
    drug_class: 'Statins (HMG-CoA reductase inhibitors)',
    examples: ['simvastatin', 'lovastatin', 'atorvastatin', 'rosuvastatin', 'pravastatin', 'fluvastatin'],
    optimal_timing: 'Evening / bedtime',
    reason: 'HMG-CoA reductase activity peaks between midnight and 2 AM. Evening dosing aligns drug concentration with peak hepatic cholesterol synthesis.',
    evidence: 'Jones et al. 1990; short-acting statins show 30–40% greater LDL reduction with evening vs. morning dosing.',
  },
  {
    drug_class: 'ACE inhibitors / ARBs',
    examples: ['lisinopril', 'enalapril', 'ramipril', 'captopril', 'losartan', 'valsartan', 'olmesartan'],
    optimal_timing: 'Bedtime',
    reason: 'BP rises sharply in the morning (morning surge). Bedtime dosing maintains therapeutic levels during this high-risk period and reduces non-dipping pattern.',
    evidence: 'MAPEC trial (Hermida et al. 2010): Bedtime antihypertensives reduced cardiovascular events by 33%.',
  },
  {
    drug_class: 'Biguanides (Metformin)',
    examples: ['metformin'],
    optimal_timing: 'With meals',
    reason: 'Food slows gastric emptying and reduces metformin-related GI adverse effects (nausea, diarrhea). Efficacy is not time-dependent.',
    evidence: 'Product labeling; clinical practice guidelines.',
  },
  {
    drug_class: 'Thyroid hormone',
    examples: ['levothyroxine', 'synthroid', 'liothyronine', 'armour thyroid'],
    optimal_timing: '30–60 minutes before breakfast (on empty stomach)',
    reason: 'Food, coffee, and calcium reduce levothyroxine absorption by up to 40%. Consistent morning fasting maximizes bioavailability.',
    evidence: 'Benvenga et al. 2008; Eur J Endocrinol.',
  },
  {
    drug_class: 'Bisphosphonates',
    examples: ['alendronate', 'risedronate', 'ibandronate'],
    optimal_timing: 'Fasting, first thing in morning with plain water',
    reason: 'Must be absorbed before food. Upright posture (30 min post-dose) prevents esophageal erosion from pill reflux.',
    evidence: 'Product prescribing information; FDA label.',
  },
  {
    drug_class: 'Iron supplements',
    examples: ['ferrous sulfate', 'ferrous gluconate', 'ferrous fumarate', 'iron bisglycinate'],
    optimal_timing: 'Morning on empty stomach with vitamin C',
    reason: 'Iron absorption is highest in the morning and on an empty stomach. Vitamin C (ascorbic acid) reduces Fe³⁺ → Fe²⁺, increasing absorption.',
    evidence: 'Moretti et al. 2015; Br J Nutr.',
  },
  {
    drug_class: 'Vitamin D',
    examples: ['cholecalciferol', 'vitamin d3', 'vitamin d2', 'ergocalciferol'],
    optimal_timing: 'With the largest fat-containing meal of the day',
    reason: 'Vitamin D is fat-soluble; requires dietary fat for micellar solubilization. 50% greater absorption with high-fat vs. low-fat meal.',
    evidence: 'Dawson-Hughes et al. 2015; JBMR.',
  },
  {
    drug_class: 'Melatonin',
    examples: ['melatonin'],
    optimal_timing: '30 minutes before target bedtime',
    reason: 'Melatonin mimics the onset of endogenous melatonin. Taking it 30 min before desired sleep onset aligns with the dim-light melatonin onset (DLMO).',
    evidence: 'Lewy et al. 2006; Circadian biology research.',
  },
  {
    drug_class: 'Proton pump inhibitors (PPIs)',
    examples: ['omeprazole', 'pantoprazole', 'esomeprazole', 'lansoprazole', 'rabeprazole'],
    optimal_timing: '30–60 minutes before the first meal of the day',
    reason: 'PPIs require activated proton pumps to work. Proton pumps are maximally active after fasting; meals stimulate pump activation.',
    evidence: 'Sachs et al. 1998; Aliment Pharmacol Ther.',
  },
  {
    drug_class: 'Aspirin (antiplatelet)',
    examples: ['aspirin', 'acetylsalicylic acid'],
    optimal_timing: 'Morning with food (if once-daily)',
    reason: 'Platelet aggregability is higher in the morning (morning surge of cardiovascular events). Food reduces GI irritation.',
    evidence: 'Hermida et al. 2003; Chronobiology Int.',
  },
  {
    drug_class: 'Corticosteroids',
    examples: ['prednisone', 'prednisolone', 'methylprednisolone', 'dexamethasone', 'hydrocortisone'],
    optimal_timing: 'Morning with food',
    reason: 'Mimics the natural cortisol peak (6–8 AM). Morning dosing minimizes disruption of the HPA axis and reduces insomnia.',
    evidence: 'Standard clinical endocrinology practice.',
  },
  {
    drug_class: 'Antidepressants (activating SSRIs/SNRIs)',
    examples: ['fluoxetine', 'sertraline', 'venlafaxine', 'duloxetine', 'bupropion'],
    optimal_timing: 'Morning',
    reason: 'Activating antidepressants can cause insomnia or vivid dreams if taken at night. Morning dosing reduces sleep interference.',
    evidence: 'Clinical practice; prescribing information.',
  },
  {
    drug_class: 'Antidepressants (sedating)',
    examples: ['mirtazapine', 'trazodone', 'amitriptyline', 'nortriptyline', 'doxepin'],
    optimal_timing: 'Bedtime',
    reason: 'Sedating properties can be leveraged to improve sleep onset when taken at bedtime.',
    evidence: 'Standard prescribing practice.',
  },
]

// ─── Frequency → daily doses map ─────────────────────────────────────────────

export const FREQUENCY_DOSES_PER_DAY: Record<MedicationFrequency, number> = {
  once_daily: 1,
  twice_daily: 2,
  three_daily: 3,
  four_daily: 4,
  weekly: 1 / 7,
  as_needed: 0,
}

export const FREQUENCY_LABELS: Record<MedicationFrequency, string> = {
  once_daily: 'Once daily',
  twice_daily: 'Twice daily',
  three_daily: 'Three times daily',
  four_daily: 'Four times daily',
  weekly: 'Once weekly',
  as_needed: 'As needed',
}

// ─── Compliance calculator ────────────────────────────────────────────────────

/**
 * Calculate medication compliance rate.
 * @param logs - Array of medication logs
 * @param scheduledDoses - Total number of doses that should have been taken
 * @returns Compliance percentage 0–100
 */
export function calculateComplianceRate(
  logs: MedicationLog[],
  scheduledDoses: number
): number {
  if (scheduledDoses <= 0) return 100
  const taken = logs.filter(l => l.taken_at !== null && !l.skipped).length
  return Math.min(100, Math.round((taken / scheduledDoses) * 100))
}

export type AdherenceStatus = 'excellent' | 'good' | 'moderate' | 'poor'

/**
 * WHO adherence classification:
 * Excellent ≥95%, Good 80–94%, Moderate 50–79%, Poor <50%
 */
export function getAdherenceStatus(rate: number): AdherenceStatus {
  if (rate >= 95) return 'excellent'
  if (rate >= 80) return 'good'
  if (rate >= 50) return 'moderate'
  return 'poor'
}

export const ADHERENCE_COLORS: Record<AdherenceStatus, string> = {
  excellent: '#22c55e',
  good: '#84cc16',
  moderate: '#f59e0b',
  poor: '#ef4444',
}

export const ADHERENCE_LABELS: Record<AdherenceStatus, string> = {
  excellent: 'Excellent (≥95%)',
  good: 'Good (80–94%)',
  moderate: 'Moderate (50–79%)',
  poor: 'Poor (<50%)',
}

// ─── Interaction checker ──────────────────────────────────────────────────────

export interface FlaggedInteraction {
  drug_pattern: string
  matchedMedication: string
  food: string
  severity: InteractionSeverity
  mechanism: string
  recommendation: string
}

/**
 * Check for drug-food interactions for a list of medication names.
 * Returns all matched interactions sorted by severity (major first).
 */
export function checkInteractions(medicationNames: string[]): FlaggedInteraction[] {
  const results: FlaggedInteraction[] = []
  const severityOrder: Record<InteractionSeverity, number> = { major: 0, moderate: 1, minor: 2 }

  for (const med of medicationNames) {
    const lower = med.toLowerCase()
    for (const interaction of DRUG_FOOD_INTERACTIONS) {
      const patterns = interaction.drug_pattern.split('|')
      for (const pattern of patterns) {
        if (lower.includes(pattern.trim().toLowerCase())) {
          results.push({
            drug_pattern: interaction.drug_pattern,
            matchedMedication: med,
            food: interaction.food,
            severity: interaction.severity,
            mechanism: interaction.mechanism,
            recommendation: interaction.recommendation,
          })
          break
        }
      }
    }
  }

  return results.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
}

// ─── Chronopharmacology matcher ───────────────────────────────────────────────

/**
 * Get chronopharmacology timing tip for a medication by name.
 */
export function getChronopharmacologyTip(
  medicationName: string
): ChronopharmacologyTip | undefined {
  const lower = medicationName.toLowerCase()
  return CHRONOPHARMACOLOGY_TIPS.find(tip =>
    tip.examples.some(ex => lower.includes(ex.toLowerCase()))
  )
}

// ─── Missed-dose guidance ─────────────────────────────────────────────────────

export type MissedDoseAction = 'take_now' | 'skip' | 'consult_doctor'

/**
 * General guidance for missed doses based on medication type and time elapsed.
 *
 * Rules derived from FDA medication guides and clinical pharmacist guidelines:
 * - If >50% of dosing interval has passed → skip and resume next scheduled dose
 * - Narrow therapeutic index drugs → always consult doctor
 * - As-needed medications → take when needed
 */
export function getMissedDoseGuidance(
  medicationName: string,
  hoursLate: number
): { action: MissedDoseAction; message: string } {
  const lower = medicationName.toLowerCase()

  // Narrow therapeutic index — always consult
  const narrowTI = [
    'warfarin', 'digoxin', 'lithium', 'phenytoin', 'carbamazepine',
    'valproate', 'tacrolimus', 'cyclosporine', 'levothyroxine',
    'methotrexate', 'insulin',
  ]
  if (narrowTI.some(drug => lower.includes(drug))) {
    return {
      action: 'consult_doctor',
      message: `${medicationName} has a narrow therapeutic index. Contact your prescriber or pharmacist for specific instructions.`,
    }
  }

  // Bisphosphonates (weekly) — skip if same day missed, wait for next week
  if (lower.includes('alendronate') || lower.includes('risedronate') || lower.includes('ibandronate')) {
    return {
      action: 'skip',
      message: `Skip the missed dose and take your next dose on your regular scheduled day. Never take two doses on the same day.`,
    }
  }

  // Antibiotics — take as soon as remembered (unless almost time for next dose)
  const antibiotics = ['amoxicillin', 'azithromycin', 'ciprofloxacin', 'doxycycline', 'cephalexin']
  if (antibiotics.some(ab => lower.includes(ab))) {
    if (hoursLate <= 4) {
      return { action: 'take_now', message: 'Take the missed dose now and continue your regular schedule.' }
    }
    return { action: 'skip', message: 'Skip the missed dose and take the next one at your regular time. Do not double the dose.' }
  }

  // General rule: if less than half the dosing interval has passed → take now
  if (hoursLate <= 6) {
    return {
      action: 'take_now',
      message: `Take the missed ${medicationName} dose now, then resume your regular schedule.`,
    }
  }

  if (hoursLate <= 12) {
    return {
      action: 'skip',
      message: `Skip the missed dose. Take the next scheduled dose at your regular time. Do not double up.`,
    }
  }

  return {
    action: 'consult_doctor',
    message: `It has been ${Math.round(hoursLate)} hours since the missed dose. Consult your prescriber or pharmacist for guidance.`,
  }
}

// ─── WHO adherence tips ───────────────────────────────────────────────────────

export const WHO_ADHERENCE_TIPS: string[] = [
  'Set phone alarms or use a pill organizer to build a consistent routine.',
  'Link medication taking to a daily habit (morning coffee, brushing teeth, meals).',
  'Keep medications visible but stored correctly — counter vs. bathroom cabinet.',
  'Fill prescriptions before running out; request 90-day supplies when stable.',
  'Tell your prescriber about side effects — there are often alternatives.',
  'If cost is a barrier, ask about generic equivalents or patient assistance programs.',
  'Review all medications (including OTC and supplements) with your pharmacist annually.',
  'Traveling? Pack medications in carry-on luggage with original pharmacy labels.',
  'Use blister packs or smart pill dispensers if memory or vision is a concern.',
  'Track your adherence — patients who monitor themselves show 20–30% better outcomes (WHO 2003).',
]

// ─── Scheduled dose generator ─────────────────────────────────────────────────

/**
 * Generate scheduled timestamps for a medication for a given date.
 */
export function getScheduledTimesForDate(
  medication: MedicationEntry,
  date: string
): string[] {
  return medication.times_of_day.map(time => `${date}T${time}:00`)
}

/**
 * Count expected doses for a medication over a date range.
 */
export function countExpectedDoses(
  medication: MedicationEntry,
  startDate: string,
  endDate: string
): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

  if (medication.frequency === 'weekly') {
    return Math.ceil(days / 7)
  }
  if (medication.frequency === 'as_needed') {
    return 0
  }
  return days * medication.times_of_day.length
}
