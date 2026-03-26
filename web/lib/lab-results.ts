// Lab Results Library — functional medicine optimal ranges

export type LabCategory =
  | 'metabolic'
  | 'lipids'
  | 'cbc'
  | 'thyroid'
  | 'hormones'
  | 'vitamins'
  | 'inflammatory'
  | 'cardiac'
  | 'kidney'
  | 'liver'

export type MarkerSeverity = 'optimal' | 'normal_not_optimal' | 'out_of_range'

export interface LabMarker {
  id: string
  name: string
  category: LabCategory
  unit: string
  labRangeLow: number
  labRangeHigh: number
  optimalLow: number
  optimalHigh: number
  description: string
  interpretation: string
  higherIsBetter?: boolean // for markers like HDL, Vitamin D
}

export const LAB_MARKERS: LabMarker[] = [
  // ── METABOLIC ─────────────────────────────────────────────────────────────
  {
    id: 'glucose_fasting',
    name: 'Glucose (Fasting)',
    category: 'metabolic',
    unit: 'mg/dL',
    labRangeLow: 70,
    labRangeHigh: 99,
    optimalLow: 72,
    optimalHigh: 85,
    description: 'Fasting blood sugar level, primary marker for metabolic health.',
    interpretation:
      'Optimal range (72–85) reflects excellent insulin sensitivity. Levels 86–99 are "normal" but associated with early insulin resistance. Over 100 suggests prediabetes.',
  },
  {
    id: 'hba1c',
    name: 'HbA1c',
    category: 'metabolic',
    unit: '%',
    labRangeLow: 4.0,
    labRangeHigh: 5.6,
    optimalLow: 4.0,
    optimalHigh: 5.4,
    description: '3-month average blood sugar — reflects glycemic control.',
    interpretation:
      'Optimal <5.4% suggests low glycation stress. 5.7–6.4% is prediabetic range. Each 1% rise in HbA1c increases cardiovascular risk ~18%.',
  },
  {
    id: 'insulin_fasting',
    name: 'Insulin (Fasting)',
    category: 'metabolic',
    unit: 'uIU/mL',
    labRangeLow: 2.0,
    labRangeHigh: 24.9,
    optimalLow: 2.0,
    optimalHigh: 5.0,
    description: 'Fasting insulin reflects how hard the pancreas is working.',
    interpretation:
      'Optimal <5 uIU/mL indicates excellent insulin sensitivity. 6–10 suggests early resistance. >10 strongly correlates with MetS, obesity, and PCOS.',
  },
  {
    id: 'homa_ir',
    name: 'HOMA-IR',
    category: 'metabolic',
    unit: 'ratio',
    labRangeLow: 0,
    labRangeHigh: 2.5,
    optimalLow: 0,
    optimalHigh: 1.0,
    description: 'Homeostatic Model Assessment of Insulin Resistance (glucose × insulin / 405).',
    interpretation:
      'HOMA-IR <1.0 is optimal. 1.0–2.5 indicates mild resistance. >2.5 is insulin resistant. >3.5 often seen with NAFLD and MetS.',
  },
  {
    id: 'uric_acid_metabolic',
    name: 'Uric Acid',
    category: 'metabolic',
    unit: 'mg/dL',
    labRangeLow: 2.4,
    labRangeHigh: 7.0,
    optimalLow: 2.4,
    optimalHigh: 5.5,
    description: 'Byproduct of purine metabolism; elevated levels tied to MetS and gout.',
    interpretation:
      'Optimal <5.5 mg/dL. Levels >6.0 in women and >7.0 in men raise gout and cardiometabolic risk. Fructose strongly drives elevations.',
  },

  // ── LIPIDS ────────────────────────────────────────────────────────────────
  {
    id: 'total_cholesterol',
    name: 'Total Cholesterol',
    category: 'lipids',
    unit: 'mg/dL',
    labRangeLow: 0,
    labRangeHigh: 199,
    optimalLow: 150,
    optimalHigh: 200,
    description: 'Sum of all cholesterol fractions.',
    interpretation:
      'Context matters — very low (<150) linked to cancer risk; very high (>240) increases CVD risk. Optimal in the absence of inflammatory markers.',
  },
  {
    id: 'ldl_c',
    name: 'LDL-C',
    category: 'lipids',
    unit: 'mg/dL',
    labRangeLow: 0,
    labRangeHigh: 99,
    optimalLow: 50,
    optimalHigh: 100,
    description: 'Low-density lipoprotein cholesterol — primary atherogenic lipoprotein.',
    interpretation:
      'Standard optimal <100 mg/dL. High-risk individuals aim for <70. ApoB is a better particle count marker. LDL alone misses ~50% of cardiac events.',
  },
  {
    id: 'hdl_c',
    name: 'HDL-C',
    category: 'lipids',
    unit: 'mg/dL',
    labRangeLow: 40,
    labRangeHigh: 999,
    optimalLow: 60,
    optimalHigh: 999,
    description: 'High-density lipoprotein — reverse cholesterol transport.',
    interpretation:
      'Higher is better. >60 mg/dL is protective. <40 men / <50 women is a MetS criterion. Very high HDL (>100) may paradoxically impair function.',
    higherIsBetter: true,
  },
  {
    id: 'triglycerides',
    name: 'Triglycerides',
    category: 'lipids',
    unit: 'mg/dL',
    labRangeLow: 0,
    labRangeHigh: 149,
    optimalLow: 0,
    optimalHigh: 80,
    description: 'Blood fats reflecting carbohydrate and alcohol intake.',
    interpretation:
      'Functional optimal <80 mg/dL. Standard labs flag >150. Trig >150 + low HDL is a strong insulin resistance signal. Driven mainly by refined carbs/alcohol.',
  },
  {
    id: 'apob',
    name: 'ApoB',
    category: 'lipids',
    unit: 'mg/dL',
    labRangeLow: 0,
    labRangeHigh: 99,
    optimalLow: 40,
    optimalHigh: 70,
    description: 'Apolipoprotein B — counts all atherogenic particles (LDL, VLDL, IDL, Lp(a)).',
    interpretation:
      'Optimal <70 mg/dL for high-risk, <80 for general population. Better predictor of ASCVD than LDL-C alone. Each apoB particle can penetrate the arterial wall.',
  },
  {
    id: 'lpa',
    name: 'Lp(a)',
    category: 'lipids',
    unit: 'nmol/L',
    labRangeLow: 0,
    labRangeHigh: 75,
    optimalLow: 0,
    optimalHigh: 30,
    description: 'Lipoprotein(a) — genetically determined, highly atherogenic and thrombogenic.',
    interpretation:
      'Optimal <30 nmol/L. >75 nmol/L significantly elevates ASCVD and aortic stenosis risk. Largely genetic; diet has minimal effect. Test once in a lifetime.',
  },
  {
    id: 'trig_hdl_ratio',
    name: 'Trig/HDL Ratio',
    category: 'lipids',
    unit: 'ratio',
    labRangeLow: 0,
    labRangeHigh: 2.0,
    optimalLow: 0,
    optimalHigh: 1.0,
    description: 'Triglyceride-to-HDL ratio — proxy for insulin resistance and small-dense LDL.',
    interpretation:
      'Optimal <1.0. Ratio >2.0 strongly predicts insulin resistance and small-dense LDL predominance. Simple, free, and underused screening tool.',
  },

  // ── CBC ───────────────────────────────────────────────────────────────────
  {
    id: 'wbc',
    name: 'WBC',
    category: 'cbc',
    unit: 'K/μL',
    labRangeLow: 4.0,
    labRangeHigh: 11.0,
    optimalLow: 4.5,
    optimalHigh: 7.5,
    description: 'White blood cell count — immune system activity marker.',
    interpretation:
      'Optimal 4.5–7.5 K/μL. Chronically elevated WBC (>8) predicts MetS and CVD. Very low (<4) may indicate bone marrow issues or viral infection.',
  },
  {
    id: 'rbc',
    name: 'RBC',
    category: 'cbc',
    unit: 'M/μL',
    labRangeLow: 4.2,
    labRangeHigh: 5.8,
    optimalLow: 4.5,
    optimalHigh: 5.5,
    description: 'Red blood cell count — oxygen-carrying capacity.',
    interpretation:
      'Low RBC may indicate anemia. High RBC (polycythemia) increases blood viscosity and clot risk. Best interpreted alongside hemoglobin and MCV.',
  },
  {
    id: 'hemoglobin',
    name: 'Hemoglobin',
    category: 'cbc',
    unit: 'g/dL',
    labRangeLow: 12.0,
    labRangeHigh: 17.5,
    optimalLow: 13.5,
    optimalHigh: 17.0,
    description: 'Oxygen-carrying protein in red blood cells.',
    interpretation:
      'Low hemoglobin = anemia (fatigue, poor exercise tolerance). Optimal varies by sex. Men: 13.5–17. Women: 12–15.5. Iron, B12, folate are common causes of low levels.',
  },
  {
    id: 'hematocrit',
    name: 'Hematocrit',
    category: 'cbc',
    unit: '%',
    labRangeLow: 37.0,
    labRangeHigh: 52.0,
    optimalLow: 40.0,
    optimalHigh: 50.0,
    description: 'Percentage of blood volume composed of red blood cells.',
    interpretation:
      'Parallels hemoglobin trends. Low hematocrit = anemia. High (>52%) increases clot risk. Dehydration artificially raises it.',
  },
  {
    id: 'mcv',
    name: 'MCV',
    category: 'cbc',
    unit: 'fL',
    labRangeLow: 80,
    labRangeHigh: 100,
    optimalLow: 82,
    optimalHigh: 94,
    description: 'Mean corpuscular volume — size of red blood cells.',
    interpretation:
      'Low MCV (microcytic) = iron deficiency or thalassemia. High MCV (macrocytic) = B12 or folate deficiency. Optimal 82–94 fL.',
  },
  {
    id: 'mch',
    name: 'MCH',
    category: 'cbc',
    unit: 'pg',
    labRangeLow: 27,
    labRangeHigh: 33,
    optimalLow: 28,
    optimalHigh: 32,
    description: 'Mean corpuscular hemoglobin — average hemoglobin per RBC.',
    interpretation:
      'Low MCH suggests iron deficiency. High MCH may indicate B12/folate deficiency or liver disease. Usually tracks with MCV.',
  },
  {
    id: 'platelets',
    name: 'Platelets',
    category: 'cbc',
    unit: 'K/μL',
    labRangeLow: 150,
    labRangeHigh: 400,
    optimalLow: 180,
    optimalHigh: 350,
    description: 'Thrombocytes — involved in clotting and inflammation.',
    interpretation:
      'Low platelets (<150) raise bleeding risk. High platelets (>400) may indicate inflammation or reactive thrombocytosis. Optimal 180–350 K/μL.',
  },

  // ── THYROID ───────────────────────────────────────────────────────────────
  {
    id: 'tsh',
    name: 'TSH',
    category: 'thyroid',
    unit: 'mIU/L',
    labRangeLow: 0.45,
    labRangeHigh: 4.5,
    optimalLow: 0.5,
    optimalHigh: 2.5,
    description: 'Thyroid stimulating hormone — pituitary signal to thyroid.',
    interpretation:
      'Functional optimal 0.5–2.5 mIU/L. TSH >2.5 may indicate subclinical hypothyroidism even within "normal" lab range. >4.5 is overt hypothyroid. Low TSH suggests hyperthyroid.',
  },
  {
    id: 'free_t3',
    name: 'Free T3',
    category: 'thyroid',
    unit: 'pg/mL',
    labRangeLow: 2.3,
    labRangeHigh: 4.2,
    optimalLow: 3.2,
    optimalHigh: 4.2,
    description: 'Active thyroid hormone — the metabolically active form.',
    interpretation:
      'Free T3 is the biologically active hormone. Optimal in upper third of range (3.2–4.2 pg/mL). Low T3 despite normal TSH indicates peripheral conversion problems.',
  },
  {
    id: 'free_t4',
    name: 'Free T4',
    category: 'thyroid',
    unit: 'ng/dL',
    labRangeLow: 0.8,
    labRangeHigh: 1.8,
    optimalLow: 1.0,
    optimalHigh: 1.8,
    description: 'Prohormone converted to T3 in tissues.',
    interpretation:
      'Optimal in upper half of range. Low T4 with high TSH = primary hypothyroid. Low T4 with low TSH = central hypothyroid (pituitary). Always interpret alongside Free T3.',
  },
  {
    id: 'tpo_antibodies',
    name: 'TPO Antibodies',
    category: 'thyroid',
    unit: 'IU/mL',
    labRangeLow: 0,
    labRangeHigh: 34,
    optimalLow: 0,
    optimalHigh: 15,
    description: 'Thyroid peroxidase antibodies — autoimmune marker.',
    interpretation:
      'Optimal <15 IU/mL. Elevated TPO (>34) indicates autoimmune thyroid disease (Hashimoto\'s). Gluten elimination, selenium (200μg), and vitamin D often help reduce levels.',
  },

  // ── HORMONES ──────────────────────────────────────────────────────────────
  {
    id: 'testosterone_total',
    name: 'Testosterone (Total)',
    category: 'hormones',
    unit: 'ng/dL',
    labRangeLow: 264,
    labRangeHigh: 916,
    optimalLow: 600,
    optimalHigh: 900,
    description: 'Total testosterone — bound and unbound forms combined.',
    interpretation:
      'Functional optimal 600–900 ng/dL for men. Women: 15–70 ng/dL. Low levels correlate with fatigue, depression, reduced lean mass, insulin resistance. Test in the morning (peak levels).',
  },
  {
    id: 'testosterone_free',
    name: 'Testosterone (Free)',
    category: 'hormones',
    unit: 'pg/mL',
    labRangeLow: 6,
    labRangeHigh: 25,
    optimalLow: 15,
    optimalHigh: 25,
    description: 'Unbound testosterone — biologically active fraction.',
    interpretation:
      'More clinically relevant than total T. Can be low despite normal total T if SHBG is elevated. Optimal 15–25 pg/mL for men. High SHBG (from liver disease, aging) reduces free T.',
  },
  {
    id: 'dhea_s',
    name: 'DHEA-S',
    category: 'hormones',
    unit: 'μg/dL',
    labRangeLow: 80,
    labRangeHigh: 560,
    optimalLow: 200,
    optimalHigh: 400,
    description: 'DHEA sulfate — adrenal androgen, declines with age.',
    interpretation:
      'Optimal 200–400 μg/dL in adults. Declines ~2% per year after 30. Low DHEA-S correlates with fatigue, immune dysfunction, and increased mortality in elderly populations.',
  },
  {
    id: 'cortisol_am',
    name: 'Cortisol (AM)',
    category: 'hormones',
    unit: 'μg/dL',
    labRangeLow: 6,
    labRangeHigh: 23,
    optimalLow: 12,
    optimalHigh: 20,
    description: 'Morning cortisol — stress hormone, highest at wake.',
    interpretation:
      'Optimal AM cortisol 12–20 μg/dL reflects healthy HPA axis function. <6 suggests adrenal insufficiency. >23 may indicate Cushing\'s or chronic stress. Should be 8–9 AM sample.',
  },
  {
    id: 'estradiol',
    name: 'Estradiol (E2)',
    category: 'hormones',
    unit: 'pg/mL',
    labRangeLow: 15,
    labRangeHigh: 350,
    optimalLow: 80,
    optimalHigh: 200,
    description: 'Primary estrogen — varies by sex, age, and cycle phase.',
    interpretation:
      'In premenopausal women, optimal mid-cycle: 80–200 pg/mL. Postmenopause <30 expected. In men, optimal 20–40 pg/mL — too high or low both impair libido and bone density.',
  },
  {
    id: 'progesterone',
    name: 'Progesterone',
    category: 'hormones',
    unit: 'ng/mL',
    labRangeLow: 0.1,
    labRangeHigh: 25,
    optimalLow: 10,
    optimalHigh: 25,
    description: 'Luteal phase hormone — measured at day 21 of cycle.',
    interpretation:
      'Optimal luteal phase >10 ng/mL. Low progesterone causes estrogen dominance: mood swings, poor sleep, heavy periods. In men, should be <1 ng/mL.',
  },

  // ── VITAMINS & MINERALS ───────────────────────────────────────────────────
  {
    id: 'vitamin_d',
    name: 'Vitamin D (25-OH)',
    category: 'vitamins',
    unit: 'ng/mL',
    labRangeLow: 30,
    labRangeHigh: 100,
    optimalLow: 40,
    optimalHigh: 60,
    description: 'Fat-soluble steroid hormone — immune, bone, and mood regulation.',
    interpretation:
      'Optimal 40–60 ng/mL. Most labs accept >30, but research shows benefits at 40–60. >100 ng/mL is toxic. Co-supplement with K2 (100–200 μg MK-7) to direct calcium to bones.',
    higherIsBetter: true,
  },
  {
    id: 'b12',
    name: 'Vitamin B12',
    category: 'vitamins',
    unit: 'pg/mL',
    labRangeLow: 200,
    labRangeHigh: 900,
    optimalLow: 400,
    optimalHigh: 900,
    description: 'Essential for DNA synthesis, nerve function, and methylation.',
    interpretation:
      'Standard labs allow 200+, but symptoms occur at <400 pg/mL. Optimal >400, ideally 500–900. Metformin, PPIs, and plant-based diets significantly deplete B12.',
    higherIsBetter: true,
  },
  {
    id: 'folate',
    name: 'Folate (RBC)',
    category: 'vitamins',
    unit: 'ng/mL',
    labRangeLow: 5,
    labRangeHigh: 20,
    optimalLow: 10,
    optimalHigh: 20,
    description: 'B9 vitamin essential for DNA methylation and cell division.',
    interpretation:
      'RBC folate is a better indicator of tissue stores than serum folate. Optimal >10 ng/mL. MTHFR gene variants reduce conversion — use methylfolate (5-MTHF) rather than folic acid.',
    higherIsBetter: true,
  },
  {
    id: 'iron_serum',
    name: 'Iron (Serum)',
    category: 'vitamins',
    unit: 'μg/dL',
    labRangeLow: 60,
    labRangeHigh: 170,
    optimalLow: 85,
    optimalHigh: 130,
    description: 'Circulating iron — highly variable day-to-day.',
    interpretation:
      'Optimal 85–130 μg/dL. Interpret alongside ferritin, TIBC, and transferrin saturation for full picture. Serum iron alone is unreliable; morning fasting required.',
  },
  {
    id: 'ferritin',
    name: 'Ferritin',
    category: 'vitamins',
    unit: 'ng/mL',
    labRangeLow: 12,
    labRangeHigh: 300,
    optimalLow: 50,
    optimalHigh: 150,
    description: 'Iron storage protein — best marker for iron status.',
    interpretation:
      'Optimal: women 50–100 ng/mL, men 75–150 ng/mL. <20 impairs thyroid, energy, cognition. >200 may indicate hemochromatosis or inflammation. Ferritin rises with infection (acute phase reactant).',
  },
  {
    id: 'zinc',
    name: 'Zinc (Serum)',
    category: 'vitamins',
    unit: 'μg/dL',
    labRangeLow: 60,
    labRangeHigh: 120,
    optimalLow: 80,
    optimalHigh: 115,
    description: 'Essential mineral for immune function, wound healing, and testosterone.',
    interpretation:
      'Optimal 80–115 μg/dL. Deficiency impairs immunity, taste/smell, and testosterone production. Vegetarians and heavy exercisers are at risk. Competes with copper — balance with 1:10 Cu:Zn.',
  },
  {
    id: 'magnesium_rbc',
    name: 'Magnesium (RBC)',
    category: 'vitamins',
    unit: 'mg/dL',
    labRangeLow: 4.2,
    labRangeHigh: 6.8,
    optimalLow: 5.6,
    optimalHigh: 6.8,
    description: 'Intracellular magnesium — cofactor in 300+ enzymatic reactions.',
    interpretation:
      'RBC magnesium reflects tissue stores better than serum. Optimal 5.6–6.8 mg/dL. Deficiency causes muscle cramps, anxiety, poor sleep, hypertension. ~50% of Americans are deficient.',
    higherIsBetter: true,
  },

  // ── INFLAMMATORY ──────────────────────────────────────────────────────────
  {
    id: 'hscrp',
    name: 'hs-CRP',
    category: 'inflammatory',
    unit: 'mg/L',
    labRangeLow: 0,
    labRangeHigh: 3.0,
    optimalLow: 0,
    optimalHigh: 0.5,
    description: 'High-sensitivity C-reactive protein — sensitive systemic inflammation marker.',
    interpretation:
      'Functional optimal <0.5 mg/L. 0.5–1.0 = low risk. 1–3 = moderate risk. >3 = high cardiovascular risk. Elevated by infection, poor sleep, processed food, seed oils, and inactivity.',
  },
  {
    id: 'homocysteine',
    name: 'Homocysteine',
    category: 'inflammatory',
    unit: 'μmol/L',
    labRangeLow: 0,
    labRangeHigh: 15,
    optimalLow: 0,
    optimalHigh: 7,
    description: 'Amino acid reflecting methylation capacity; cardiovascular risk marker.',
    interpretation:
      'Optimal <7 μmol/L. >10 increases CVD, cognitive decline, and bone fracture risk. Driven by B6, B12, and folate insufficiency. MTHFR variants amplify risk.',
  },
  {
    id: 'fibrinogen',
    name: 'Fibrinogen',
    category: 'inflammatory',
    unit: 'mg/dL',
    labRangeLow: 200,
    labRangeHigh: 400,
    optimalLow: 200,
    optimalHigh: 300,
    description: 'Clotting protein and acute-phase reactant.',
    interpretation:
      'Optimal 200–300 mg/dL. Elevated fibrinogen (>400) indicates systemic inflammation and increased clot risk. Strong predictor of stroke and MI. Rises with smoking, insulin resistance.',
  },
  {
    id: 'esr',
    name: 'ESR',
    category: 'inflammatory',
    unit: 'mm/hr',
    labRangeLow: 0,
    labRangeHigh: 20,
    optimalLow: 0,
    optimalHigh: 10,
    description: 'Erythrocyte sedimentation rate — non-specific inflammation screen.',
    interpretation:
      'Optimal <10 mm/hr. Rises with age, inflammation, anemia, autoimmune disease. Less specific than CRP but useful trend marker. Normal in men <15, women <20 mm/hr.',
  },

  // ── CARDIAC ───────────────────────────────────────────────────────────────
  {
    id: 'hs_troponin',
    name: 'hs-Troponin I',
    category: 'cardiac',
    unit: 'ng/L',
    labRangeLow: 0,
    labRangeHigh: 53,
    optimalLow: 0,
    optimalHigh: 6,
    description: 'Highly sensitive cardiac troponin — marker of myocardial injury.',
    interpretation:
      'Optimal <6 ng/L for males, <3 for females at 99th percentile of healthy reference population. Elevated levels indicate subclinical cardiac stress even without acute MI.',
  },
  {
    id: 'bnp',
    name: 'BNP (NT-proBNP)',
    category: 'cardiac',
    unit: 'pg/mL',
    labRangeLow: 0,
    labRangeHigh: 100,
    optimalLow: 0,
    optimalHigh: 100,
    description: 'B-type natriuretic peptide — heart failure and wall stress marker.',
    interpretation:
      'NT-proBNP <100 pg/mL helps rule out heart failure. >300 warrants cardiac evaluation. Rises with hypertension, atrial fibrillation, pulmonary hypertension, and renal disease.',
  },
  {
    id: 'egfr_cardiac',
    name: 'eGFR',
    category: 'cardiac',
    unit: 'mL/min/1.73m²',
    labRangeLow: 60,
    labRangeHigh: 120,
    optimalLow: 90,
    optimalHigh: 120,
    description: 'Estimated glomerular filtration rate — kidney function and cardiorenal risk.',
    interpretation:
      'Optimal ≥90 mL/min/1.73m². 60–89 = mildly decreased. 30–59 = moderate CKD. <30 = severe CKD. Even mild eGFR reductions double cardiovascular risk independent of other factors.',
    higherIsBetter: true,
  },

  // ── KIDNEY ────────────────────────────────────────────────────────────────
  {
    id: 'bun',
    name: 'BUN',
    category: 'kidney',
    unit: 'mg/dL',
    labRangeLow: 7,
    labRangeHigh: 25,
    optimalLow: 10,
    optimalHigh: 18,
    description: 'Blood urea nitrogen — reflects protein catabolism and kidney clearance.',
    interpretation:
      'Optimal 10–18 mg/dL. High BUN (>25) may indicate dehydration, high protein intake, or impaired kidney function. Low BUN (<7) may suggest malnutrition or liver disease.',
  },
  {
    id: 'creatinine',
    name: 'Creatinine',
    category: 'kidney',
    unit: 'mg/dL',
    labRangeLow: 0.6,
    labRangeHigh: 1.2,
    optimalLow: 0.7,
    optimalHigh: 1.1,
    description: 'Muscle metabolism byproduct filtered by kidneys.',
    interpretation:
      'Optimal 0.7–1.1 mg/dL. Elevated creatinine signals declining kidney function. Muscle mass affects baseline — athletes may run higher. Use eGFR for clinical kidney staging.',
  },
  {
    id: 'egfr_kidney',
    name: 'eGFR',
    category: 'kidney',
    unit: 'mL/min/1.73m²',
    labRangeLow: 60,
    labRangeHigh: 120,
    optimalLow: 90,
    optimalHigh: 120,
    description: 'Estimated glomerular filtration rate — gold standard kidney function metric.',
    interpretation:
      'Optimal ≥90. Stages: G2 (60–89), G3a (45–59), G3b (30–44), G4 (15–29), G5 (<15 = kidney failure). CKD affects 15% of US adults, often asymptomatic until late stages.',
    higherIsBetter: true,
  },
  {
    id: 'uric_acid_kidney',
    name: 'Uric Acid',
    category: 'kidney',
    unit: 'mg/dL',
    labRangeLow: 2.4,
    labRangeHigh: 7.0,
    optimalLow: 2.4,
    optimalHigh: 5.5,
    description: 'Uric acid crystals deposit in joints (gout) and damage kidneys.',
    interpretation:
      'Optimal <5.5 mg/dL. Gout attacks typically >7 for men, >6 for women. Reduces nitric oxide production. Treat with low-fructose diet, hydration, and in high-risk patients, allopurinol.',
  },

  // ── LIVER ─────────────────────────────────────────────────────────────────
  {
    id: 'alt',
    name: 'ALT',
    category: 'liver',
    unit: 'U/L',
    labRangeLow: 7,
    labRangeHigh: 56,
    optimalLow: 7,
    optimalHigh: 25,
    description: 'Alanine aminotransferase — liver cell damage marker.',
    interpretation:
      'Functional optimal <25 U/L in men, <19 U/L in women. Standard labs allow up to 56, but even mild elevations (25–40) predict NAFLD. High ALT with high TG + high glucose is a triad for metabolic liver disease.',
  },
  {
    id: 'ast',
    name: 'AST',
    category: 'liver',
    unit: 'U/L',
    labRangeLow: 10,
    labRangeHigh: 40,
    optimalLow: 10,
    optimalHigh: 25,
    description: 'Aspartate aminotransferase — liver and muscle damage marker.',
    interpretation:
      'Optimal <25 U/L. Unlike ALT, AST is also found in heart and muscle — elevated after intense exercise. AST:ALT ratio >2:1 suggests alcoholic liver disease.',
  },
  {
    id: 'ggt',
    name: 'GGT',
    category: 'liver',
    unit: 'U/L',
    labRangeLow: 8,
    labRangeHigh: 61,
    optimalLow: 8,
    optimalHigh: 25,
    description: 'Gamma-glutamyl transferase — sensitive liver/bile duct marker, rises with alcohol.',
    interpretation:
      'Optimal <25 U/L. GGT is highly sensitive to alcohol, medications, and fatty liver. Elevated GGT is an independent predictor of cardiovascular and all-cause mortality.',
  },
  {
    id: 'bilirubin_total',
    name: 'Bilirubin (Total)',
    category: 'liver',
    unit: 'mg/dL',
    labRangeLow: 0.2,
    labRangeHigh: 1.2,
    optimalLow: 0.4,
    optimalHigh: 1.0,
    description: 'Bile pigment from RBC breakdown — liver processing marker.',
    interpretation:
      'Optimal 0.4–1.0 mg/dL. Mildly elevated (1.2–3) may indicate Gilbert\'s syndrome (benign). Higher elevations suggest liver disease or hemolysis. Bilirubin has antioxidant properties at low levels.',
  },
  {
    id: 'albumin',
    name: 'Albumin',
    category: 'liver',
    unit: 'g/dL',
    labRangeLow: 3.5,
    labRangeHigh: 5.0,
    optimalLow: 4.0,
    optimalHigh: 5.0,
    description: 'Major plasma protein made by liver — reflects protein status and liver synthesis.',
    interpretation:
      'Optimal 4.0–5.0 g/dL. Low albumin (<3.5) indicates chronic inflammation, malnutrition, liver disease, or kidney protein loss. Strong predictor of hospitalization and mortality.',
    higherIsBetter: true,
  },

  // Extra markers to exceed 80
  {
    id: 'ldh',
    name: 'LDH',
    category: 'liver',
    unit: 'U/L',
    labRangeLow: 122,
    labRangeHigh: 222,
    optimalLow: 122,
    optimalHigh: 180,
    description: 'Lactate dehydrogenase — released by damaged cells in liver, heart, muscle, and RBCs.',
    interpretation:
      'Optimal 122–180 U/L. Elevated LDH is a non-specific tissue damage marker. Useful as a trend marker in monitoring conditions like hemolytic anemia, heart failure, and cancer.',
  },
  {
    id: 'alkaline_phosphatase',
    name: 'Alkaline Phosphatase',
    category: 'liver',
    unit: 'U/L',
    labRangeLow: 44,
    labRangeHigh: 147,
    optimalLow: 44,
    optimalHigh: 100,
    description: 'Enzyme in liver, bile ducts, and bone — marker of biliary obstruction.',
    interpretation:
      'Optimal 44–100 U/L. Isolated elevation with normal ALT/AST may suggest biliary disease or bone disorders. Rising ALP is an early indicator of primary biliary cholangitis.',
  },
  {
    id: 'transferrin_saturation',
    name: 'Transferrin Saturation',
    category: 'vitamins',
    unit: '%',
    labRangeLow: 15,
    labRangeHigh: 45,
    optimalLow: 25,
    optimalHigh: 40,
    description: 'Percentage of transferrin binding sites occupied by iron.',
    interpretation:
      'Optimal 25–40%. Below 15% indicates iron deficiency even if ferritin is normal. Above 45% may suggest hemochromatosis. Best fasting morning test.',
  },
  {
    id: 'tibc',
    name: 'TIBC',
    category: 'vitamins',
    unit: 'μg/dL',
    labRangeLow: 250,
    labRangeHigh: 370,
    optimalLow: 250,
    optimalHigh: 340,
    description: 'Total iron binding capacity — reflects transferrin levels and iron status.',
    interpretation:
      'TIBC rises when iron stores are low (body makes more transferrin to capture iron). TIBC >400 confirms iron deficiency. Low TIBC with high ferritin may indicate inflammation.',
  },
  {
    id: 'shbg',
    name: 'SHBG',
    category: 'hormones',
    unit: 'nmol/L',
    labRangeLow: 16,
    labRangeHigh: 55,
    optimalLow: 20,
    optimalHigh: 40,
    description: 'Sex hormone binding globulin — binds testosterone and estrogen, limiting free fraction.',
    interpretation:
      'High SHBG (>55) reduces free testosterone and estrogen, causing symptoms even with "normal" total levels. Liver disease, thyroid issues, and aging raise SHBG. Low SHBG often seen with insulin resistance.',
  },
  {
    id: 'igf1',
    name: 'IGF-1',
    category: 'hormones',
    unit: 'ng/mL',
    labRangeLow: 80,
    labRangeHigh: 300,
    optimalLow: 150,
    optimalHigh: 250,
    description: 'Insulin-like growth factor 1 — mediates GH effects, muscle and bone anabolism.',
    interpretation:
      'Optimal 150–250 ng/mL for adults. Declines with age. Very high (>300) increases cancer risk. Low (<100) associated with frailty, poor recovery, and osteoporosis.',
  },
  {
    id: 'creatine_kinase',
    name: 'Creatine Kinase (CK)',
    category: 'cardiac',
    unit: 'U/L',
    labRangeLow: 30,
    labRangeHigh: 200,
    optimalLow: 30,
    optimalHigh: 170,
    description: 'Muscle enzyme — elevated after exercise-induced muscle damage or cardiac events.',
    interpretation:
      'Athletes may run 200–500 U/L normally after training. Baseline >200 at rest suggests muscle disease. CK-MB isoform specifically indicates cardiac muscle damage.',
  },
  {
    id: 'sodium',
    name: 'Sodium',
    category: 'kidney',
    unit: 'mEq/L',
    labRangeLow: 136,
    labRangeHigh: 145,
    optimalLow: 138,
    optimalHigh: 143,
    description: 'Primary extracellular electrolyte — fluid balance and nerve function.',
    interpretation:
      'Optimal 138–143 mEq/L. Hyponatremia (<136) causes fatigue, confusion. Hypernatremia (>145) indicates dehydration. Low-carb dieters may lose sodium rapidly — supplement accordingly.',
  },
  {
    id: 'potassium',
    name: 'Potassium',
    category: 'kidney',
    unit: 'mEq/L',
    labRangeLow: 3.5,
    labRangeHigh: 5.0,
    optimalLow: 4.0,
    optimalHigh: 4.8,
    description: 'Primary intracellular electrolyte — heart rhythm and muscle function.',
    interpretation:
      'Optimal 4.0–4.8 mEq/L. Low K (<3.5) causes arrhythmia, muscle weakness. High K (>5.5) dangerous in kidney disease. Most adults are chronically under-consuming potassium (need 4700 mg/day).',
  },
  {
    id: 'calcium',
    name: 'Calcium (Total)',
    category: 'kidney',
    unit: 'mg/dL',
    labRangeLow: 8.5,
    labRangeHigh: 10.5,
    optimalLow: 9.0,
    optimalHigh: 10.0,
    description: 'Total serum calcium — bone, nerve, and muscle function.',
    interpretation:
      'Optimal 9.0–10.0 mg/dL. Hypercalcemia (>10.5) may indicate hyperparathyroidism or vitamin D toxicity. Low calcium triggers PTH release to pull calcium from bones — check vitamin D.',
  },
  {
    id: 'phosphorus',
    name: 'Phosphorus',
    category: 'kidney',
    unit: 'mg/dL',
    labRangeLow: 2.5,
    labRangeHigh: 4.5,
    optimalLow: 3.0,
    optimalHigh: 4.0,
    description: 'Essential mineral for bone, energy (ATP), and acid-base balance.',
    interpretation:
      'Optimal 3.0–4.0 mg/dL. High phosphorus in CKD accelerates vascular calcification. Low phosphorus (hypophosphatemia) causes muscle weakness and bone pain — common in malabsorption.',
  },
  {
    id: 'bicarbonate',
    name: 'Bicarbonate (CO2)',
    category: 'kidney',
    unit: 'mEq/L',
    labRangeLow: 22,
    labRangeHigh: 29,
    optimalLow: 24,
    optimalHigh: 28,
    description: 'Serum bicarbonate — acid-base balance indicator.',
    interpretation:
      'Optimal 24–28 mEq/L. Low bicarbonate (metabolic acidosis) occurs in CKD, diabetes, ketogenic dieting. Chronic low-grade acidosis accelerates muscle loss and bone resorption.',
  },
  {
    id: 'chloride',
    name: 'Chloride',
    category: 'kidney',
    unit: 'mEq/L',
    labRangeLow: 98,
    labRangeHigh: 106,
    optimalLow: 100,
    optimalHigh: 106,
    description: 'Electrolyte for acid-base balance and fluid distribution.',
    interpretation:
      'Optimal 100–106 mEq/L. Follows sodium in most disorders. Low chloride seen in vomiting. High chloride may indicate metabolic acidosis. Part of routine metabolic panel.',
  },
  {
    id: 'glucose_pp',
    name: 'Glucose (2hr PP)',
    category: 'metabolic',
    unit: 'mg/dL',
    labRangeLow: 0,
    labRangeHigh: 139,
    optimalLow: 0,
    optimalHigh: 110,
    description: 'Post-meal glucose at 2 hours — tests carbohydrate tolerance.',
    interpretation:
      'Optimal <110 mg/dL at 2 hours post-meal. 140–199 = impaired glucose tolerance. ≥200 = diabetic. Continuous glucose monitoring (CGM) provides more detail throughout the day.',
  },
  {
    id: 'c_peptide',
    name: 'C-Peptide',
    category: 'metabolic',
    unit: 'ng/mL',
    labRangeLow: 0.8,
    labRangeHigh: 3.1,
    optimalLow: 1.0,
    optimalHigh: 2.0,
    description: 'Beta-cell function marker — co-secreted with insulin.',
    interpretation:
      'Optimal 1.0–2.0 ng/mL. Distinguishes type 1 (low C-peptide) from type 2 (high C-peptide) diabetes. Elevated C-peptide confirms endogenous insulin overproduction (insulin resistance).',
  },
  {
    id: 'glycomark',
    name: 'Fructosamine',
    category: 'metabolic',
    unit: 'μmol/L',
    labRangeLow: 190,
    labRangeHigh: 270,
    optimalLow: 190,
    optimalHigh: 240,
    description: 'Short-term glycemic control marker (~2–3 weeks).',
    interpretation:
      'Optimal <240 μmol/L. Useful when HbA1c is unreliable (hemolytic anemia, hemoglobin variants). Reflects recent dietary changes faster than HbA1c.',
  },
  {
    id: 'lh',
    name: 'LH',
    category: 'hormones',
    unit: 'IU/L',
    labRangeLow: 1.5,
    labRangeHigh: 9.3,
    optimalLow: 2.0,
    optimalHigh: 8.0,
    description: 'Luteinizing hormone — regulates ovulation in women, testosterone in men.',
    interpretation:
      'In men, LH drives testicular testosterone production. Optimal 2–8 IU/L. Low LH with low testosterone = secondary hypogonadism (pituitary issue). High LH + low T = primary hypogonadism.',
  },
  {
    id: 'fsh',
    name: 'FSH',
    category: 'hormones',
    unit: 'IU/L',
    labRangeLow: 1.5,
    labRangeHigh: 12.4,
    optimalLow: 2.0,
    optimalHigh: 8.0,
    description: 'Follicle stimulating hormone — gamete maturation and reproductive function.',
    interpretation:
      'Elevated FSH (>12) in women indicates declining ovarian reserve. In men, elevated FSH with low testosterone and small testes = primary testicular failure. Normal varies by cycle phase in women.',
  },
  {
    id: 'prolactin',
    name: 'Prolactin',
    category: 'hormones',
    unit: 'ng/mL',
    labRangeLow: 2,
    labRangeHigh: 18,
    optimalLow: 2,
    optimalHigh: 15,
    description: 'Pituitary hormone that suppresses testosterone and libido when elevated.',
    interpretation:
      'Optimal <15 ng/mL. Elevated prolactin (hyperprolactinemia) lowers LH, FSH, and testosterone/estrogen. Causes: pituitary adenoma, medications (SSRIs, antipsychotics), hypothyroidism, stress.',
  },
  {
    id: 'amh',
    name: 'AMH',
    category: 'hormones',
    unit: 'ng/mL',
    labRangeLow: 0.9,
    labRangeHigh: 9.5,
    optimalLow: 2.0,
    optimalHigh: 6.8,
    description: 'Anti-Müllerian hormone — ovarian reserve marker for women.',
    interpretation:
      'Optimal 2.0–6.8 ng/mL (reproductive age women). Declines with age — key marker of egg quantity. Very high (>9.5) may indicate PCOS. Not affected by birth control or cycle phase.',
  },
  {
    id: 'copper',
    name: 'Copper (Serum)',
    category: 'vitamins',
    unit: 'μg/dL',
    labRangeLow: 70,
    labRangeHigh: 140,
    optimalLow: 80,
    optimalHigh: 120,
    description: 'Essential trace mineral for iron metabolism, collagen, and nervous system.',
    interpretation:
      'Optimal 80–120 μg/dL. Excess zinc supplementation depletes copper. High copper (estrogen elevates it) competes with zinc. Deficiency impairs iron utilization and causes neurological issues.',
  },
  {
    id: 'selenium',
    name: 'Selenium',
    category: 'vitamins',
    unit: 'μg/L',
    labRangeLow: 70,
    labRangeHigh: 150,
    optimalLow: 100,
    optimalHigh: 140,
    description: 'Antioxidant mineral essential for thyroid hormone conversion and immune function.',
    interpretation:
      'Optimal 100–140 μg/L. Selenium is essential for T4→T3 conversion and glutathione peroxidase function. Deficiency worsens Hashimoto\'s. Brazil nuts (1–2/day) or 200 μg supplement.',
    higherIsBetter: true,
  },
  {
    id: 'omega3_index',
    name: 'Omega-3 Index',
    category: 'inflammatory',
    unit: '%',
    labRangeLow: 4,
    labRangeHigh: 12,
    optimalLow: 8,
    optimalHigh: 12,
    description: 'EPA+DHA as percentage of total RBC fatty acids — cardiovascular risk marker.',
    interpretation:
      'Optimal 8–12%. <4% = high cardiac risk. 4–8% = intermediate risk. ≥8% reduces cardiovascular events by ~30%. Requires 2–4g EPA+DHA daily to reach optimal range.',
    higherIsBetter: true,
  },
  {
    id: 'oxalate_urine',
    name: 'Oxalate (Urine 24hr)',
    category: 'kidney',
    unit: 'mg/day',
    labRangeLow: 0,
    labRangeHigh: 40,
    optimalLow: 0,
    optimalHigh: 25,
    description: 'Urinary oxalate — kidney stone risk marker.',
    interpretation:
      'Optimal <25 mg/day. High oxalate diet (spinach, nuts, chocolate) combined with low calcium intake and dehydration dramatically raises kidney stone risk. B6 and magnesium reduce oxalate production.',
  },
  {
    id: 'dheas_f',
    name: 'DHEA-S (Female)',
    category: 'hormones',
    unit: 'μg/dL',
    labRangeLow: 35,
    labRangeHigh: 430,
    optimalLow: 150,
    optimalHigh: 350,
    description: 'Adrenal androgen in women — precursor to testosterone.',
    interpretation:
      'Optimal 150–350 μg/dL in premenopausal women. Elevated DHEA-S (>430) may indicate PCOS or adrenal tumor. Low DHEA-S predicts fatigue, low libido, and accelerated aging.',
  },
  {
    id: 'ige_total',
    name: 'IgE (Total)',
    category: 'inflammatory',
    unit: 'IU/mL',
    labRangeLow: 0,
    labRangeHigh: 100,
    optimalLow: 0,
    optimalHigh: 40,
    description: 'Total immunoglobulin E — allergic sensitization and atopy marker.',
    interpretation:
      'Optimal <40 IU/mL. Elevated total IgE suggests allergic disease or parasitic infection. Specific IgE tests identify individual allergens. Gut dysbiosis and early life exposures drive atopy.',
  },
  {
    id: 'lp_pla2',
    name: 'Lp-PLA2',
    category: 'cardiac',
    unit: 'ng/mL',
    labRangeLow: 0,
    labRangeHigh: 200,
    optimalLow: 0,
    optimalHigh: 123,
    description: 'Lipoprotein-associated phospholipase A2 — vascular inflammation and plaque vulnerability marker.',
    interpretation:
      'Optimal <123 ng/mL. Elevated Lp-PLA2 predicts unstable plaque and is a strong independent predictor of stroke and cardiac events, independent of CRP.',
  },
  {
    id: 'mpo',
    name: 'MPO (Myeloperoxidase)',
    category: 'cardiac',
    unit: 'pmol/L',
    labRangeLow: 0,
    labRangeHigh: 470,
    optimalLow: 0,
    optimalHigh: 300,
    description: 'Neutrophil enzyme — oxidative stress and plaque destabilization marker.',
    interpretation:
      'Optimal <300 pmol/L. MPO is released by activated neutrophils and oxidizes LDL cholesterol into its atherogenic form. Elevated MPO predicts MI risk independent of Framingham score.',
  },
]

// ─── Flag Markers ──────────────────────────────────────────────────────────────

export interface FlaggedMarker {
  marker: LabMarker
  value: number
  severity: MarkerSeverity
  message: string
}

export function flagMarkers(values: Record<string, number>): FlaggedMarker[] {
  const flagged: FlaggedMarker[] = []

  for (const [id, value] of Object.entries(values)) {
    const marker = LAB_MARKERS.find((m) => m.id === id)
    if (!marker || value == null || isNaN(value)) continue

    let severity: MarkerSeverity
    let message: string

    const inLabRange = value >= marker.labRangeLow && value <= marker.labRangeHigh
    const inOptimal = value >= marker.optimalLow && value <= marker.optimalHigh

    if (inOptimal) {
      severity = 'optimal'
      message = `${value} ${marker.unit} — within optimal range (${marker.optimalLow}–${marker.optimalHigh})`
    } else if (inLabRange) {
      severity = 'normal_not_optimal'
      message = `${value} ${marker.unit} — normal but not optimal (optimal: ${marker.optimalLow}–${marker.optimalHigh})`
    } else {
      severity = 'out_of_range'
      const direction = value < marker.labRangeLow ? 'below' : 'above'
      message = `${value} ${marker.unit} — ${direction} lab reference range`
    }

    flagged.push({ marker, value, severity, message })
  }

  return flagged
}

// ─── Lab Health Score ──────────────────────────────────────────────────────────

const CATEGORY_WEIGHTS: Record<LabCategory, number> = {
  metabolic: 0.20,
  lipids: 0.18,
  inflammatory: 0.15,
  cardiac: 0.12,
  thyroid: 0.08,
  hormones: 0.07,
  vitamins: 0.08,
  cbc: 0.05,
  kidney: 0.05,
  liver: 0.02,
}

function scoreMarker(marker: LabMarker, value: number): number {
  const { optimalLow, optimalHigh, labRangeLow, labRangeHigh } = marker

  if (value >= optimalLow && value <= optimalHigh) return 100

  // Score based on distance from optimal range
  const optimalMid = (optimalLow + optimalHigh) / 2
  const labSpan = labRangeHigh - labRangeLow

  if (value < optimalLow) {
    const gap = optimalLow - value
    const maxGap = optimalLow - labRangeLow
    if (maxGap <= 0) return value < labRangeLow ? 0 : 50
    const score = Math.max(0, 70 - (gap / maxGap) * 70)
    return value < labRangeLow ? Math.max(0, score - 30) : score
  } else {
    const gap = value - optimalHigh
    const maxGap = labRangeHigh - optimalHigh
    if (maxGap <= 0) return value > labRangeHigh ? 0 : 50
    const score = Math.max(0, 70 - (gap / maxGap) * 70)
    return value > labRangeHigh ? Math.max(0, score - 30) : score
  }
}

export function calculateLabHealthScore(values: Record<string, number>): {
  overall: number
  byCategory: Record<string, number>
  sampleSize: number
} {
  const categoryScores: Record<string, number[]> = {}

  for (const [id, value] of Object.entries(values)) {
    if (value == null || isNaN(value)) continue
    const marker = LAB_MARKERS.find((m) => m.id === id)
    if (!marker) continue
    if (!categoryScores[marker.category]) categoryScores[marker.category] = []
    categoryScores[marker.category].push(scoreMarker(marker, value))
  }

  if (Object.keys(categoryScores).length === 0) return { overall: 0, byCategory: {}, sampleSize: 0 }

  const byCategory: Record<string, number> = {}
  let weightedSum = 0
  let totalWeight = 0

  for (const [cat, scores] of Object.entries(categoryScores)) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    byCategory[cat] = Math.round(avg)
    const weight = CATEGORY_WEIGHTS[cat as LabCategory] ?? 0.05
    weightedSum += avg * weight
    totalWeight += weight
  }

  const overall = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
  const sampleSize = Object.values(values).filter((v) => v != null && !isNaN(v)).length

  return { overall, byCategory, sampleSize }
}

// ─── Biomarker Trend ───────────────────────────────────────────────────────────

export interface TrendResult {
  direction: 'improving' | 'stable' | 'declining'
  delta: number
  deltaPercent: number
  significance: 'low' | 'moderate' | 'high'
}

export function biomarkerTrend(
  history: { date: string; value: number }[],
  markerId?: string,
): TrendResult {
  if (history.length < 2) {
    return { direction: 'stable', delta: 0, deltaPercent: 0, significance: 'low' }
  }

  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date))
  const marker = markerId ? LAB_MARKERS.find((m) => m.id === markerId) : undefined

  // Linear regression for trend
  const n = sorted.length
  const xMean = (n - 1) / 2
  const yMean = sorted.reduce((s, p) => s + p.value, 0) / n
  let num = 0
  let den = 0
  sorted.forEach((p, i) => {
    num += (i - xMean) * (p.value - yMean)
    den += (i - xMean) ** 2
  })
  const slope = den !== 0 ? num / den : 0

  const first = sorted[0].value
  const last = sorted[sorted.length - 1].value
  const delta = last - first
  const deltaPercent = first !== 0 ? (delta / Math.abs(first)) * 100 : 0

  // Determine if direction is "good" based on marker type
  const higherIsBetter = marker?.higherIsBetter ?? false
  const isImproving = higherIsBetter ? slope > 0 : slope < 0

  // Significance based on magnitude
  const absDeltaPercent = Math.abs(deltaPercent)
  let significance: TrendResult['significance'] = 'low'
  if (absDeltaPercent > 20) significance = 'high'
  else if (absDeltaPercent > 8) significance = 'moderate'

  const direction: TrendResult['direction'] =
    Math.abs(slope) < 0.01 || absDeltaPercent < 2
      ? 'stable'
      : isImproving
        ? 'improving'
        : 'declining'

  return { direction, delta: Math.round(delta * 100) / 100, deltaPercent: Math.round(deltaPercent * 10) / 10, significance }
}

// ─── Marker Interpretation ────────────────────────────────────────────────────

export function getMarkerInterpretation(markerId: string, value: number): string {
  const marker = LAB_MARKERS.find((m) => m.id === markerId)
  if (!marker) return 'No interpretation available for this marker.'

  const flagged = flagMarkers({ [markerId]: value })
  const flag = flagged[0]
  if (!flag) return marker.interpretation

  const prefix =
    flag.severity === 'optimal'
      ? '✅ Optimal: '
      : flag.severity === 'normal_not_optimal'
        ? '🟡 Normal (not optimal): '
        : '🔴 Out of range: '

  return `${prefix}${flag.message}. ${marker.interpretation}`
}

// ─── Category Display Names ────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<LabCategory, string> = {
  metabolic: 'Metabolic',
  lipids: 'Lipids & Cardiovascular',
  cbc: 'Complete Blood Count',
  thyroid: 'Thyroid',
  hormones: 'Hormones',
  vitamins: 'Vitamins & Minerals',
  inflammatory: 'Inflammatory',
  cardiac: 'Cardiac',
  kidney: 'Kidney',
  liver: 'Liver',
}

export const CATEGORY_ICONS: Record<LabCategory, string> = {
  metabolic: '🩸',
  lipids: '💓',
  cbc: '🔬',
  thyroid: '🦋',
  hormones: '⚡',
  vitamins: '💊',
  inflammatory: '🔥',
  cardiac: '❤️',
  kidney: '🫘',
  liver: '🫀',
}
