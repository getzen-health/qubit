export interface Micronutrient {
  id: string
  name: string
  unit: string
  category: 'vitamin' | 'mineral'
  rda: { [ageGroup: string]: { male: number; female: number } }
  ul: number | null
  functions: string[]
  deficiencySymptoms: string[]
  topFoods: string[]
  interactions: string[]
}

export interface NutrientLog {
  date: string
  nutrient_id: string
  amount: number
  source: 'food' | 'supplement' | 'food_scan'
}

export interface NutrientGapAnalysis {
  nutrient: Micronutrient
  logged_amount: number
  rda: number
  percentage: number
  status: 'deficient' | 'insufficient' | 'adequate' | 'optimal' | 'excess'
  gap_amount: number
  top_food_suggestions: string[]
}

export const MICRONUTRIENT_DB: Micronutrient[] = [
  // ─── VITAMINS ────────────────────────────────────────────────────────────
  {
    id: 'vitamin_a',
    name: 'Vitamin A',
    unit: 'mcg',
    category: 'vitamin',
    rda: {
      '14-18': { male: 900, female: 700 },
      '19-50': { male: 900, female: 700 },
      '51-70': { male: 900, female: 700 },
      '71+':   { male: 900, female: 700 },
    },
    ul: 3000,
    functions: [
      'Vision and eye health',
      'Immune system function',
      'Cell growth and differentiation',
    ],
    deficiencySymptoms: ['Night blindness', 'Dry skin and eyes', 'Frequent infections'],
    topFoods: ['Beef liver', 'Sweet potato', 'Carrots', 'Spinach', 'Kale'],
    interactions: ['Vitamin E reduces toxicity at high doses', 'Zinc needed for transport protein'],
  },
  {
    id: 'vitamin_b1',
    name: 'Vitamin B1 (Thiamine)',
    unit: 'mg',
    category: 'vitamin',
    rda: {
      '14-18': { male: 1.2, female: 1.0 },
      '19-50': { male: 1.2, female: 1.1 },
      '51-70': { male: 1.2, female: 1.1 },
      '71+':   { male: 1.2, female: 1.1 },
    },
    ul: null,
    functions: [
      'Energy metabolism (carbohydrate conversion)',
      'Nerve function and signal transmission',
      'Heart muscle contraction',
    ],
    deficiencySymptoms: ['Fatigue and weakness', 'Nerve damage (beriberi)', 'Poor memory'],
    topFoods: ['Pork', 'Whole grains', 'Legumes', 'Sunflower seeds', 'Nutritional yeast'],
    interactions: ['Alcohol severely depletes thiamine', 'Raw fish contains thiaminase enzyme'],
  },
  {
    id: 'vitamin_b2',
    name: 'Vitamin B2 (Riboflavin)',
    unit: 'mg',
    category: 'vitamin',
    rda: {
      '14-18': { male: 1.3, female: 1.0 },
      '19-50': { male: 1.3, female: 1.1 },
      '51-70': { male: 1.3, female: 1.1 },
      '71+':   { male: 1.3, female: 1.1 },
    },
    ul: null,
    functions: [
      'Energy production via FAD/FMN coenzymes',
      'Antioxidant recycling (glutathione)',
      'Red blood cell production',
    ],
    deficiencySymptoms: ['Cracked lips and mouth corners', 'Inflamed tongue', 'Sensitivity to light'],
    topFoods: ['Beef liver', 'Dairy products', 'Almonds', 'Mushrooms', 'Fortified cereals'],
    interactions: ['Required for B6 and folate activation', 'Destroyed by UV light'],
  },
  {
    id: 'vitamin_b3',
    name: 'Vitamin B3 (Niacin)',
    unit: 'mg',
    category: 'vitamin',
    rda: {
      '14-18': { male: 16, female: 14 },
      '19-50': { male: 16, female: 14 },
      '51-70': { male: 16, female: 14 },
      '71+':   { male: 16, female: 14 },
    },
    ul: 35,
    functions: [
      'NAD+/NADP+ cofactor for 400+ enzymes',
      'DNA repair and gene expression',
      'Cholesterol metabolism',
    ],
    deficiencySymptoms: ['Pellagra (dermatitis, diarrhea, dementia)', 'Fatigue', 'Skin rash in sun'],
    topFoods: ['Chicken breast', 'Tuna', 'Turkey', 'Beef liver', 'Peanuts'],
    interactions: ['Tryptophan can convert to niacin (60:1 ratio)', 'High doses may flush skin'],
  },
  {
    id: 'vitamin_b5',
    name: 'Vitamin B5 (Pantothenic Acid)',
    unit: 'mg',
    category: 'vitamin',
    rda: {
      '14-18': { male: 5, female: 5 },
      '19-50': { male: 5, female: 5 },
      '51-70': { male: 5, female: 5 },
      '71+':   { male: 5, female: 5 },
    },
    ul: null,
    functions: [
      'Coenzyme A synthesis for fatty acid metabolism',
      'Hormone and neurotransmitter production',
      'Red blood cell formation',
    ],
    deficiencySymptoms: ['Burning feet syndrome', 'Fatigue and irritability', 'Nausea'],
    topFoods: ['Beef liver', 'Sunflower seeds', 'Mushrooms', 'Avocado', 'Chicken'],
    interactions: ['Works with B7 in fatty acid synthesis', 'Alcohol depletes B5'],
  },
  {
    id: 'vitamin_b6',
    name: 'Vitamin B6',
    unit: 'mg',
    category: 'vitamin',
    rda: {
      '14-18': { male: 1.3, female: 1.2 },
      '19-50': { male: 1.3, female: 1.3 },
      '51-70': { male: 1.7, female: 1.5 },
      '71+':   { male: 1.7, female: 1.5 },
    },
    ul: 100,
    functions: [
      'Amino acid metabolism (100+ enzyme reactions)',
      'Serotonin and dopamine synthesis',
      'Immune system and hemoglobin production',
    ],
    deficiencySymptoms: ['Anemia', 'Depression and confusion', 'Inflamed tongue'],
    topFoods: ['Chickpeas', 'Tuna', 'Salmon', 'Chicken breast', 'Potatoes'],
    interactions: ['Required for magnesium absorption', 'High doses can cause nerve damage'],
  },
  {
    id: 'vitamin_b7',
    name: 'Vitamin B7 (Biotin)',
    unit: 'mcg',
    category: 'vitamin',
    rda: {
      '14-18': { male: 25, female: 25 },
      '19-50': { male: 30, female: 30 },
      '51-70': { male: 30, female: 30 },
      '71+':   { male: 30, female: 30 },
    },
    ul: null,
    functions: [
      'Carboxylase enzyme cofactor (fat/protein/carb metabolism)',
      'Gene regulation and cell signaling',
      'Hair, skin, and nail health',
    ],
    deficiencySymptoms: ['Hair loss', 'Skin rash around eyes/nose/mouth', 'Brittle nails'],
    topFoods: ['Beef liver', 'Eggs', 'Salmon', 'Sunflower seeds', 'Sweet potato'],
    interactions: ['Raw egg whites block biotin absorption (avidin)', 'Antibiotics may reduce gut biotin production'],
  },
  {
    id: 'vitamin_b9',
    name: 'Vitamin B9 (Folate)',
    unit: 'mcg',
    category: 'vitamin',
    rda: {
      '14-18': { male: 400, female: 400 },
      '19-50': { male: 400, female: 400 },
      '51-70': { male: 400, female: 400 },
      '71+':   { male: 400, female: 400 },
    },
    ul: 1000,
    functions: [
      'DNA synthesis and cell division',
      'Neural tube development in pregnancy',
      'Homocysteine metabolism (heart health)',
    ],
    deficiencySymptoms: ['Megaloblastic anemia', 'Neural tube defects in pregnancy', 'Elevated homocysteine'],
    topFoods: ['Beef liver', 'Lentils', 'Asparagus', 'Spinach', 'Avocado'],
    interactions: ['B12 deficiency can mask folate deficiency', 'Can hide B12 deficiency neurological damage'],
  },
  {
    id: 'vitamin_b12',
    name: 'Vitamin B12',
    unit: 'mcg',
    category: 'vitamin',
    rda: {
      '14-18': { male: 2.4, female: 2.4 },
      '19-50': { male: 2.4, female: 2.4 },
      '51-70': { male: 2.4, female: 2.4 },
      '71+':   { male: 2.4, female: 2.4 },
    },
    ul: null,
    functions: [
      'Neurological function and myelin synthesis',
      'Red blood cell formation',
      'DNA synthesis with folate',
    ],
    deficiencySymptoms: ['Megaloblastic anemia', 'Numbness/tingling in hands and feet', 'Memory loss and dementia'],
    topFoods: ['Beef liver', 'Clams', 'Sardines', 'Salmon', 'Fortified nutritional yeast'],
    interactions: ['Folate can mask B12 deficiency', 'Metformin reduces B12 absorption'],
  },
  {
    id: 'vitamin_c',
    name: 'Vitamin C',
    unit: 'mg',
    category: 'vitamin',
    rda: {
      '14-18': { male: 75, female: 65 },
      '19-50': { male: 90, female: 75 },
      '51-70': { male: 90, female: 75 },
      '71+':   { male: 90, female: 75 },
    },
    ul: 2000,
    functions: [
      'Collagen synthesis for skin, bones, and vessels',
      'Antioxidant protecting cells from oxidative damage',
      'Immune function and iron absorption',
    ],
    deficiencySymptoms: ['Scurvy (gum bleeding, joint pain)', 'Slow wound healing', 'Fatigue and irritability'],
    topFoods: ['Red bell pepper', 'Kiwi', 'Strawberries', 'Broccoli', 'Citrus fruits'],
    interactions: ['Enhances non-heme iron absorption', 'High doses may increase kidney stone risk'],
  },
  {
    id: 'vitamin_d',
    name: 'Vitamin D',
    unit: 'mcg',
    category: 'vitamin',
    rda: {
      '14-18': { male: 15, female: 15 },
      '19-50': { male: 15, female: 15 },
      '51-70': { male: 15, female: 15 },
      '71+':   { male: 20, female: 20 },
    },
    ul: 100,
    functions: [
      'Calcium and phosphorus absorption for bone health',
      'Immune modulation and anti-inflammatory effects',
      'Muscle function and neuromuscular coordination',
    ],
    deficiencySymptoms: ['Bone pain and fractures (osteomalacia)', 'Muscle weakness', 'Increased infection risk'],
    topFoods: ['Salmon', 'Swordfish', 'Fortified milk', 'Egg yolk', 'UV-exposed mushrooms'],
    interactions: ['Requires magnesium for activation', 'Fat-soluble — absorb with dietary fat'],
  },
  {
    id: 'vitamin_e',
    name: 'Vitamin E',
    unit: 'mg',
    category: 'vitamin',
    rda: {
      '14-18': { male: 15, female: 15 },
      '19-50': { male: 15, female: 15 },
      '51-70': { male: 15, female: 15 },
      '71+':   { male: 15, female: 15 },
    },
    ul: 1000,
    functions: [
      'Fat-soluble antioxidant protecting cell membranes',
      'Immune function and anti-inflammatory signaling',
      'Vitamin K antagonism at high doses',
    ],
    deficiencySymptoms: ['Peripheral neuropathy', 'Muscle weakness', 'Immune impairment'],
    topFoods: ['Wheat germ oil', 'Sunflower seeds', 'Almonds', 'Hazelnuts', 'Spinach'],
    interactions: ['High doses interfere with vitamin K', 'Synergistic antioxidant with vitamin C and selenium'],
  },
  {
    id: 'vitamin_k1',
    name: 'Vitamin K1 (Phylloquinone)',
    unit: 'mcg',
    category: 'vitamin',
    rda: {
      '14-18': { male: 75, female: 75 },
      '19-50': { male: 120, female: 90 },
      '51-70': { male: 120, female: 90 },
      '71+':   { male: 120, female: 90 },
    },
    ul: null,
    functions: [
      'Blood clotting factor activation (II, VII, IX, X)',
      'Bone protein carboxylation (osteocalcin)',
      'Arterial calcification prevention',
    ],
    deficiencySymptoms: ['Excessive bleeding and bruising', 'Heavy menstrual periods', 'Weak bones'],
    topFoods: ['Kale', 'Spinach', 'Broccoli', 'Brussels sprouts', 'Fermented foods'],
    interactions: ['Antagonizes blood thinners (warfarin)', 'Fat-soluble — absorb with dietary fat'],
  },
  {
    id: 'vitamin_k2',
    name: 'Vitamin K2 (Menaquinone)',
    unit: 'mcg',
    category: 'vitamin',
    rda: {
      '14-18': { male: 75, female: 75 },
      '19-50': { male: 120, female: 90 },
      '51-70': { male: 120, female: 90 },
      '71+':   { male: 120, female: 90 },
    },
    ul: null,
    functions: [
      'Directs calcium to bones (matrix Gla-protein)',
      'Arterial health — prevents vascular calcification',
      'Anti-tumor and cardiovascular protective effects',
    ],
    deficiencySymptoms: ['Increased arterial calcification', 'Reduced bone mineral density', 'Higher cardiovascular risk'],
    topFoods: ['Natto (fermented soybeans)', 'Gouda cheese', 'Egg yolk', 'Butter', 'Chicken liver'],
    interactions: ['Works synergistically with Vitamin D3 for bone/artery health', 'Antagonizes warfarin'],
  },

  // ─── MINERALS ────────────────────────────────────────────────────────────
  {
    id: 'calcium',
    name: 'Calcium',
    unit: 'mg',
    category: 'mineral',
    rda: {
      '14-18': { male: 1300, female: 1300 },
      '19-50': { male: 1000, female: 1000 },
      '51-70': { male: 1000, female: 1200 },
      '71+':   { male: 1200, female: 1200 },
    },
    ul: 2500,
    functions: [
      'Bone and teeth mineralization',
      'Muscle contraction and nerve signaling',
      'Blood clotting and cell signaling',
    ],
    deficiencySymptoms: ['Osteoporosis and fractures', 'Muscle cramps and spasms', 'Numbness and tingling'],
    topFoods: ['Milk', 'Yogurt', 'Cheese', 'Fortified tofu', 'Sardines with bones'],
    interactions: ['Vitamin D required for absorption', 'Competes with magnesium and iron absorption', 'Excess calcium reduces zinc absorption'],
  },
  {
    id: 'iron',
    name: 'Iron',
    unit: 'mg',
    category: 'mineral',
    rda: {
      '14-18': { male: 11, female: 15 },
      '19-50': { male: 8,  female: 18 },
      '51-70': { male: 8,  female: 8  },
      '71+':   { male: 8,  female: 8  },
    },
    ul: 45,
    functions: [
      'Oxygen transport via hemoglobin',
      'Electron transport chain for energy',
      'DNA synthesis and immune cell proliferation',
    ],
    deficiencySymptoms: ['Iron-deficiency anemia', 'Fatigue and weakness', 'Cold intolerance and pale skin'],
    topFoods: ['Beef liver', 'Oysters', 'Red meat', 'Lentils', 'Fortified cereals'],
    interactions: ['Vitamin C greatly enhances non-heme iron absorption', 'Calcium inhibits iron absorption', 'Zinc and iron compete'],
  },
  {
    id: 'magnesium',
    name: 'Magnesium',
    unit: 'mg',
    category: 'mineral',
    rda: {
      '14-18': { male: 410, female: 360 },
      '19-50': { male: 420, female: 320 },
      '51-70': { male: 420, female: 320 },
      '71+':   { male: 420, female: 320 },
    },
    ul: 350,
    functions: [
      'Cofactor for 300+ enzymatic reactions',
      'ATP production and muscle/nerve function',
      'Bone formation and vitamin D activation',
    ],
    deficiencySymptoms: ['Muscle cramps and tremors', 'Insomnia and anxiety', 'Irregular heartbeat'],
    topFoods: ['Pumpkin seeds', 'Almonds', 'Dark chocolate', 'Spinach', 'Black beans'],
    interactions: ['Required for vitamin D activation', 'Competes with calcium at absorption sites', 'Zinc at high doses reduces magnesium'],
  },
  {
    id: 'zinc',
    name: 'Zinc',
    unit: 'mg',
    category: 'mineral',
    rda: {
      '14-18': { male: 11, female: 9 },
      '19-50': { male: 11, female: 8 },
      '51-70': { male: 11, female: 8 },
      '71+':   { male: 11, female: 8 },
    },
    ul: 40,
    functions: [
      'Immune function and wound healing',
      'Protein synthesis and DNA transcription',
      'Taste, smell, and testosterone production',
    ],
    deficiencySymptoms: ['Impaired immunity and frequent illness', 'Hair loss and skin lesions', 'Loss of taste and smell'],
    topFoods: ['Oysters', 'Beef', 'Pumpkin seeds', 'Cashews', 'Fortified cereals'],
    interactions: ['High zinc depletes copper', 'Iron and zinc compete for absorption', 'Phytates in grains reduce zinc bioavailability'],
  },
  {
    id: 'selenium',
    name: 'Selenium',
    unit: 'mcg',
    category: 'mineral',
    rda: {
      '14-18': { male: 55, female: 55 },
      '19-50': { male: 55, female: 55 },
      '51-70': { male: 55, female: 55 },
      '71+':   { male: 55, female: 55 },
    },
    ul: 400,
    functions: [
      'Glutathione peroxidase antioxidant enzyme',
      'Thyroid hormone metabolism',
      'Immune function and anti-cancer properties',
    ],
    deficiencySymptoms: ['Keshan disease (cardiomyopathy)', 'Hypothyroidism symptoms', 'Weakened immune system'],
    topFoods: ['Brazil nuts', 'Tuna', 'Halibut', 'Sardines', 'Ham'],
    interactions: ['Synergistic antioxidant with vitamin E', 'Iodine needed for thyroid hormone; selenium activates it'],
  },
  {
    id: 'potassium',
    name: 'Potassium',
    unit: 'mg',
    category: 'mineral',
    rda: {
      '14-18': { male: 3000, female: 2300 },
      '19-50': { male: 3400, female: 2600 },
      '51-70': { male: 3400, female: 2600 },
      '71+':   { male: 3400, female: 2600 },
    },
    ul: null,
    functions: [
      'Blood pressure regulation and sodium balance',
      'Muscle contraction and nerve impulses',
      'Heart rhythm maintenance',
    ],
    deficiencySymptoms: ['Muscle weakness and cramps', 'Fatigue and constipation', 'Abnormal heart rhythms'],
    topFoods: ['Avocado', 'Sweet potato', 'Banana', 'Spinach', 'Salmon'],
    interactions: ["Counteracts sodium's blood pressure effect", 'Low potassium worsens magnesium loss'],
  },
  {
    id: 'sodium',
    name: 'Sodium',
    unit: 'mg',
    category: 'mineral',
    rda: {
      '14-18': { male: 1500, female: 1500 },
      '19-50': { male: 1500, female: 1500 },
      '51-70': { male: 1300, female: 1300 },
      '71+':   { male: 1200, female: 1200 },
    },
    ul: 2300,
    functions: [
      'Fluid balance and blood volume regulation',
      'Nerve impulse transmission',
      'Muscle contraction (with potassium)',
    ],
    deficiencySymptoms: ['Hyponatremia (nausea, headache, confusion)', 'Muscle cramps', 'Fatigue on low-sodium diets'],
    topFoods: ['Table salt', 'Processed foods', 'Pickles', 'Canned soups', 'Soy sauce'],
    interactions: ['High sodium increases calcium excretion', 'Potassium helps counterbalance sodium effects'],
  },
  {
    id: 'iodine',
    name: 'Iodine',
    unit: 'mcg',
    category: 'mineral',
    rda: {
      '14-18': { male: 150, female: 150 },
      '19-50': { male: 150, female: 150 },
      '51-70': { male: 150, female: 150 },
      '71+':   { male: 150, female: 150 },
    },
    ul: 1100,
    functions: [
      'Thyroid hormone (T3/T4) synthesis',
      'Metabolic rate regulation',
      'Fetal brain development during pregnancy',
    ],
    deficiencySymptoms: ['Hypothyroidism and goiter', 'Weight gain and fatigue', 'Cognitive impairment'],
    topFoods: ['Seaweed (nori, kelp)', 'Cod', 'Iodized salt', 'Shrimp', 'Dairy products'],
    interactions: ['Selenium required for thyroid hormone activation', 'Goitrogens in raw cruciferous vegetables may reduce iodine uptake'],
  },
  {
    id: 'chromium',
    name: 'Chromium',
    unit: 'mcg',
    category: 'mineral',
    rda: {
      '14-18': { male: 35, female: 24 },
      '19-50': { male: 35, female: 25 },
      '51-70': { male: 30, female: 20 },
      '71+':   { male: 30, female: 20 },
    },
    ul: null,
    functions: [
      'Enhances insulin signaling and glucose uptake',
      'Carbohydrate, fat, and protein metabolism',
      'Chromodulin activation for insulin sensitivity',
    ],
    deficiencySymptoms: ['Insulin resistance', 'Impaired glucose tolerance', 'Elevated blood cholesterol'],
    topFoods: ['Broccoli', 'Grape juice', 'English muffins', 'Potatoes', 'Garlic'],
    interactions: ['Vitamin C enhances chromium absorption', 'Calcium carbonate reduces chromium absorption'],
  },
  {
    id: 'manganese',
    name: 'Manganese',
    unit: 'mg',
    category: 'mineral',
    rda: {
      '14-18': { male: 2.2, female: 1.6 },
      '19-50': { male: 2.3, female: 1.8 },
      '51-70': { male: 2.3, female: 1.8 },
      '71+':   { male: 2.3, female: 1.8 },
    },
    ul: 11,
    functions: [
      'Superoxide dismutase antioxidant enzyme',
      'Bone formation and wound healing',
      'Amino acid, cholesterol, and carbohydrate metabolism',
    ],
    deficiencySymptoms: ['Skeletal abnormalities', 'Reduced fertility', 'Impaired glucose tolerance'],
    topFoods: ['Mussels', 'Wheat germ', 'Tofu', 'Sweet potato', 'Pecans'],
    interactions: ['Iron and manganese compete for absorption', 'Calcium may reduce manganese absorption'],
  },
  {
    id: 'molybdenum',
    name: 'Molybdenum',
    unit: 'mcg',
    category: 'mineral',
    rda: {
      '14-18': { male: 43, female: 43 },
      '19-50': { male: 45, female: 45 },
      '51-70': { male: 45, female: 45 },
      '71+':   { male: 45, female: 45 },
    },
    ul: 2000,
    functions: [
      'Sulfite oxidase enzyme for sulfur amino acid metabolism',
      'Xanthine oxidase for uric acid and purine metabolism',
      'Aldehyde oxidase for drug detoxification',
    ],
    deficiencySymptoms: ['Rapid heart rate and breathing', 'Headaches and disorientation (rare)', 'Neurological damage in severe cases'],
    topFoods: ['Legumes (lentils, peas)', 'Beef liver', 'Whole grains', 'Nuts', 'Dark leafy greens'],
    interactions: ['High molybdenum may reduce copper absorption', 'Sulfur competes with molybdenum'],
  },
  {
    id: 'copper',
    name: 'Copper',
    unit: 'mcg',
    category: 'mineral',
    rda: {
      '14-18': { male: 890,  female: 890  },
      '19-50': { male: 900,  female: 900  },
      '51-70': { male: 900,  female: 900  },
      '71+':   { male: 900,  female: 900  },
    },
    ul: 10000,
    functions: [
      'Iron transport (ceruloplasmin enzyme)',
      'Connective tissue crosslinking (lysyl oxidase)',
      'Superoxide dismutase antioxidant defense',
    ],
    deficiencySymptoms: ['Anemia unresponsive to iron', 'Bone fractures and osteoporosis', 'Neurological problems'],
    topFoods: ['Beef liver', 'Oysters', 'Crab', 'Cashews', 'Dark chocolate'],
    interactions: ['High zinc supplementation depletes copper', 'Vitamin C at high doses may reduce copper absorption'],
  },
  {
    id: 'phosphorus',
    name: 'Phosphorus',
    unit: 'mg',
    category: 'mineral',
    rda: {
      '14-18': { male: 1250, female: 1250 },
      '19-50': { male: 700,  female: 700  },
      '51-70': { male: 700,  female: 700  },
      '71+':   { male: 700,  female: 700  },
    },
    ul: 4000,
    functions: [
      'Bone and teeth mineralization (hydroxyapatite)',
      'ATP energy currency production',
      'Cell membrane phospholipid structure',
    ],
    deficiencySymptoms: ['Bone pain and weakness', 'Fatigue and loss of appetite', 'Muscle dysfunction'],
    topFoods: ['Dairy products', 'Meat and poultry', 'Fish', 'Nuts and seeds', 'Legumes'],
    interactions: ['Balanced with calcium (ideal 1:1 ratio)', 'Excess phosphorus reduces calcium absorption'],
  },
  {
    id: 'fluoride',
    name: 'Fluoride',
    unit: 'mg',
    category: 'mineral',
    rda: {
      '14-18': { male: 3,  female: 3  },
      '19-50': { male: 4,  female: 3  },
      '51-70': { male: 4,  female: 3  },
      '71+':   { male: 4,  female: 3  },
    },
    ul: 10,
    functions: [
      'Tooth enamel hardening and cavity prevention',
      'Bone strength maintenance',
      'Inhibits bacteria causing tooth decay',
    ],
    deficiencySymptoms: ['Increased tooth decay', 'Weakened tooth enamel', 'Higher cavity risk'],
    topFoods: ['Fluoridated water', 'Canned sardines', 'Shrimp', 'Raisins', 'Grape juice'],
    interactions: ['Excess fluoride causes fluorosis (tooth mottling)', 'Calcium may reduce fluoride absorption'],
  },
  {
    id: 'choline',
    name: 'Choline',
    unit: 'mg',
    category: 'mineral',
    rda: {
      '14-18': { male: 550, female: 400 },
      '19-50': { male: 550, female: 425 },
      '51-70': { male: 550, female: 425 },
      '71+':   { male: 550, female: 425 },
    },
    ul: 3500,
    functions: [
      'Cell membrane phosphatidylcholine structure',
      'Neurotransmitter acetylcholine synthesis',
      'Liver fat metabolism and VLDL export',
    ],
    deficiencySymptoms: ['Non-alcoholic fatty liver disease', 'Muscle damage', 'Cognitive decline and poor memory'],
    topFoods: ['Beef liver', 'Eggs', 'Salmon', 'Soybeans', 'Chicken breast'],
    interactions: ['Folate, B6, and B12 affect choline metabolism', 'Betaine can partially substitute for choline'],
  },
]

// ─── Age group helpers ────────────────────────────────────────────────────────

export function getAgeGroup(age: number): string {
  if (age < 19) return '14-18'
  if (age < 51) return '19-50'
  if (age < 71) return '51-70'
  return '71+'
}

export function getRDA(nutrient: Micronutrient, age: number, sex: 'male' | 'female'): number {
  const group = getAgeGroup(age)
  const groupData = nutrient.rda[group] ?? nutrient.rda['19-50']
  return groupData?.[sex] ?? groupData?.male ?? 0
}

// ─── Gap analysis ─────────────────────────────────────────────────────────────

export function analyzeGaps(
  logs: NutrientLog[],
  age: number,
  sex: 'male' | 'female',
  date: string,
): NutrientGapAnalysis[] {
  const todayLogs = logs.filter((l) => l.date === date)

  const totals: Record<string, number> = {}
  for (const log of todayLogs) {
    totals[log.nutrient_id] = (totals[log.nutrient_id] ?? 0) + log.amount
  }

  return MICRONUTRIENT_DB.map((nutrient) => {
    const logged_amount = totals[nutrient.id] ?? 0
    const rdaValue = getRDA(nutrient, age, sex)
    const percentage = rdaValue > 0 ? (logged_amount / rdaValue) * 100 : 0

    let status: NutrientGapAnalysis['status']
    if (nutrient.ul !== null && logged_amount > nutrient.ul) {
      status = 'excess'
    } else if (percentage > 150) {
      status = 'excess'
    } else if (percentage >= 100) {
      status = 'optimal'
    } else if (percentage >= 80) {
      status = 'adequate'
    } else if (percentage >= 50) {
      status = 'insufficient'
    } else {
      status = 'deficient'
    }

    return {
      nutrient,
      logged_amount,
      rda: rdaValue,
      percentage,
      status,
      gap_amount: Math.max(0, rdaValue - logged_amount),
      top_food_suggestions: nutrient.topFoods.slice(0, 3),
    }
  })
}

// ─── Weekly score ─────────────────────────────────────────────────────────────

export function getWeeklyScore(gapAnalyses: NutrientGapAnalysis[]): number {
  if (gapAnalyses.length === 0) return 0
  const total = gapAnalyses.reduce((sum, g) => sum + Math.min(g.percentage, 100), 0)
  return Math.round(total / gapAnalyses.length)
}
