//! Nutrition data types and calculations
//!
//! Provides structures for nutritional data and macro calculations.

use serde::{Deserialize, Serialize};

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// Nutritional information for a food item
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct NutritionData {
    /// Calories (kcal)
    pub calories: f64,
    /// Protein (grams)
    pub protein: f64,
    /// Carbohydrates (grams)
    pub carbs: f64,
    /// Fat (grams)
    pub fat: f64,
    /// Fiber (grams)
    pub fiber: f64,
    /// Sugar (grams)
    pub sugar: f64,
    /// Sodium (milligrams)
    pub sodium: f64,
    /// Saturated fat (grams)
    pub saturated_fat: f64,
    /// Cholesterol (milligrams)
    pub cholesterol: f64,
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
impl NutritionData {
    #[wasm_bindgen(constructor)]
    pub fn new(
        calories: f64,
        protein: f64,
        carbs: f64,
        fat: f64,
        fiber: f64,
        sugar: f64,
        sodium: f64,
        saturated_fat: f64,
        cholesterol: f64,
    ) -> Self {
        Self {
            calories,
            protein,
            carbs,
            fat,
            fiber,
            sugar,
            sodium,
            saturated_fat,
            cholesterol,
        }
    }

    /// Create from basic macros only
    #[wasm_bindgen]
    pub fn from_macros(calories: f64, protein: f64, carbs: f64, fat: f64) -> Self {
        Self {
            calories,
            protein,
            carbs,
            fat,
            ..Default::default()
        }
    }

    /// Get macro breakdown for this nutrition data
    #[wasm_bindgen]
    pub fn macro_breakdown(&self) -> MacroBreakdown {
        calculate_macro_percentages(self.protein, self.carbs, self.fat)
    }

    /// Scale nutrition data by a multiplier (for servings)
    #[wasm_bindgen]
    pub fn scale(&self, multiplier: f64) -> NutritionData {
        NutritionData {
            calories: self.calories * multiplier,
            protein: self.protein * multiplier,
            carbs: self.carbs * multiplier,
            fat: self.fat * multiplier,
            fiber: self.fiber * multiplier,
            sugar: self.sugar * multiplier,
            sodium: self.sodium * multiplier,
            saturated_fat: self.saturated_fat * multiplier,
            cholesterol: self.cholesterol * multiplier,
        }
    }
}

impl NutritionData {
    /// Add two nutrition data together
    pub fn add(&self, other: &NutritionData) -> NutritionData {
        NutritionData {
            calories: self.calories + other.calories,
            protein: self.protein + other.protein,
            carbs: self.carbs + other.carbs,
            fat: self.fat + other.fat,
            fiber: self.fiber + other.fiber,
            sugar: self.sugar + other.sugar,
            sodium: self.sodium + other.sodium,
            saturated_fat: self.saturated_fat + other.saturated_fat,
            cholesterol: self.cholesterol + other.cholesterol,
        }
    }
}

/// Macro nutrient breakdown with percentages
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct MacroBreakdown {
    /// Protein grams
    pub protein_g: f64,
    /// Carbs grams
    pub carbs_g: f64,
    /// Fat grams
    pub fat_g: f64,
    /// Protein percentage of total calories
    pub protein_pct: f64,
    /// Carbs percentage of total calories
    pub carbs_pct: f64,
    /// Fat percentage of total calories
    pub fat_pct: f64,
    /// Total calories from macros
    pub total_calories: f64,
}

/// Calculate macro percentages from grams
///
/// Uses standard calorie values:
/// - Protein: 4 cal/g
/// - Carbs: 4 cal/g
/// - Fat: 9 cal/g
///
/// # Arguments
/// * `protein_g` - Protein in grams
/// * `carbs_g` - Carbohydrates in grams
/// * `fat_g` - Fat in grams
///
/// # Returns
/// MacroBreakdown with percentages
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn calculate_macro_percentages(protein_g: f64, carbs_g: f64, fat_g: f64) -> MacroBreakdown {
    let protein_cal = protein_g * 4.0;
    let carbs_cal = carbs_g * 4.0;
    let fat_cal = fat_g * 9.0;
    let total = protein_cal + carbs_cal + fat_cal;

    if total == 0.0 {
        return MacroBreakdown {
            protein_g,
            carbs_g,
            fat_g,
            protein_pct: 0.0,
            carbs_pct: 0.0,
            fat_pct: 0.0,
            total_calories: 0.0,
        };
    }

    MacroBreakdown {
        protein_g,
        carbs_g,
        fat_g,
        protein_pct: (protein_cal / total * 100.0).round(),
        carbs_pct: (carbs_cal / total * 100.0).round(),
        fat_pct: (fat_cal / total * 100.0).round(),
        total_calories: total,
    }
}

/// Calculate calories from macros
///
/// # Arguments
/// * `protein_g` - Protein in grams
/// * `carbs_g` - Carbohydrates in grams
/// * `fat_g` - Fat in grams
///
/// # Returns
/// Total calories
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn calculate_calories_from_macros(protein_g: f64, carbs_g: f64, fat_g: f64) -> f64 {
    (protein_g * 4.0) + (carbs_g * 4.0) + (fat_g * 9.0)
}

/// Calculate recommended daily macros based on TDEE and goal
///
/// # Arguments
/// * `tdee` - Total Daily Energy Expenditure
/// * `goal` - "lose", "maintain", or "gain"
/// * `protein_per_kg` - Protein per kg of body weight (default: 1.6-2.2 for active)
/// * `weight_kg` - Body weight in kg
///
/// # Returns
/// Recommended daily macros as NutritionData
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn calculate_daily_macros(
    tdee: f64,
    goal: &str,
    protein_per_kg: f64,
    weight_kg: f64,
) -> NutritionData {
    // Adjust calories based on goal
    let target_calories = match goal.to_lowercase().as_str() {
        "lose" => tdee * 0.80, // 20% deficit
        "gain" => tdee * 1.15, // 15% surplus
        _ => tdee,             // maintain
    };

    // Calculate protein first (most important)
    let protein_g = weight_kg * protein_per_kg.clamp(1.2, 2.5);
    let protein_cal = protein_g * 4.0;

    // Fat at 25% of calories
    let fat_cal = target_calories * 0.25;
    let fat_g = fat_cal / 9.0;

    // Remaining calories from carbs
    let carbs_cal = target_calories - protein_cal - fat_cal;
    let carbs_g = (carbs_cal / 4.0).max(50.0); // Minimum 50g carbs

    NutritionData {
        calories: target_calories,
        protein: protein_g,
        carbs: carbs_g,
        fat: fat_g,
        fiber: 25.0, // Recommended daily fiber
        ..Default::default()
    }
}

/// Check if a meal fits within remaining daily macros
///
/// # Arguments
/// * `meal` - Nutrition data of the meal
/// * `consumed` - Already consumed today
/// * `daily_target` - Daily macro targets
///
/// # Returns
/// JSON string with remaining macros and whether meal fits
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn check_meal_fits(
    meal_calories: f64,
    meal_protein: f64,
    meal_carbs: f64,
    meal_fat: f64,
    consumed_calories: f64,
    consumed_protein: f64,
    consumed_carbs: f64,
    consumed_fat: f64,
    target_calories: f64,
    target_protein: f64,
    target_carbs: f64,
    target_fat: f64,
) -> String {
    let remaining_calories = target_calories - consumed_calories;
    let remaining_protein = target_protein - consumed_protein;
    let remaining_carbs = target_carbs - consumed_carbs;
    let remaining_fat = target_fat - consumed_fat;

    let fits = meal_calories <= remaining_calories * 1.1; // Allow 10% overflow

    serde_json::json!({
        "fits": fits,
        "remaining": {
            "calories": remaining_calories,
            "protein": remaining_protein,
            "carbs": remaining_carbs,
            "fat": remaining_fat
        },
        "after_meal": {
            "calories": remaining_calories - meal_calories,
            "protein": remaining_protein - meal_protein,
            "carbs": remaining_carbs - meal_carbs,
            "fat": remaining_fat - meal_fat
        }
    })
    .to_string()
}

/// Calculate glycemic load
///
/// GL = (GI × carbs in grams) / 100
///
/// # Arguments
/// * `glycemic_index` - Glycemic index of food (0-100)
/// * `carbs_g` - Carbohydrates in grams
///
/// # Returns
/// Glycemic load value
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn calculate_glycemic_load(glycemic_index: f64, carbs_g: f64) -> f64 {
    (glycemic_index * carbs_g) / 100.0
}

/// Classify glycemic load
///
/// Low: ≤10
/// Medium: 11-19
/// High: ≥20
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn glycemic_load_category(gl: f64) -> String {
    match gl {
        g if g <= 10.0 => "Low".to_string(),
        g if g <= 19.0 => "Medium".to_string(),
        _ => "High".to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_macro_percentages() {
        // 100g protein (400 cal), 200g carbs (800 cal), 50g fat (450 cal)
        // Total: 1650 cal
        // Protein: 400/1650 = 24.2%
        // Carbs: 800/1650 = 48.5%
        // Fat: 450/1650 = 27.3%
        let breakdown = calculate_macro_percentages(100.0, 200.0, 50.0);

        assert_eq!(breakdown.total_calories, 1650.0);
        assert!((breakdown.protein_pct - 24.0).abs() < 1.0);
        assert!((breakdown.carbs_pct - 48.0).abs() < 1.0);
        assert!((breakdown.fat_pct - 27.0).abs() < 1.0);
    }

    #[test]
    fn test_calories_from_macros() {
        let cal = calculate_calories_from_macros(25.0, 50.0, 10.0);
        // 25*4 + 50*4 + 10*9 = 100 + 200 + 90 = 390
        assert_eq!(cal, 390.0);
    }

    #[test]
    fn test_daily_macros() {
        let macros = calculate_daily_macros(2000.0, "maintain", 2.0, 70.0);
        assert_eq!(macros.calories, 2000.0);
        assert_eq!(macros.protein, 140.0); // 70 * 2.0
    }

    #[test]
    fn test_glycemic_load() {
        // White bread: GI ~75, 15g carbs per slice
        let gl = calculate_glycemic_load(75.0, 15.0);
        assert_eq!(gl, 11.25);
        assert_eq!(glycemic_load_category(gl), "Medium");
    }

    #[test]
    fn test_nutrition_scale() {
        let nutrition = NutritionData::from_macros(100.0, 10.0, 20.0, 5.0);
        let scaled = nutrition.scale(2.0);
        assert_eq!(scaled.calories, 200.0);
        assert_eq!(scaled.protein, 20.0);
    }
}
