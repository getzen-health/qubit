export interface IngredientInfo {
  name: string
  aliases: string[]
  category: 'sweetener' | 'preservative' | 'colorant' | 'emulsifier' | 'thickener' | 'flavoring' | 'nutrient' | 'other'
  description: string
  risk: 'safe' | 'moderate' | 'caution' | 'avoid'
  detail: string
  source?: string
}

export const INGREDIENT_GLOSSARY: Record<string, IngredientInfo> = {
  'e100': { name: 'Curcumin', aliases: ['turmeric yellow'], category: 'colorant', description: 'Natural yellow color from turmeric', risk: 'safe', detail: 'Anti-inflammatory spice extract. GRAS status. Also sold as supplement.' },
  'e101': { name: 'Riboflavin (B2)', aliases: ['vitamin b2'], category: 'colorant', description: 'Vitamin B2, natural yellow color', risk: 'safe', detail: 'Essential vitamin, safe at any food additive level.' },
  'e110': { name: 'Sunset Yellow', aliases: ['fdc yellow no. 6'], category: 'colorant', description: 'Synthetic orange-yellow dye', risk: 'caution', detail: 'Part of "Southampton Six" — linked to hyperactivity in children. Requires warning label in EU.' },
  'e120': { name: 'Cochineal (Carmine)', aliases: ['carmine', 'natural red 4'], category: 'colorant', description: 'Red dye from crushed insects', risk: 'moderate', detail: 'Not vegan. Can cause allergic reactions in some. Otherwise generally safe.' },
  'e150a': { name: 'Plain Caramel', aliases: [], category: 'colorant', description: 'Caramel color from heated sugar', risk: 'safe', detail: 'Natural browning reaction product.' },
  'e150d': { name: 'Sulphite Ammonia Caramel', aliases: ['caramel color iv'], category: 'colorant', description: 'Industrial caramel color', risk: 'caution', detail: 'Contains 4-MEI, a potential carcinogen. Common in dark sodas.' },
  'e160a': { name: 'Beta-Carotene', aliases: ['provitamin a'], category: 'colorant', description: 'Orange color, vitamin A precursor', risk: 'safe', detail: 'Natural antioxidant pigment.' },
  'e200': { name: 'Sorbic Acid', aliases: [], category: 'preservative', description: 'Mold and yeast inhibitor', risk: 'safe', detail: 'Naturally found in rowan berries. GRAS. ADI well above typical food levels.' },
  'e211': { name: 'Sodium Benzoate', aliases: [], category: 'preservative', description: 'Antimicrobial preservative', risk: 'caution', detail: 'Forms benzene (carcinogen) when combined with ascorbic acid (vitamin C) in acidic drinks. Common in sodas.' },
  'e220': { name: 'Sulphur Dioxide', aliases: ['so2', 'sulfur dioxide'], category: 'preservative', description: 'Antimicrobial gas', risk: 'caution', detail: 'Can trigger asthma. Must be labeled if >10mg/kg. Common in dried fruit, wine.' },
  'e250': { name: 'Sodium Nitrite', aliases: [], category: 'preservative', description: 'Cured meat preservative, pink color', risk: 'avoid', detail: 'IARC Group 2A carcinogen when processed in the gut. Linked to colorectal cancer (BMJ 2024). Banned trend in some EU products.' },
  'e252': { name: 'Potassium Nitrate', aliases: ['saltpetre'], category: 'preservative', description: 'Curing salt for meats', risk: 'avoid', detail: 'Converts to nitrite in body. Same concerns as sodium nitrite (E250).' },
  'e300': { name: 'Ascorbic Acid (Vit C)', aliases: ['vitamin c'], category: 'preservative', description: 'Antioxidant vitamin', risk: 'safe', detail: 'Essential vitamin. Safe and beneficial as food additive.' },
  'e320': { name: 'BHA', aliases: ['butylated hydroxyanisole'], category: 'preservative', description: 'Antioxidant preservative', risk: 'caution', detail: 'IARC Group 2B possible carcinogen. Endocrine disruptor concerns. Restricted in some countries.' },
  'e321': { name: 'BHT', aliases: ['butylated hydroxytoluene'], category: 'preservative', description: 'Antioxidant preservative', risk: 'caution', detail: 'Similar to BHA. Some studies suggest tumor-promoting effect at high doses.' },
  'e330': { name: 'Citric Acid', aliases: [], category: 'preservative', description: 'Natural sour flavor/preservative', risk: 'safe', detail: 'Found in citrus fruits. GRAS. Widely used.' },
  'e407': { name: 'Carrageenan', aliases: [], category: 'thickener', description: 'Seaweed-derived thickener/emulsifier', risk: 'caution', detail: 'Degraded forms linked to gut inflammation in animal studies. IARC notes possible concerns. Some sensitivity reports.' },
  'e415': { name: 'Xanthan Gum', aliases: [], category: 'thickener', description: 'Fermentation-derived thickener', risk: 'safe', detail: 'GRAS. Common in gluten-free products. May cause bloating in large amounts.' },
  'e422': { name: 'Glycerol', aliases: ['glycerin', 'glycerine'], category: 'other', description: 'Sweetener/humectant', risk: 'safe', detail: 'Natural fat component. GRAS.' },
  'e471': { name: 'Mono/Diglycerides', aliases: ['monoglycerides', 'diglycerides'], category: 'emulsifier', description: 'Fat-derived emulsifiers', risk: 'moderate', detail: 'May contain trans fats. Derived from animal or vegetable fat. Not always vegan.' },
  'e476': { name: 'PGPR', aliases: ['polyglycerol polyricinoleate'], category: 'emulsifier', description: 'Chocolate emulsifier', risk: 'moderate', detail: 'Used in cheap chocolate to replace cocoa butter. Generally safe but indicates lower quality.' },
  'e621': { name: 'MSG', aliases: ['monosodium glutamate', 'glutamate'], category: 'flavoring', description: 'Umami flavor enhancer', risk: 'safe', detail: 'FDA GRAS. Meta-analyses show no link to "MSG symptom complex" at normal doses (EFSA 2017). Naturally in tomatoes, parmesan.' },
  'e951': { name: 'Aspartame', aliases: ['nutrasweet', 'equal'], category: 'sweetener', description: 'Artificial sweetener', risk: 'caution', detail: 'IARC Group 2B possible carcinogen (July 2023). ADI at 40mg/kg still upheld by EFSA/FDA. Debate ongoing. Avoid if sensitive to phenylalanine (PKU).' },
  'e952': { name: 'Cyclamate', aliases: [], category: 'sweetener', description: 'Artificial sweetener', risk: 'caution', detail: 'Banned in USA since 1970 (rodent study). Re-evaluated safe by EFSA 2000. Allowed in EU/Canada.' },
  'e954': { name: 'Saccharin', aliases: [], category: 'sweetener', description: 'Oldest artificial sweetener', risk: 'moderate', detail: 'FDA delisted carcinogen concern in 2000. Some gut microbiome disruption studies.' },
  'e955': { name: 'Sucralose', aliases: ['splenda'], category: 'sweetener', description: 'Artificial sweetener', risk: 'moderate', detail: 'Some evidence of gut microbiome effects at high doses. Generally considered safe by FDA.' },
  'e960': { name: 'Steviol Glycosides', aliases: ['stevia'], category: 'sweetener', description: 'Natural stevia sweetener', risk: 'safe', detail: 'Plant-derived. GRAS. Well-tolerated. No glycemic impact.' },
  'e171': { name: 'Titanium Dioxide', aliases: ['TiO2', 'ci 77891'], category: 'colorant', description: 'White colorant', risk: 'avoid', detail: 'Banned in EU food since June 2022 (EFSA found potential genotoxic risk). Still allowed in US/UK. Common in candies, chewing gum.' },
  'high fructose corn syrup': { name: 'High Fructose Corn Syrup', aliases: ['hfcs', 'glucose-fructose syrup'], category: 'sweetener', description: 'Industrial corn-derived sweetener', risk: 'caution', detail: 'Linked to obesity, metabolic syndrome at high intake. Metabolized differently than glucose. Common in US processed foods.' },
  'palm oil': { name: 'Palm Oil', aliases: [], category: 'other', description: 'Tropical vegetable fat', risk: 'moderate', detail: 'High in saturated fat. Environmental concerns (deforestation). Oxidation products in refined palm oil may be atherogenic.' },
  'soy lecithin': { name: 'Soy Lecithin', aliases: ['sunflower lecithin'], category: 'emulsifier', description: 'Natural emulsifier', risk: 'safe', detail: 'Extracted from soy/sunflower. GRAS. Trace amounts in refined products typically safe for most soy-allergic individuals.' },
  'modified starch': { name: 'Modified Starch', aliases: ['modified food starch', 'acetylated starch'], category: 'thickener', description: 'Chemically altered starch', risk: 'safe', detail: 'FDA GRAS. Used as thickener/stabilizer. Not the same as GMO modification.' },
  'maltodextrin': { name: 'Maltodextrin', aliases: [], category: 'other', description: 'Processed starch derivative', risk: 'moderate', detail: 'High GI (130 vs table sugar 65). Feeds gut bacteria linked to inflammation. Common in protein powders, snacks.' },
  'artificial flavors': { name: 'Artificial Flavors', aliases: ['artificial flavoring'], category: 'flavoring', description: 'Synthetic flavor compounds', risk: 'moderate', detail: 'Broad category. Generally safe at ADI levels but may mask poor ingredient quality.' },
  'natural flavors': { name: 'Natural Flavors', aliases: ['natural flavoring'], category: 'flavoring', description: 'FDA-defined "natural" flavor extracts', risk: 'safe', detail: 'Can include 3,000+ FDA-approved chemicals. "Natural" does not mean additive-free — sourced from natural starting materials.' },
  'carnauba wax': { name: 'Carnauba Wax', aliases: ['e903'], category: 'other', description: 'Glazing agent from palm leaves', risk: 'safe', detail: 'Vegan. GRAS. Used on candies, pills, fruit.' },
  'shellac': { name: 'Shellac', aliases: ['e904', 'resinous glaze'], category: 'other', description: 'Insect-derived glazing agent', risk: 'safe', detail: 'Not vegan. Secreted by lac bug. Common coating on citrus fruit, some chocolates.' },
}

export function lookupIngredient(term: string): IngredientInfo | null {
  const key = term.toLowerCase().trim()
  if (INGREDIENT_GLOSSARY[key]) return INGREDIENT_GLOSSARY[key]
  // search by alias
  for (const [, info] of Object.entries(INGREDIENT_GLOSSARY)) {
    if (info.aliases.some(a => a.toLowerCase() === key)) return info
    if (info.name.toLowerCase() === key) return info
  }
  return null
}

export function getRiskColor(risk: IngredientInfo['risk']): string {
  switch (risk) {
    case 'safe': return 'text-green-600 bg-green-50'
    case 'moderate': return 'text-yellow-600 bg-yellow-50'
    case 'caution': return 'text-orange-600 bg-orange-50'
    case 'avoid': return 'text-red-600 bg-red-50'
  }
}
