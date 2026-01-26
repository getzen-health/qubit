//! Health metrics calculations
//!
//! Provides calculations for BMI, BMR, TDEE, and other health metrics.
//! All calculations follow established medical formulas.

use serde::{Deserialize, Serialize};

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

/// Health metrics data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
pub struct HealthMetrics {
    /// Weight in kilograms
    pub weight_kg: f64,
    /// Height in centimeters
    pub height_cm: f64,
    /// Age in years
    pub age_years: u32,
    /// Biological sex (true = male, false = female)
    pub is_male: bool,
    /// Activity level (1.2 = sedentary, 1.375 = light, 1.55 = moderate, 1.725 = active, 1.9 = very active)
    pub activity_level: f64,
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
impl HealthMetrics {
    #[wasm_bindgen(constructor)]
    pub fn new(weight_kg: f64, height_cm: f64, age_years: u32, is_male: bool, activity_level: f64) -> Self {
        Self {
            weight_kg,
            height_cm,
            age_years,
            is_male,
            activity_level,
        }
    }

    /// Calculate BMI for this health profile
    #[wasm_bindgen]
    pub fn bmi(&self) -> f64 {
        calculate_bmi(self.weight_kg, self.height_cm)
    }

    /// Calculate BMR for this health profile
    #[wasm_bindgen]
    pub fn bmr(&self) -> f64 {
        calculate_bmr(self.weight_kg, self.height_cm, self.age_years, self.is_male)
    }

    /// Calculate TDEE for this health profile
    #[wasm_bindgen]
    pub fn tdee(&self) -> f64 {
        calculate_tdee(self.weight_kg, self.height_cm, self.age_years, self.is_male, self.activity_level)
    }
}

/// Calculate Body Mass Index (BMI)
///
/// Formula: weight (kg) / height (m)²
///
/// # Arguments
/// * `weight_kg` - Weight in kilograms
/// * `height_cm` - Height in centimeters
///
/// # Returns
/// BMI value (typical range: 15-40)
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn calculate_bmi(weight_kg: f64, height_cm: f64) -> f64 {
    if height_cm <= 0.0 || weight_kg <= 0.0 {
        return 0.0;
    }
    let height_m = height_cm / 100.0;
    weight_kg / (height_m * height_m)
}

/// Get BMI category
///
/// # Arguments
/// * `bmi` - BMI value
///
/// # Returns
/// Category string
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn bmi_category(bmi: f64) -> String {
    match bmi {
        b if b < 18.5 => "Underweight".to_string(),
        b if b < 25.0 => "Normal".to_string(),
        b if b < 30.0 => "Overweight".to_string(),
        _ => "Obese".to_string(),
    }
}

/// Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor equation
///
/// This is more accurate than Harris-Benedict for modern populations.
///
/// Male: BMR = (10 × weight) + (6.25 × height) - (5 × age) + 5
/// Female: BMR = (10 × weight) + (6.25 × height) - (5 × age) - 161
///
/// # Arguments
/// * `weight_kg` - Weight in kilograms
/// * `height_cm` - Height in centimeters
/// * `age_years` - Age in years
/// * `is_male` - Biological sex
///
/// # Returns
/// BMR in calories per day
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn calculate_bmr(weight_kg: f64, height_cm: f64, age_years: u32, is_male: bool) -> f64 {
    if weight_kg <= 0.0 || height_cm <= 0.0 {
        return 0.0;
    }

    let base = (10.0 * weight_kg) + (6.25 * height_cm) - (5.0 * age_years as f64);

    if is_male {
        base + 5.0
    } else {
        base - 161.0
    }
}

/// Calculate Total Daily Energy Expenditure (TDEE)
///
/// TDEE = BMR × Activity Level
///
/// # Activity Levels:
/// * 1.2 - Sedentary (little to no exercise)
/// * 1.375 - Lightly active (light exercise 1-3 days/week)
/// * 1.55 - Moderately active (moderate exercise 3-5 days/week)
/// * 1.725 - Very active (hard exercise 6-7 days/week)
/// * 1.9 - Extra active (very hard exercise, physical job)
///
/// # Arguments
/// * `weight_kg` - Weight in kilograms
/// * `height_cm` - Height in centimeters
/// * `age_years` - Age in years
/// * `is_male` - Biological sex
/// * `activity_level` - Activity multiplier (1.2 - 1.9)
///
/// # Returns
/// TDEE in calories per day
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn calculate_tdee(
    weight_kg: f64,
    height_cm: f64,
    age_years: u32,
    is_male: bool,
    activity_level: f64,
) -> f64 {
    let bmr = calculate_bmr(weight_kg, height_cm, age_years, is_male);
    let clamped_activity = activity_level.clamp(1.0, 2.5);
    bmr * clamped_activity
}

/// Calculate recommended daily water intake
///
/// General rule: 30-35 ml per kg of body weight
///
/// # Arguments
/// * `weight_kg` - Weight in kilograms
///
/// # Returns
/// Recommended water intake in milliliters
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn recommended_water_intake(weight_kg: f64) -> f64 {
    if weight_kg <= 0.0 {
        return 2000.0; // Default recommendation
    }
    // Using 33 ml/kg as middle ground
    (weight_kg * 33.0).round()
}

/// Calculate ideal weight range using BMI 18.5-25
///
/// # Arguments
/// * `height_cm` - Height in centimeters
///
/// # Returns
/// Tuple of (min_weight_kg, max_weight_kg)
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn ideal_weight_range(height_cm: f64) -> Vec<f64> {
    if height_cm <= 0.0 {
        return vec![0.0, 0.0];
    }
    let height_m = height_cm / 100.0;
    let height_sq = height_m * height_m;

    vec![
        (18.5 * height_sq * 10.0).round() / 10.0,
        (24.9 * height_sq * 10.0).round() / 10.0,
    ]
}

/// Calculate body fat percentage estimate using US Navy method
///
/// This is an estimate based on circumference measurements.
///
/// # Arguments
/// * `waist_cm` - Waist circumference in cm
/// * `neck_cm` - Neck circumference in cm
/// * `height_cm` - Height in cm
/// * `hip_cm` - Hip circumference in cm (only used for females)
/// * `is_male` - Biological sex
///
/// # Returns
/// Estimated body fat percentage
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn estimate_body_fat(
    waist_cm: f64,
    neck_cm: f64,
    height_cm: f64,
    hip_cm: f64,
    is_male: bool,
) -> f64 {
    if waist_cm <= 0.0 || neck_cm <= 0.0 || height_cm <= 0.0 {
        return 0.0;
    }

    if is_male {
        // Male formula
        let log_diff = (waist_cm - neck_cm).max(1.0).log10();
        let log_height = height_cm.log10();
        86.010 * log_diff - 70.041 * log_height + 36.76
    } else {
        // Female formula
        if hip_cm <= 0.0 {
            return 0.0;
        }
        let log_sum = (waist_cm + hip_cm - neck_cm).max(1.0).log10();
        let log_height = height_cm.log10();
        163.205 * log_sum - 97.684 * log_height - 78.387
    }
}

/// Calculate heart rate zones based on max heart rate
///
/// # Arguments
/// * `max_hr` - Maximum heart rate (can be estimated as 220 - age)
///
/// # Returns
/// Vector of zone boundaries [zone1_min, zone1_max, zone2_max, zone3_max, zone4_max, zone5_max]
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn heart_rate_zones(max_hr: u32) -> Vec<u32> {
    let max = max_hr as f64;
    vec![
        (max * 0.50) as u32, // Zone 1 min (50%)
        (max * 0.60) as u32, // Zone 1 max / Zone 2 min (60%)
        (max * 0.70) as u32, // Zone 2 max / Zone 3 min (70%)
        (max * 0.80) as u32, // Zone 3 max / Zone 4 min (80%)
        (max * 0.90) as u32, // Zone 4 max / Zone 5 min (90%)
        max_hr,              // Zone 5 max (100%)
    ]
}

/// Estimate maximum heart rate based on age
///
/// Uses the Tanaka formula: 208 - (0.7 × age)
/// More accurate than the older 220 - age formula
///
/// # Arguments
/// * `age_years` - Age in years
///
/// # Returns
/// Estimated maximum heart rate
#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub fn estimate_max_heart_rate(age_years: u32) -> u32 {
    let max_hr = 208.0 - (0.7 * age_years as f64);
    max_hr.round() as u32
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bmi() {
        // 70kg, 170cm -> BMI ≈ 24.2
        let bmi = calculate_bmi(70.0, 170.0);
        assert!((bmi - 24.22).abs() < 0.1);
    }

    #[test]
    fn test_bmi_category() {
        assert_eq!(bmi_category(17.0), "Underweight");
        assert_eq!(bmi_category(22.0), "Normal");
        assert_eq!(bmi_category(27.0), "Overweight");
        assert_eq!(bmi_category(32.0), "Obese");
    }

    #[test]
    fn test_bmr() {
        // Male, 70kg, 175cm, 30 years
        let bmr = calculate_bmr(70.0, 175.0, 30, true);
        // (10 * 70) + (6.25 * 175) - (5 * 30) + 5 = 700 + 1093.75 - 150 + 5 = 1648.75
        assert!((bmr - 1648.75).abs() < 0.1);
    }

    #[test]
    fn test_tdee() {
        let tdee = calculate_tdee(70.0, 175.0, 30, true, 1.55);
        let expected = 1648.75 * 1.55;
        assert!((tdee - expected).abs() < 0.1);
    }

    #[test]
    fn test_water_intake() {
        let water = recommended_water_intake(70.0);
        assert_eq!(water, 2310.0); // 70 * 33 = 2310
    }

    #[test]
    fn test_ideal_weight() {
        let range = ideal_weight_range(175.0);
        assert_eq!(range.len(), 2);
        // 175cm = 1.75m, 1.75² = 3.0625
        // Min: 18.5 * 3.0625 = 56.7
        // Max: 24.9 * 3.0625 = 76.3
        assert!((range[0] - 56.7).abs() < 0.5);
        assert!((range[1] - 76.3).abs() < 0.5);
    }

    #[test]
    fn test_max_heart_rate() {
        // Age 30: 208 - (0.7 * 30) = 208 - 21 = 187
        assert_eq!(estimate_max_heart_rate(30), 187);
    }
}
