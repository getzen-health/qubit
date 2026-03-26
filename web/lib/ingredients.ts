export interface IngredientInfo {
  name: string
  risk: 'safe' | 'caution' | 'avoid'
  description: string
  aliases?: string[]
}

export const INGREDIENT_DATABASE: Record<string, IngredientInfo> = {
  'high fructose corn syrup': { name: 'High Fructose Corn Syrup', risk: 'avoid', description: 'Linked to obesity, diabetes, and metabolic syndrome. Associated with increased liver fat.', aliases: ['hfcs', 'glucose-fructose syrup'] },
  'partially hydrogenated': { name: 'Partially Hydrogenated Oils', risk: 'avoid', description: 'Contains trans fats. Increases LDL cholesterol and cardiovascular disease risk.' },
  'sodium nitrite': { name: 'Sodium Nitrite (E250)', risk: 'caution', description: 'Used as preservative in processed meats. May form nitrosamines, classified as probable carcinogen.' },
  'monosodium glutamate': { name: 'MSG (E621)', risk: 'caution', description: 'Flavor enhancer. Generally recognized as safe but some individuals report sensitivity.' },
  'carrageenan': { name: 'Carrageenan (E407)', risk: 'caution', description: 'Thickening agent derived from seaweed. Some studies suggest gut inflammation in high doses.' },
  'aspartame': { name: 'Aspartame (E951)', risk: 'caution', description: 'Artificial sweetener. Classified as "possibly carcinogenic" by IARC in 2023. Avoid if PKU.' },
  'red 40': { name: 'Red 40 (E129)', risk: 'avoid', description: 'Artificial dye linked to hyperactivity in children. Banned in some European countries.' },
  'yellow 5': { name: 'Yellow 5 (E102)', risk: 'avoid', description: 'Tartrazine dye. Requires warning label in EU. Linked to hyperactivity and allergies.' },
  'bha': { name: 'BHA (E320)', risk: 'caution', description: 'Preservative classified as possibly carcinogenic. Disrupts endocrine system in animal studies.' },
  'bht': { name: 'BHT (E321)', risk: 'caution', description: 'Antioxidant preservative. Similar concerns to BHA. Some studies show tumor promotion.' },
}

export function analyzeIngredients(ingredientsText: string): IngredientInfo[] {
  const lower = ingredientsText.toLowerCase()
  const found: IngredientInfo[] = []
  for (const [key, info] of Object.entries(INGREDIENT_DATABASE)) {
    if (lower.includes(key) || info.aliases?.some(a => lower.includes(a))) {
      found.push(info)
    }
  }
  return found.sort((a, b) => {
    const order = { avoid: 0, caution: 1, safe: 2 }
    return order[a.risk] - order[b.risk]
  })
}
