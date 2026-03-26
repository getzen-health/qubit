export type InteractionSeverity = 'beneficial' | 'neutral' | 'caution' | 'avoid'

export interface Interaction {
  supp1: string
  supp2: string
  severity: InteractionSeverity
  description: string
}

export const INTERACTIONS: Interaction[] = [
  { supp1: 'Vitamin D', supp2: 'Vitamin K2', severity: 'beneficial', description: 'K2 directs calcium deposited by D3 to bones, reducing arterial calcification risk.' },
  { supp1: 'Vitamin D', supp2: 'Magnesium', severity: 'beneficial', description: 'Magnesium is required to activate Vitamin D. Deficiency in one limits the other.' },
  { supp1: 'Iron', supp2: 'Calcium', severity: 'caution', description: 'Calcium inhibits iron absorption. Take at least 2 hours apart.' },
  { supp1: 'Iron', supp2: 'Zinc', severity: 'caution', description: 'High-dose zinc competes with iron for absorption. Separate by 2+ hours.' },
  { supp1: 'Zinc', supp2: 'Copper', severity: 'caution', description: 'Long-term high zinc supplementation can deplete copper. Monitor levels.' },
  { supp1: 'Omega-3', supp2: 'Vitamin E', severity: 'beneficial', description: 'Vitamin E prevents oxidation of omega-3 fatty acids, enhancing stability.' },
  { supp1: 'Vitamin C', supp2: 'Iron', severity: 'beneficial', description: 'Vitamin C significantly enhances non-heme iron absorption.' },
  { supp1: 'Vitamin B12', supp2: 'Folate', severity: 'beneficial', description: 'B12 and folate work together in methylation cycles. Both needed for neurological health.' },
  { supp1: 'Calcium', supp2: 'Magnesium', severity: 'caution', description: 'Compete for absorption. Ideal ratio is 2:1 calcium to magnesium. Take with meals.' },
  { supp1: 'Creatine', supp2: 'Caffeine', severity: 'neutral', description: 'Research is mixed — caffeine may slightly blunt creatine\'s ergogenic effects acutely.' },
  { supp1: 'Melatonin', supp2: 'Magnesium', severity: 'beneficial', description: 'Magnesium supports melatonin synthesis and relaxation. Good sleep stack.' },
  { supp1: 'CoQ10', supp2: 'Omega-3', severity: 'beneficial', description: 'Both support cardiovascular and mitochondrial health synergistically.' },
  { supp1: 'Ashwagandha', supp2: 'Thyroid medication', severity: 'avoid', description: 'Ashwagandha may increase thyroid hormone levels — avoid with thyroid medications without doctor guidance.' },
  { supp1: 'St. John\'s Wort', supp2: 'Vitamin B12', severity: 'caution', description: 'St. John\'s Wort can reduce absorption of B12 over time.' },
  { supp1: 'Probiotics', supp2: 'Antibiotics', severity: 'caution', description: 'Take probiotics 2+ hours after antibiotics to preserve the probiotic cultures.' },
]

export function findInteractions(supplements: string[]): Interaction[] {
  const results: Interaction[] = []
  const normalized = supplements.map(s => s.toLowerCase().trim())
  
  for (const interaction of INTERACTIONS) {
    const s1 = interaction.supp1.toLowerCase()
    const s2 = interaction.supp2.toLowerCase()
    const has1 = normalized.some(n => n.includes(s1) || s1.includes(n))
    const has2 = normalized.some(n => n.includes(s2) || s2.includes(n))
    if (has1 && has2) results.push(interaction)
  }
  return results
}
