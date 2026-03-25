/**
 * USDA FoodData Central Nutrient ID Mapping
 *
 * This module provides human-readable constants for USDA nutrient IDs.
 * These IDs are used when querying the USDA FoodData Central API (https://fdc.nal.usda.gov/).
 *
 * Each nutrient ID corresponds to a specific nutritional component in the USDA database.
 * The IDs are standardized by the USDA and documented in their API guide.
 * Reference: https://fdc.nal.usda.gov/api-guide.html
 */

/**
 * Primary macronutrients and energy.
 * These are the fundamental nutritional components used in health tracking.
 */
export const USDA_NUTRIENTS = {
  /** Energy provided by food, measured in kilocalories (kcal) */
  CALORIES: 1008,

  /** Protein content in grams */
  PROTEIN: 1003,

  /** Total fat content in grams */
  FAT: 1004,

  /** Total carbohydrates in grams */
  CARBOHYDRATES: 1005,

  /** Dietary fiber in grams */
  FIBER: 1079,

  /** Sugars in grams (total sugar) */
  SUGARS: 2000,

  /** Sodium content in milligrams */
  SODIUM: 1093,
} as const

/**
 * Helper function to get a human-readable name for a USDA nutrient ID.
 * Useful for displaying labels in the UI or logging.
 *
 * @param nutrientId - The USDA nutrient ID
 * @returns Human-readable name, or "Unknown" if ID not found
 *
 * @example
 * getNutrientName(1003) // Returns "Protein"
 * getNutrientName(1008) // Returns "Calories"
 */
export function getNutrientName(nutrientId: number): string {
  const entry = Object.entries(USDA_NUTRIENTS).find(([_, id]) => id === nutrientId)
  return entry ? entry[0].replace(/_/g, ' ') : 'Unknown'
}

/**
 * Map of nutrient IDs to their default units in the USDA database.
 * Note: Most nutrients are returned in per-100g serving size basis.
 */
export const NUTRIENT_UNITS: Record<number, string> = {
  [USDA_NUTRIENTS.CALORIES]: 'kcal',
  [USDA_NUTRIENTS.PROTEIN]: 'g',
  [USDA_NUTRIENTS.FAT]: 'g',
  [USDA_NUTRIENTS.CARBOHYDRATES]: 'g',
  [USDA_NUTRIENTS.FIBER]: 'g',
  [USDA_NUTRIENTS.SUGARS]: 'g',
  [USDA_NUTRIENTS.SODIUM]: 'mg',
}
