export interface BiomarkerRef {
  name: string
  shortName: string
  unit: string
  category: string
  description: string
  standardLow?: number
  standardHigh?: number
  optimalLow?: number
  optimalHigh?: number
  lowerIsBetter?: boolean
  criticalLow?: number
  criticalHigh?: number
}

export const BIOMARKERS: Record<string, BiomarkerRef> = {
  // Blood Sugar
  'glucose_fasting': { name: 'Fasting Glucose', shortName: 'Glucose', unit: 'mg/dL', category: 'Metabolic', description: 'Blood sugar after 8h fast', standardLow: 70, standardHigh: 100, optimalLow: 72, optimalHigh: 90, criticalLow: 50, criticalHigh: 400 },
  'hba1c': { name: 'HbA1c', shortName: 'HbA1c', unit: '%', category: 'Metabolic', description: '3-month average blood sugar', standardHigh: 5.7, optimalHigh: 5.3, criticalHigh: 6.4 },
  'insulin_fasting': { name: 'Fasting Insulin', shortName: 'Insulin', unit: 'μIU/mL', category: 'Metabolic', description: 'Fasting insulin level (insulin resistance marker)', standardHigh: 25, optimalHigh: 8, lowerIsBetter: true },
  // Lipids
  'ldl': { name: 'LDL Cholesterol', shortName: 'LDL', unit: 'mg/dL', category: 'Lipids', description: 'Low-density lipoprotein', standardHigh: 100, optimalHigh: 70, lowerIsBetter: true, criticalHigh: 190 },
  'hdl': { name: 'HDL Cholesterol', shortName: 'HDL', unit: 'mg/dL', category: 'Lipids', description: 'High-density lipoprotein (protective)', standardLow: 40, optimalLow: 60 },
  'triglycerides': { name: 'Triglycerides', shortName: 'Trigs', unit: 'mg/dL', category: 'Lipids', description: 'Blood fats', standardHigh: 150, optimalHigh: 100, lowerIsBetter: true, criticalHigh: 500 },
  'total_cholesterol': { name: 'Total Cholesterol', shortName: 'Chol', unit: 'mg/dL', category: 'Lipids', description: 'Total cholesterol', standardHigh: 200, optimalHigh: 180, criticalHigh: 300 },
  // CBC
  'hemoglobin': { name: 'Hemoglobin', shortName: 'Hgb', unit: 'g/dL', category: 'CBC', description: 'Oxygen-carrying protein in red blood cells', standardLow: 12, standardHigh: 17, optimalLow: 13.5, optimalHigh: 16 },
  'hematocrit': { name: 'Hematocrit', shortName: 'Hct', unit: '%', category: 'CBC', description: 'Percentage of red blood cells', standardLow: 37, standardHigh: 52 },
  'wbc': { name: 'White Blood Cells', shortName: 'WBC', unit: 'K/μL', category: 'CBC', description: 'Immune cells', standardLow: 4.5, standardHigh: 11, optimalLow: 5, optimalHigh: 8 },
  'platelets': { name: 'Platelets', shortName: 'PLT', unit: 'K/μL', category: 'CBC', description: 'Blood clotting cells', standardLow: 150, standardHigh: 400, criticalLow: 50, criticalHigh: 600 },
  // Inflammation
  'crp_hs': { name: 'hsCRP', shortName: 'hsCRP', unit: 'mg/L', category: 'Inflammation', description: 'High-sensitivity C-reactive protein (inflammation)', standardHigh: 3.0, optimalHigh: 1.0, lowerIsBetter: true, criticalHigh: 10 },
  'homocysteine': { name: 'Homocysteine', shortName: 'Hcy', unit: 'μmol/L', category: 'Inflammation', description: 'Cardiovascular risk marker', standardHigh: 15, optimalHigh: 10, lowerIsBetter: true },
  // Vitamins & Minerals
  'vitamin_d': { name: 'Vitamin D (25-OH)', shortName: 'Vit D', unit: 'ng/mL', category: 'Vitamins', description: 'Sunshine vitamin', standardLow: 20, optimalLow: 40, optimalHigh: 80, criticalLow: 10 },
  'vitamin_b12': { name: 'Vitamin B12', shortName: 'B12', unit: 'pg/mL', category: 'Vitamins', description: 'Essential for nerve and blood cell health', standardLow: 200, optimalLow: 500, optimalHigh: 1000 },
  'folate': { name: 'Folate', shortName: 'Folate', unit: 'ng/mL', category: 'Vitamins', description: 'B vitamin for cell division', standardLow: 4, optimalLow: 10 },
  'ferritin': { name: 'Ferritin', shortName: 'Ferritin', unit: 'ng/mL', category: 'Iron', description: 'Iron storage protein', standardLow: 12, standardHigh: 300, optimalLow: 50, optimalHigh: 150 },
  'iron': { name: 'Serum Iron', shortName: 'Iron', unit: 'μg/dL', category: 'Iron', description: 'Circulating iron', standardLow: 60, standardHigh: 170, optimalLow: 80, optimalHigh: 130 },
  // Thyroid
  'tsh': { name: 'TSH', shortName: 'TSH', unit: 'mIU/L', category: 'Thyroid', description: 'Thyroid stimulating hormone', standardLow: 0.4, standardHigh: 4.0, optimalLow: 1.0, optimalHigh: 2.5 },
  'free_t4': { name: 'Free T4', shortName: 'fT4', unit: 'ng/dL', category: 'Thyroid', description: 'Active thyroid hormone', standardLow: 0.8, standardHigh: 1.8, optimalLow: 1.0, optimalHigh: 1.6 },
  'free_t3': { name: 'Free T3', shortName: 'fT3', unit: 'pg/mL', category: 'Thyroid', description: 'Most active thyroid hormone', standardLow: 2.3, standardHigh: 4.2, optimalLow: 3.0, optimalHigh: 4.0 },
  // Hormones
  'testosterone_total': { name: 'Total Testosterone', shortName: 'Testosterone', unit: 'ng/dL', category: 'Hormones', description: 'Primary sex hormone (male)', standardLow: 300, optimalLow: 500, optimalHigh: 900 },
  'cortisol_am': { name: 'Cortisol (AM)', shortName: 'Cortisol', unit: 'μg/dL', category: 'Hormones', description: 'Stress hormone, highest in morning', standardLow: 6, standardHigh: 23, optimalLow: 10, optimalHigh: 18 },
  // Liver
  'alt': { name: 'ALT', shortName: 'ALT', unit: 'U/L', category: 'Liver', description: 'Liver enzyme', standardHigh: 56, optimalHigh: 30, lowerIsBetter: true, criticalHigh: 200 },
  'ast': { name: 'AST', shortName: 'AST', unit: 'U/L', category: 'Liver', description: 'Liver/heart enzyme', standardHigh: 40, optimalHigh: 25, lowerIsBetter: true, criticalHigh: 150 },
  // Kidney
  'creatinine': { name: 'Creatinine', shortName: 'Creat', unit: 'mg/dL', category: 'Kidney', description: 'Kidney function marker', standardLow: 0.6, standardHigh: 1.2, optimalLow: 0.7, optimalHigh: 1.1 },
  'egfr': { name: 'eGFR', shortName: 'eGFR', unit: 'mL/min', category: 'Kidney', description: 'Estimated glomerular filtration rate', standardLow: 60, optimalLow: 90, criticalLow: 30 },
}

export type RangeStatus = 'optimal' | 'normal' | 'suboptimal' | 'critical' | 'unknown'

export function getRangeStatus(biomarkerKey: string, value: number): RangeStatus {
  const ref = BIOMARKERS[biomarkerKey]
  if (!ref) return 'unknown'

  // Critical check first
  if (ref.criticalLow !== undefined && value < ref.criticalLow) return 'critical'
  if (ref.criticalHigh !== undefined && value > ref.criticalHigh) return 'critical'

  // Optimal range
  const inOptimalLow = ref.optimalLow === undefined || value >= ref.optimalLow
  const inOptimalHigh = ref.optimalHigh === undefined || value <= ref.optimalHigh
  if (inOptimalLow && inOptimalHigh) return 'optimal'

  // Standard range
  const inStandardLow = ref.standardLow === undefined || value >= ref.standardLow
  const inStandardHigh = ref.standardHigh === undefined || value <= ref.standardHigh
  if (inStandardLow && inStandardHigh) return 'normal'

  return 'suboptimal'
}

export function getStatusColor(status: RangeStatus): string {
  switch (status) {
    case 'optimal': return 'text-green-600 bg-green-50 border-green-200'
    case 'normal': return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'suboptimal': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'critical': return 'text-red-600 bg-red-50 border-red-200'
    default: return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

export function getStatusLabel(status: RangeStatus): string {
  switch (status) {
    case 'optimal': return '✅ Optimal'
    case 'normal': return '🔵 Normal'
    case 'suboptimal': return '⚠️ Suboptimal'
    case 'critical': return '🚨 Critical'
    default: return '—'
  }
}
