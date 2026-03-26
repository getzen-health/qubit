/**
 * Travel Health Calculations
 *
 * References:
 * - Eastman 2005 Sleep Med Rev: eastward jet lag worse than westward (phase advance harder)
 * - Burgess 2004 J Biol Rhythms: light therapy timing for phase shift
 * - Herxheimer 2002 Cochrane: melatonin 0.5-5mg at destination bedtime reduces jet lag
 * - Luks 2017 High Alt Med Biol: AMS prevention, diamox 125mg BID
 * - Kakkos 2018 Cochrane: compression socks reduce DVT 90% on flights >4h
 */

// ─────────────────────────────────────────────────────────────────────────────
// JET LAG CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────

export interface RecoveryDay {
  day: number
  sleepWindow: string
  lightTherapy: string
  melatonin: string
  action: string
}

export interface JetLagResult {
  timezonesDelta: number
  direction: 'east' | 'west' | 'none'
  daysToAdapt: number
  severity: 'mild' | 'moderate' | 'severe'
  recoverySchedule: RecoveryDay[]
}

/**
 * Calculate jet lag burden and produce a day-by-day recovery schedule.
 * Eastward travel requires phase advance (harder); westward requires phase delay.
 * Rule: ~1 day per timezone crossed to fully adapt.
 */
export function calculateJetLag(
  departureTimezone: string,
  arrivalTimezone: string,
  _departureDate: string,
  direction?: 'east' | 'west'
): JetLagResult {
  const depOffset = tzOffsetHours(departureTimezone)
  const arrOffset = tzOffsetHours(arrivalTimezone)

  let delta = arrOffset - depOffset
  // Normalise into [-12, 12]
  if (delta > 12) delta -= 24
  if (delta < -12) delta += 24

  const timezonesDelta = Math.abs(delta)
  const inferredDirection: 'east' | 'west' | 'none' =
    direction ?? (delta > 0 ? 'east' : delta < 0 ? 'west' : 'none')

  const daysToAdapt = timezonesDelta === 0 ? 0 : Math.ceil(timezonesDelta)
  const severity: JetLagResult['severity'] =
    timezonesDelta <= 3 ? 'mild' : timezonesDelta <= 6 ? 'moderate' : 'severe'

  const recoverySchedule: RecoveryDay[] = []

  for (let day = 1; day <= Math.min(daysToAdapt, 7); day++) {
    const progress = day / daysToAdapt // 0→1

    if (inferredDirection === 'east') {
      // Phase advance: shift sleep earlier each day
      const bedtimeHour = Math.round(23 - progress * timezonesDelta)
      const wakeHour = Math.round(7 - progress * timezonesDelta + 24) % 24
      recoverySchedule.push({
        day,
        sleepWindow: `${formatHour(bedtimeHour)} – ${formatHour(wakeHour)}`,
        lightTherapy: `Morning light at destination: ${formatHour(6 + Math.round(progress * 2))}–${formatHour(8 + Math.round(progress * 2))}`,
        melatonin: day <= 3 ? `0.5 mg at ${formatHour(bedtimeHour)} destination time` : 'Not required',
        action: `Day ${day}: Advance bedtime ${Math.round(progress * timezonesDelta)}h earlier. Seek bright light in the morning; avoid evening light.`,
      })
    } else if (inferredDirection === 'west') {
      // Phase delay: shift sleep later each day
      const bedtimeHour = Math.round(23 + progress * timezonesDelta) % 24
      const wakeHour = Math.round(7 + progress * timezonesDelta) % 24
      recoverySchedule.push({
        day,
        sleepWindow: `${formatHour(bedtimeHour)} – ${formatHour(wakeHour)}`,
        lightTherapy: `Evening light at destination: ${formatHour(18 + Math.round(progress))}–${formatHour(20 + Math.round(progress))}`,
        melatonin: day <= 3 ? `0.5 mg at ${formatHour(bedtimeHour)} destination time` : 'Not required',
        action: `Day ${day}: Delay bedtime ${Math.round(progress * timezonesDelta)}h later. Seek bright light in the evening; avoid morning light.`,
      })
    } else {
      recoverySchedule.push({
        day,
        sleepWindow: 'Normal',
        lightTherapy: 'Normal daylight exposure',
        melatonin: 'Not required',
        action: 'No jet lag adjustment needed.',
      })
    }
  }

  return { timezonesDelta, direction: inferredDirection, daysToAdapt, severity, recoverySchedule }
}

function tzOffsetHours(tz: string): number {
  // Accept "UTC+5:30", "UTC-7", "America/New_York" (approx), or numeric
  const match = tz.match(/([+-])(\d{1,2})(?::(\d{2}))?/)
  if (!match) return 0
  const sign = match[1] === '+' ? 1 : -1
  const h = parseInt(match[2], 10)
  const m = parseInt(match[3] ?? '0', 10)
  return sign * (h + m / 60)
}

function formatHour(h: number): string {
  const normalized = ((h % 24) + 24) % 24
  const suffix = normalized >= 12 ? 'PM' : 'AM'
  const display = normalized % 12 === 0 ? 12 : normalized % 12
  return `${display}:00 ${suffix}`
}

// ─────────────────────────────────────────────────────────────────────────────
// ALTITUDE / AMS RISK
// ─────────────────────────────────────────────────────────────────────────────

export interface AltitudeDay {
  day: number
  altitude: number
  action: string
  sleepAltitude: number
}

export interface AMSResult {
  lakeLouiseRisk: 'low' | 'moderate' | 'high'
  riskLabel: string
  schedule: AltitudeDay[]
  prevention: string[]
}

/**
 * Calculates AMS risk and generates a safe acclimatisation schedule.
 * Above 2500m: max 500m/day ascent for sleep altitude.
 * "Climb high, sleep low" principle applied.
 * Lake Louise Score: 0-3 none, 4-5 mild, 6+ severe.
 */
export function calculateAMSRisk(
  altitudeMeters: number,
  ascentRatePerDay: number,
  acclimatizationDays: number
): AMSResult {
  const RISK_THRESHOLD_LOW = 2500
  const RISK_THRESHOLD_HIGH = 3500
  const MAX_SAFE_ASCENT = 500

  let lakeLouiseRisk: AMSResult['lakeLouiseRisk'] = 'low'
  let riskLabel = 'Low Risk'

  if (altitudeMeters >= RISK_THRESHOLD_HIGH || ascentRatePerDay > MAX_SAFE_ASCENT) {
    lakeLouiseRisk = 'high'
    riskLabel = 'High Risk — Consider Diamox (125 mg BID) prophylaxis'
  } else if (altitudeMeters >= RISK_THRESHOLD_LOW) {
    lakeLouiseRisk = 'moderate'
    riskLabel = 'Moderate Risk — Acclimatise carefully'
  }

  const schedule: AltitudeDay[] = []
  const baseAltitude = Math.min(1500, altitudeMeters * 0.3)
  const totalAscent = altitudeMeters - baseAltitude
  const safeAscentPerDay = Math.min(ascentRatePerDay, MAX_SAFE_ASCENT)
  const requiredDays = Math.ceil(totalAscent / safeAscentPerDay) + acclimatizationDays

  let currentSleepAlt = baseAltitude
  for (let day = 1; day <= Math.min(requiredDays, 14); day++) {
    const isAcclimatizationDay = day % 3 === 0
    const dayAltitude = Math.min(
      baseAltitude + safeAscentPerDay * day,
      altitudeMeters + 300 // "climb high"
    )
    const sleepAlt = isAcclimatizationDay
      ? Math.max(currentSleepAlt - 200, baseAltitude) // "sleep low"
      : Math.min(currentSleepAlt + safeAscentPerDay, altitudeMeters)

    currentSleepAlt = sleepAlt

    schedule.push({
      day,
      altitude: Math.round(dayAltitude),
      sleepAltitude: Math.round(sleepAlt),
      action: isAcclimatizationDay
        ? `Rest day — descend to sleep at ${Math.round(sleepAlt)}m ("sleep low")`
        : `Ascend to ${Math.round(dayAltitude)}m, sleep at ${Math.round(sleepAlt)}m`,
    })
  }

  const prevention = [
    'Ascend no more than 500m/day above 2500m',
    '"Climb high, sleep low" — daytime ascents can exceed sleep altitude',
    'Hydrate well (3–4 L/day); avoid alcohol for first 48h at altitude',
    'Descend immediately if severe headache, vomiting, or ataxia develops',
  ]

  if (altitudeMeters >= 3000) {
    prevention.push('Consider Acetazolamide (Diamox) 125 mg twice daily starting 1 day before ascent')
  }
  if (altitudeMeters >= 4500) {
    prevention.push('Carry a portable hyperbaric bag (Gamow bag) if available')
    prevention.push('Pre-altitude medical clearance recommended')
  }

  return { lakeLouiseRisk, riskLabel, schedule, prevention }
}

// ─────────────────────────────────────────────────────────────────────────────
// VACCINATION DATABASE
// ─────────────────────────────────────────────────────────────────────────────

export interface Vaccine {
  id: string
  name: string
  targetDiseases: string[]
  routineVsTravel: 'routine' | 'travel' | 'both'
  countryTriggers: string[]
  dosesRequired: number
  scheduleWeeks: number[]
  notes: string
}

export const VACCINATION_DATABASE: Vaccine[] = [
  {
    id: 'yellow-fever',
    name: 'Yellow Fever',
    targetDiseases: ['Yellow Fever'],
    routineVsTravel: 'travel',
    countryTriggers: [
      'Brazil', 'Colombia', 'Peru', 'Ecuador', 'Venezuela', 'Bolivia', 'Paraguay',
      'Nigeria', 'Ghana', 'Kenya', 'Uganda', 'Cameroon', 'Congo', 'DRC',
      'Senegal', 'Ivory Coast', 'Ethiopia', 'Angola', 'Zambia',
    ],
    dosesRequired: 1,
    scheduleWeeks: [0],
    notes: 'Required for entry into many countries. Valid for life. Give ≥10 days before travel.',
  },
  {
    id: 'hep-a',
    name: 'Hepatitis A',
    targetDiseases: ['Hepatitis A'],
    routineVsTravel: 'both',
    countryTriggers: [
      'India', 'Nepal', 'Bangladesh', 'Pakistan', 'Sri Lanka',
      'Thailand', 'Vietnam', 'Cambodia', 'Indonesia', 'Philippines', 'Myanmar',
      'Egypt', 'Morocco', 'Tunisia', 'Kenya', 'Tanzania', 'Nigeria',
      'Mexico', 'Guatemala', 'Honduras', 'Peru', 'Bolivia',
    ],
    dosesRequired: 2,
    scheduleWeeks: [0, 26],
    notes: 'First dose 2 weeks before travel. Booster at 6–12 months confers lifelong protection.',
  },
  {
    id: 'hep-b',
    name: 'Hepatitis B',
    targetDiseases: ['Hepatitis B'],
    routineVsTravel: 'both',
    countryTriggers: [
      'China', 'India', 'Indonesia', 'Philippines', 'Vietnam', 'Thailand',
      'Cambodia', 'Laos', 'Myanmar', 'Mongolia', 'Africa (all)', 'Eastern Europe',
    ],
    dosesRequired: 3,
    scheduleWeeks: [0, 4, 24],
    notes: 'Accelerated schedule (0, 1, 2 months) available. Rapid schedule (0, 7, 21 days + 12-month booster) for last-minute travel.',
  },
  {
    id: 'typhoid',
    name: 'Typhoid',
    targetDiseases: ['Typhoid Fever'],
    routineVsTravel: 'travel',
    countryTriggers: [
      'India', 'Pakistan', 'Bangladesh', 'Nepal', 'Sri Lanka',
      'Thailand', 'Vietnam', 'Cambodia', 'Indonesia', 'Philippines',
      'Egypt', 'Ethiopia', 'Kenya', 'Nigeria', 'Ghana', 'Tanzania',
      'Mexico', 'Guatemala', 'Peru', 'Bolivia', 'Haiti',
    ],
    dosesRequired: 1,
    scheduleWeeks: [0],
    notes: 'Injectable (Vi polysaccharide) gives 60–80% protection for ~2 years. Oral (Ty21a): 4 doses every other day.',
  },
  {
    id: 'cholera',
    name: 'Cholera (Dukoral)',
    targetDiseases: ['Cholera', "Traveller's Diarrhoea (ETEC)"],
    routineVsTravel: 'travel',
    countryTriggers: [
      'India', 'Bangladesh', 'Haiti', 'DRC', 'Yemen', 'Nigeria',
      'Ethiopia', 'Somalia', 'Mozambique', 'Zimbabwe', 'Peru',
    ],
    dosesRequired: 2,
    scheduleWeeks: [0, 1],
    notes: 'Oral vaccine. 2 doses 1 week apart; finish ≥1 week before arrival. Also provides ~50% protection against ETEC diarrhoea.',
  },
  {
    id: 'rabies',
    name: 'Rabies Pre-Exposure',
    targetDiseases: ['Rabies'],
    routineVsTravel: 'travel',
    countryTriggers: [
      'India', 'Thailand', 'Vietnam', 'Indonesia', 'Philippines', 'Cambodia',
      'Nepal', 'Bangladesh', 'China', 'Myanmar', 'Pakistan',
      'Kenya', 'Ethiopia', 'Tanzania', 'Nigeria',
      'Mexico', 'Bolivia', 'Peru', 'Brazil',
    ],
    dosesRequired: 3,
    scheduleWeeks: [0, 1, 3],
    notes: 'Pre-exposure: 3 doses over 3–4 weeks. Does not eliminate post-exposure treatment but reduces required doses and urgency.',
  },
  {
    id: 'meningococcal',
    name: 'Meningococcal ACWY',
    targetDiseases: ['Meningococcal Disease (A, C, W, Y)'],
    routineVsTravel: 'both',
    countryTriggers: [
      'Saudi Arabia', 'Mali', 'Niger', 'Nigeria', 'Chad', 'Burkina Faso',
      'Sudan', 'Ethiopia', 'Senegal', 'Guinea', 'Cameroon',
    ],
    dosesRequired: 1,
    scheduleWeeks: [0],
    notes: 'Required for Hajj/Umrah pilgrims. "Meningitis belt" of sub-Saharan Africa Dec–June. Booster every 5 years.',
  },
  {
    id: 'japanese-encephalitis',
    name: 'Japanese Encephalitis',
    targetDiseases: ['Japanese Encephalitis'],
    routineVsTravel: 'travel',
    countryTriggers: [
      'India', 'Nepal', 'Sri Lanka', 'Thailand', 'Vietnam', 'Cambodia',
      'Laos', 'Myanmar', 'China', 'Japan', 'South Korea', 'Indonesia',
      'Philippines', 'Malaysia', 'Bangladesh', 'Papua New Guinea',
    ],
    dosesRequired: 2,
    scheduleWeeks: [0, 4],
    notes: 'Ixiaro: 2 doses 4 weeks apart. For travel ≥1 month to endemic rural areas, or shorter stays with extensive outdoor exposure.',
  },
  {
    id: 'tick-borne-encephalitis',
    name: 'Tick-borne Encephalitis (TBE)',
    targetDiseases: ['Tick-borne Encephalitis'],
    routineVsTravel: 'travel',
    countryTriggers: [
      'Russia', 'Germany', 'Austria', 'Switzerland', 'Czech Republic',
      'Poland', 'Hungary', 'Sweden', 'Finland', 'Baltic States',
      'Slovakia', 'Slovenia', 'Croatia', 'Ukraine', 'Belarus',
    ],
    dosesRequired: 3,
    scheduleWeeks: [0, 4, 52],
    notes: 'Rapid schedule: 0, 14 days. Booster at 1 year then every 3–5 years. Risk mainly April–November in forested areas.',
  },
  {
    id: 'malaria-atovaquone',
    name: 'Malaria — Atovaquone/Proguanil (Malarone)',
    targetDiseases: ['Malaria'],
    routineVsTravel: 'travel',
    countryTriggers: [
      'Kenya', 'Tanzania', 'Uganda', 'Rwanda', 'Ethiopia', 'Mozambique',
      'Malawi', 'Zimbabwe', 'Zambia', 'Ghana', 'Nigeria', 'Senegal',
      'India', 'Nepal', 'Thailand', 'Vietnam', 'Cambodia', 'Laos', 'Myanmar',
      'Indonesia', 'Philippines', 'Papua New Guinea', 'Peru', 'Brazil', 'Bolivia',
    ],
    dosesRequired: 0,
    scheduleWeeks: [],
    notes: 'Start 1–2 days before travel, take daily during, continue 7 days after. Fewer side effects; good for short trips.',
  },
  {
    id: 'malaria-doxycycline',
    name: 'Malaria — Doxycycline',
    targetDiseases: ['Malaria', 'Leptospirosis (partial)'],
    routineVsTravel: 'travel',
    countryTriggers: [
      'Sub-Saharan Africa', 'Southeast Asia', 'Papua New Guinea', 'Amazon Basin',
    ],
    dosesRequired: 0,
    scheduleWeeks: [],
    notes: 'Start 1–2 days before, daily during, continue 4 weeks after. Cheap option; photosensitivity risk. Not for pregnancy.',
  },
  {
    id: 'malaria-mefloquine',
    name: 'Malaria — Mefloquine (Lariam)',
    targetDiseases: ['Malaria'],
    routineVsTravel: 'travel',
    countryTriggers: [
      'Sub-Saharan Africa', 'Southeast Asia', 'Amazon Basin',
    ],
    dosesRequired: 0,
    scheduleWeeks: [],
    notes: 'Start 2–3 weeks before. Once weekly. Neuropsychiatric side effects possible; avoid in anxiety/depression history.',
  },
  {
    id: 'polio-booster',
    name: 'Polio Booster',
    targetDiseases: ['Poliomyelitis'],
    routineVsTravel: 'both',
    countryTriggers: [
      'Pakistan', 'Afghanistan', 'Nigeria', 'DRC', 'Papua New Guinea', 'Yemen',
    ],
    dosesRequired: 1,
    scheduleWeeks: [0],
    notes: 'Single adult booster if not received in last 10 years. Required for longer stays in endemic areas.',
  },
  {
    id: 'typhoid-vi',
    name: 'Typhoid Vi (injectable)',
    targetDiseases: ['Typhoid Fever'],
    routineVsTravel: 'travel',
    countryTriggers: [],
    dosesRequired: 1,
    scheduleWeeks: [0],
    notes: 'Alternative injectable form. Valid 3 years. See also oral Typhoid.',
  },
  {
    id: 'dengue-dengvaxia',
    name: 'Dengue (Dengvaxia)',
    targetDiseases: ['Dengue Fever'],
    routineVsTravel: 'travel',
    countryTriggers: [
      'Philippines', 'Brazil', 'Thailand', 'Indonesia', 'Vietnam',
      'Malaysia', 'India', 'Pakistan', 'Bangladesh', 'Sri Lanka',
    ],
    dosesRequired: 3,
    scheduleWeeks: [0, 26, 52],
    notes: 'Only for seropositive individuals aged 9–45 in endemic countries. Serology required before vaccination.',
  },
]

/**
 * Returns recommended vaccines for a given destination country.
 */
export function getRecommendedVaccines(destinationCountry: string): Vaccine[] {
  const country = destinationCountry.toLowerCase()
  return VACCINATION_DATABASE.filter(
    (v) =>
      v.countryTriggers.some((c) => c.toLowerCase().includes(country) || country.includes(c.toLowerCase())) ||
      v.routineVsTravel === 'routine'
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DVT RISK CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────

export interface DVTResult {
  riskLevel: 'low' | 'moderate' | 'high'
  riskScore: number
  preventionPlan: string[]
}

const DVT_RISK_FACTORS: Record<string, number> = {
  'Prior DVT or PE': 3,
  Pregnancy: 2,
  'Oral contraceptives / HRT': 2,
  Obesity: 1,
  'Recent surgery (< 4 weeks)': 3,
  'Active cancer': 3,
  'Immobility / paralysis': 2,
  Thrombophilia: 3,
  'Age > 60': 1,
  'Varicose veins': 1,
  Dehydration: 1,
  'Heart failure': 2,
}

export function calculateDVTRisk(flightHours: number, riskFactors: string[]): DVTResult {
  let score = 0
  if (flightHours >= 4) score += 1
  if (flightHours >= 8) score += 1
  if (flightHours >= 12) score += 1

  for (const factor of riskFactors) {
    score += DVT_RISK_FACTORS[factor] ?? 0
  }

  const riskLevel: DVTResult['riskLevel'] =
    score <= 2 ? 'low' : score <= 4 ? 'moderate' : 'high'

  const preventionPlan: string[] = [
    'Stay hydrated — drink water every hour; limit alcohol & caffeine',
    'Perform calf raises and ankle circles every 30 minutes',
    'Walk the aisle every 1–2 hours when seatbelt sign is off',
  ]

  if (flightHours >= 4) {
    preventionPlan.push('Wear graduated compression stockings (15–30 mmHg) — reduces DVT risk by ~90%')
  }

  if (riskLevel === 'moderate' || riskLevel === 'high') {
    preventionPlan.push('Choose an aisle seat for easier movement')
    preventionPlan.push('Avoid crossing legs and wearing tight clothing around thighs')
    preventionPlan.push('Consider aspirin 100 mg (if no contraindications) — discuss with doctor')
  }

  if (riskLevel === 'high') {
    preventionPlan.push('Consult GP before travel — low-molecular-weight heparin (LMWH) injection may be recommended')
    preventionPlan.push('Seek immediate care if you experience calf pain, swelling, or shortness of breath after flight')
  }

  return { riskLevel, riskScore: score, preventionPlan }
}

export const DVT_RISK_FACTOR_OPTIONS = Object.keys(DVT_RISK_FACTORS)

// ─────────────────────────────────────────────────────────────────────────────
// TRAVEL HEALTH KIT
// ─────────────────────────────────────────────────────────────────────────────

export type DestinationType = 'tropical' | 'cold' | 'altitude' | 'urban'

export interface KitItem {
  id: string
  name: string
  destinations: DestinationType[]
  category: string
  notes?: string
}

export const TRAVEL_HEALTH_KIT: KitItem[] = [
  // Medications — Universal
  { id: 'paracetamol', name: 'Paracetamol / Tylenol', destinations: ['tropical', 'cold', 'altitude', 'urban'], category: 'Medications' },
  { id: 'ibuprofen', name: 'Ibuprofen (NSAID)', destinations: ['tropical', 'cold', 'altitude', 'urban'], category: 'Medications', notes: 'Avoid at high altitude — may worsen AMS' },
  { id: 'oral-rehydration', name: 'Oral Rehydration Salts (ORS)', destinations: ['tropical', 'cold', 'altitude', 'urban'], category: 'Medications' },
  { id: 'antihistamine', name: 'Antihistamine (e.g., Cetirizine)', destinations: ['tropical', 'cold', 'altitude', 'urban'], category: 'Medications' },
  { id: 'antidiarrhoeal', name: 'Loperamide (Imodium)', destinations: ['tropical', 'cold', 'altitude', 'urban'], category: 'Medications' },
  { id: 'antacid', name: 'Antacid / Omeprazole', destinations: ['tropical', 'cold', 'altitude', 'urban'], category: 'Medications' },
  { id: 'melatonin', name: 'Melatonin 0.5 mg (jet lag)', destinations: ['tropical', 'cold', 'altitude', 'urban'], category: 'Medications' },
  // Tropical-specific medications
  { id: 'malaria-prophylaxis', name: 'Malaria Prophylaxis', destinations: ['tropical'], category: 'Medications', notes: 'Prescribed by doctor — Malarone, Doxycycline, or Mefloquine' },
  { id: 'azithromycin', name: 'Azithromycin (standby antibiotic)', destinations: ['tropical'], category: 'Medications', notes: 'For severe traveller\'s diarrhoea; doctor prescription required' },
  { id: 'antiparasitic', name: 'Antiparasitic (Tinidazole)', destinations: ['tropical'], category: 'Medications' },
  // Altitude-specific medications
  { id: 'acetazolamide', name: 'Acetazolamide (Diamox) 125 mg', destinations: ['altitude'], category: 'Medications', notes: 'AMS prevention; start 1 day before ascent. Check for sulfa allergy.' },
  { id: 'dexamethasone', name: 'Dexamethasone 4 mg (rescue only)', destinations: ['altitude'], category: 'Medications', notes: 'For HACE emergency use; doctor prescription required' },
  { id: 'nifedipine', name: 'Nifedipine 30 mg (rescue only)', destinations: ['altitude'], category: 'Medications', notes: 'For HAPE emergency use; doctor prescription required' },
  // Cold-specific medications
  { id: 'decongestant', name: 'Nasal Decongestant Spray', destinations: ['cold'], category: 'Medications' },
  { id: 'cough-mixture', name: 'Cough Mixture / Lozenges', destinations: ['cold'], category: 'Medications' },
  // Wound Care
  { id: 'antiseptic', name: 'Antiseptic Wipes / Betadine', destinations: ['tropical', 'cold', 'altitude', 'urban'], category: 'Wound Care' },
  { id: 'plasters', name: 'Assorted Plasters / Band-Aids', destinations: ['tropical', 'cold', 'altitude', 'urban'], category: 'Wound Care' },
  { id: 'gauze', name: 'Sterile Gauze & Bandage Roll', destinations: ['tropical', 'cold', 'altitude', 'urban'], category: 'Wound Care' },
  { id: 'tweezers', name: 'Tweezers & Tick Remover', destinations: ['tropical', 'cold', 'altitude', 'urban'], category: 'Wound Care' },
  { id: 'blister-pads', name: 'Blister Pads (Compeed)', destinations: ['altitude', 'cold'], category: 'Wound Care' },
  // Sun & Insect Protection
  { id: 'sunscreen', name: 'Sunscreen SPF 50+', destinations: ['tropical', 'altitude', 'urban'], category: 'Sun & Insect Protection', notes: 'SPF 50 essential at altitude — UV increases ~10% per 1000m' },
  { id: 'deet', name: 'DEET 30–50% Insect Repellent', destinations: ['tropical'], category: 'Sun & Insect Protection' },
  { id: 'permethrin', name: 'Permethrin Clothing Spray', destinations: ['tropical'], category: 'Sun & Insect Protection', notes: 'Treat clothing; lasts 6 weeks / 6 washes' },
  { id: 'mosquito-net', name: 'Insecticide-treated Bed Net', destinations: ['tropical'], category: 'Sun & Insect Protection' },
  { id: 'lip-balm-spf', name: 'SPF Lip Balm', destinations: ['altitude', 'cold'], category: 'Sun & Insect Protection' },
  // Water & Food Safety
  { id: 'water-purification', name: 'Water Purification Tablets (Iodine / Chlorine)', destinations: ['tropical', 'altitude'], category: 'Water & Food Safety' },
  { id: 'steripen', name: 'SteriPen UV Water Purifier', destinations: ['tropical', 'altitude'], category: 'Water & Food Safety' },
  { id: 'filter-straw', name: 'Portable Water Filter Straw', destinations: ['tropical', 'altitude'], category: 'Water & Food Safety' },
  { id: 'hand-sanitiser', name: 'Alcohol Hand Sanitiser ≥60%', destinations: ['tropical', 'cold', 'altitude', 'urban'], category: 'Water & Food Safety' },
  // Cold & Altitude Gear
  { id: 'thermal-layers', name: 'Thermal Base Layer Set', destinations: ['cold', 'altitude'], category: 'Clothing & Gear' },
  { id: 'hand-warmers', name: 'Chemical Hand Warmers', destinations: ['cold', 'altitude'], category: 'Clothing & Gear' },
  { id: 'compression-socks', name: 'Graduated Compression Socks', destinations: ['tropical', 'cold', 'altitude', 'urban'], category: 'Clothing & Gear', notes: 'Reduces DVT risk 90% on flights >4h' },
  { id: 'pulse-oximeter', name: 'Finger Pulse Oximeter', destinations: ['altitude'], category: 'Medical Devices', notes: 'SpO2 <85% at rest = descend immediately' },
  { id: 'altitude-tent', name: 'Pre-Acclimatisation Altitude Tent (optional)', destinations: ['altitude'], category: 'Medical Devices', notes: 'For expeditions above 5000m' },
  // Documents
  { id: 'vaccination-record', name: 'Vaccination Record (Yellow Card)', destinations: ['tropical', 'cold', 'altitude', 'urban'], category: 'Documents & Insurance' },
  { id: 'travel-insurance', name: 'Travel Insurance with Medical Evacuation', destinations: ['tropical', 'cold', 'altitude', 'urban'], category: 'Documents & Insurance' },
  { id: 'prescription-copies', name: 'Copies of Prescriptions', destinations: ['tropical', 'cold', 'altitude', 'urban'], category: 'Documents & Insurance' },
  { id: 'emergency-contacts', name: 'Emergency Contact List + Blood Type Card', destinations: ['tropical', 'cold', 'altitude', 'urban'], category: 'Documents & Insurance' },
  // Eyecare & Other
  { id: 'eye-drops', name: 'Lubricating Eye Drops', destinations: ['cold', 'altitude', 'urban'], category: 'Eye & Dental' },
  { id: 'dental-kit', name: 'Dental First Aid Kit', destinations: ['tropical', 'cold', 'altitude', 'urban'], category: 'Eye & Dental' },
  { id: 'thermometer', name: 'Digital Thermometer', destinations: ['tropical', 'cold', 'altitude', 'urban'], category: 'Medical Devices' },
  { id: 'n95-masks', name: 'N95 / FFP2 Masks (×10)', destinations: ['tropical', 'cold', 'altitude', 'urban'], category: 'Respiratory' },
  { id: 'earplugs', name: 'Earplugs (sleep & flight)', destinations: ['tropical', 'cold', 'altitude', 'urban'], category: 'Sleep' },
  { id: 'sleep-mask', name: 'Sleep Mask', destinations: ['tropical', 'cold', 'altitude', 'urban'], category: 'Sleep' },
  { id: 'electrolytes', name: 'Electrolyte Sachets', destinations: ['tropical', 'altitude'], category: 'Nutrition', notes: 'Critical at altitude and in heat' },
]

// ─────────────────────────────────────────────────────────────────────────────
// WATER & FOOD SAFETY TIERS
// ─────────────────────────────────────────────────────────────────────────────

export interface SafetyTier {
  tier: 1 | 2 | 3 | 4
  label: string
  description: string
  tapWaterSafe: boolean
  guidance: string[]
  countries: string[]
}

export const WATER_FOOD_SAFETY_TIERS: SafetyTier[] = [
  {
    tier: 1,
    label: 'Excellent',
    description: 'Tap water safe; high food hygiene standards',
    tapWaterSafe: true,
    guidance: [
      'Tap water safe to drink',
      'Standard food hygiene; eat freely',
      'Normal hand-washing precautions',
    ],
    countries: [
      'United States', 'Canada', 'United Kingdom', 'Australia', 'New Zealand',
      'Germany', 'France', 'Netherlands', 'Switzerland', 'Austria', 'Sweden',
      'Norway', 'Denmark', 'Finland', 'Japan', 'South Korea', 'Singapore',
      'Iceland', 'Ireland', 'Belgium', 'Luxembourg', 'Israel',
    ],
  },
  {
    tier: 2,
    label: 'Good',
    description: 'Tap water generally safe; exercise some caution with street food',
    tapWaterSafe: true,
    guidance: [
      'Tap water generally safe but sensitive travellers may prefer bottled',
      'Avoid raw shellfish and undercooked meat',
      'Street food usually safe at busy, well-cooked stalls',
    ],
    countries: [
      'Spain', 'Italy', 'Portugal', 'Greece', 'Czech Republic', 'Poland',
      'Hungary', 'Slovakia', 'Croatia', 'Slovenia', 'Chile', 'Argentina',
      'Uruguay', 'South Africa', 'Botswana', 'Namibia', 'Brazil (urban)',
    ],
  },
  {
    tier: 3,
    label: 'Caution',
    description: 'Avoid tap water; stick to bottled or purified; food hygiene variable',
    tapWaterSafe: false,
    guidance: [
      'Drink only bottled, boiled, or purified water',
      'Avoid ice unless from sealed bottles',
      'Peel all fruit yourself; avoid raw salads washed in tap water',
      'Eat at busy restaurants with high turnover',
      'Avoid raw/undercooked seafood, meat, and eggs',
      'Consider Hepatitis A and Typhoid vaccination',
    ],
    countries: [
      'India', 'Pakistan', 'Bangladesh', 'Nepal', 'Sri Lanka',
      'Thailand', 'Vietnam', 'Cambodia', 'Laos', 'Myanmar', 'Indonesia',
      'Philippines', 'Malaysia', 'China (rural)', 'Mongolia',
      'Egypt', 'Morocco', 'Tunisia', 'Algeria', 'Libya',
      'Nigeria', 'Ghana', 'Kenya', 'Tanzania', 'Ethiopia', 'Uganda',
      'Mexico', 'Guatemala', 'Honduras', 'Nicaragua', 'El Salvador',
      'Peru', 'Bolivia', 'Ecuador', 'Colombia', 'Venezuela',
      'Russia (rural)', 'Ukraine', 'Moldova',
    ],
  },
  {
    tier: 4,
    label: 'High Risk',
    description: 'Water unsafe; food safety very poor; high risk of gastrointestinal illness',
    tapWaterSafe: false,
    guidance: [
      'Never drink tap water or use ice',
      'Boil water or use UV purifier + filter',
      'Eat only fully cooked food served hot',
      'Avoid all raw produce, salads, and fruit you cannot peel',
      'Carry oral rehydration salts and standby antibiotics',
      'Hepatitis A, Typhoid, and Cholera vaccines strongly recommended',
      'Consider malaria prophylaxis if applicable',
    ],
    countries: [
      'Haiti', 'DRC', 'South Sudan', 'Somalia', 'Central African Republic',
      'Chad', 'Niger', 'Mali', 'Burkina Faso', 'Sierra Leone', 'Liberia',
      'Guinea', 'Guinea-Bissau', 'Mozambique', 'Zimbabwe', 'Malawi',
      'Papua New Guinea', 'Afghanistan', 'Yemen', 'Syria', 'Iraq',
    ],
  },
]

export function getWaterFoodSafetyTier(country: string): SafetyTier {
  const c = country.toLowerCase()
  for (const tier of WATER_FOOD_SAFETY_TIERS) {
    if (tier.countries.some((t) => t.toLowerCase().includes(c) || c.includes(t.toLowerCase()))) {
      return tier
    }
  }
  return WATER_FOOD_SAFETY_TIERS[2] // Default to Caution if unknown
}
