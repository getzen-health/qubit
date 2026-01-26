/* tslint:disable */
/* eslint-disable */

/**
 * Health metrics data structure
 */
export class HealthMetrics {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Calculate BMI for this health profile
     */
    bmi(): number;
    /**
     * Calculate BMR for this health profile
     */
    bmr(): number;
    constructor(weight_kg: number, height_cm: number, age_years: number, is_male: boolean, activity_level: number);
    /**
     * Calculate TDEE for this health profile
     */
    tdee(): number;
    /**
     * Activity level (1.2 = sedentary, 1.375 = light, 1.55 = moderate, 1.725 = active, 1.9 = very active)
     */
    activity_level: number;
    /**
     * Age in years
     */
    age_years: number;
    /**
     * Height in centimeters
     */
    height_cm: number;
    /**
     * Biological sex (true = male, false = female)
     */
    is_male: boolean;
    /**
     * Weight in kilograms
     */
    weight_kg: number;
}

/**
 * Macro nutrient breakdown with percentages
 */
export class MacroBreakdown {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Carbs grams
     */
    carbs_g: number;
    /**
     * Carbs percentage of total calories
     */
    carbs_pct: number;
    /**
     * Fat grams
     */
    fat_g: number;
    /**
     * Fat percentage of total calories
     */
    fat_pct: number;
    /**
     * Protein grams
     */
    protein_g: number;
    /**
     * Protein percentage of total calories
     */
    protein_pct: number;
    /**
     * Total calories from macros
     */
    total_calories: number;
}

/**
 * Nutritional information for a food item
 */
export class NutritionData {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Create from basic macros only
     */
    static from_macros(calories: number, protein: number, carbs: number, fat: number): NutritionData;
    /**
     * Get macro breakdown for this nutrition data
     */
    macro_breakdown(): MacroBreakdown;
    constructor(calories: number, protein: number, carbs: number, fat: number, fiber: number, sugar: number, sodium: number, saturated_fat: number, cholesterol: number);
    /**
     * Scale nutrition data by a multiplier (for servings)
     */
    scale(multiplier: number): NutritionData;
    /**
     * Calories (kcal)
     */
    calories: number;
    /**
     * Carbohydrates (grams)
     */
    carbs: number;
    /**
     * Cholesterol (milligrams)
     */
    cholesterol: number;
    /**
     * Fat (grams)
     */
    fat: number;
    /**
     * Fiber (grams)
     */
    fiber: number;
    /**
     * Protein (grams)
     */
    protein: number;
    /**
     * Saturated fat (grams)
     */
    saturated_fat: number;
    /**
     * Sodium (milligrams)
     */
    sodium: number;
    /**
     * Sugar (grams)
     */
    sugar: number;
}

/**
 * Get BMI category
 *
 * # Arguments
 * * `bmi` - BMI value
 *
 * # Returns
 * Category string
 */
export function bmi_category(bmi: number): string;

/**
 * Calculate Body Mass Index (BMI)
 *
 * Formula: weight (kg) / height (m)²
 *
 * # Arguments
 * * `weight_kg` - Weight in kilograms
 * * `height_cm` - Height in centimeters
 *
 * # Returns
 * BMI value (typical range: 15-40)
 */
export function calculate_bmi(weight_kg: number, height_cm: number): number;

/**
 * Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor equation
 *
 * This is more accurate than Harris-Benedict for modern populations.
 *
 * Male: BMR = (10 × weight) + (6.25 × height) - (5 × age) + 5
 * Female: BMR = (10 × weight) + (6.25 × height) - (5 × age) - 161
 *
 * # Arguments
 * * `weight_kg` - Weight in kilograms
 * * `height_cm` - Height in centimeters
 * * `age_years` - Age in years
 * * `is_male` - Biological sex
 *
 * # Returns
 * BMR in calories per day
 */
export function calculate_bmr(weight_kg: number, height_cm: number, age_years: number, is_male: boolean): number;

/**
 * Calculate calories from macros
 *
 * # Arguments
 * * `protein_g` - Protein in grams
 * * `carbs_g` - Carbohydrates in grams
 * * `fat_g` - Fat in grams
 *
 * # Returns
 * Total calories
 */
export function calculate_calories_from_macros(protein_g: number, carbs_g: number, fat_g: number): number;

/**
 * Calculate recommended daily macros based on TDEE and goal
 *
 * # Arguments
 * * `tdee` - Total Daily Energy Expenditure
 * * `goal` - "lose", "maintain", or "gain"
 * * `protein_per_kg` - Protein per kg of body weight (default: 1.6-2.2 for active)
 * * `weight_kg` - Body weight in kg
 *
 * # Returns
 * Recommended daily macros as NutritionData
 */
export function calculate_daily_macros(tdee: number, goal: string, protein_per_kg: number, weight_kg: number): NutritionData;

/**
 * Calculate glycemic load
 *
 * GL = (GI × carbs in grams) / 100
 *
 * # Arguments
 * * `glycemic_index` - Glycemic index of food (0-100)
 * * `carbs_g` - Carbohydrates in grams
 *
 * # Returns
 * Glycemic load value
 */
export function calculate_glycemic_load(glycemic_index: number, carbs_g: number): number;

/**
 * Calculate macro percentages from grams
 *
 * Uses standard calorie values:
 * - Protein: 4 cal/g
 * - Carbs: 4 cal/g
 * - Fat: 9 cal/g
 *
 * # Arguments
 * * `protein_g` - Protein in grams
 * * `carbs_g` - Carbohydrates in grams
 * * `fat_g` - Fat in grams
 *
 * # Returns
 * MacroBreakdown with percentages
 */
export function calculate_macro_percentages(protein_g: number, carbs_g: number, fat_g: number): MacroBreakdown;

/**
 * Calculate Total Daily Energy Expenditure (TDEE)
 *
 * TDEE = BMR × Activity Level
 *
 * # Activity Levels:
 * * 1.2 - Sedentary (little to no exercise)
 * * 1.375 - Lightly active (light exercise 1-3 days/week)
 * * 1.55 - Moderately active (moderate exercise 3-5 days/week)
 * * 1.725 - Very active (hard exercise 6-7 days/week)
 * * 1.9 - Extra active (very hard exercise, physical job)
 *
 * # Arguments
 * * `weight_kg` - Weight in kilograms
 * * `height_cm` - Height in centimeters
 * * `age_years` - Age in years
 * * `is_male` - Biological sex
 * * `activity_level` - Activity multiplier (1.2 - 1.9)
 *
 * # Returns
 * TDEE in calories per day
 */
export function calculate_tdee(weight_kg: number, height_cm: number, age_years: number, is_male: boolean, activity_level: number): number;

/**
 * Check if a meal fits within remaining daily macros
 *
 * # Arguments
 * * `meal` - Nutrition data of the meal
 * * `consumed` - Already consumed today
 * * `daily_target` - Daily macro targets
 *
 * # Returns
 * JSON string with remaining macros and whether meal fits
 */
export function check_meal_fits(meal_calories: number, meal_protein: number, meal_carbs: number, meal_fat: number, consumed_calories: number, consumed_protein: number, consumed_carbs: number, consumed_fat: number, target_calories: number, target_protein: number, target_carbs: number, target_fat: number): string;

/**
 * Decrypt data encrypted with AES-256-GCM
 *
 * # Arguments
 * * `encrypted_base64` - Base64 encoded ciphertext
 * * `key_base64` - Base64 encoded 256-bit key
 *
 * # Returns
 * Decrypted plaintext
 */
export function decrypt_data(encrypted_base64: string, key_base64: string): string;

/**
 * Encrypt data using AES-256-GCM
 *
 * # Arguments
 * * `plaintext` - The data to encrypt
 * * `key_base64` - Base64 encoded 256-bit key
 *
 * # Returns
 * Base64 encoded ciphertext (nonce + encrypted data + tag)
 */
export function encrypt_data(plaintext: string, key_base64: string): string;

/**
 * Calculate body fat percentage estimate using US Navy method
 *
 * This is an estimate based on circumference measurements.
 *
 * # Arguments
 * * `waist_cm` - Waist circumference in cm
 * * `neck_cm` - Neck circumference in cm
 * * `height_cm` - Height in cm
 * * `hip_cm` - Hip circumference in cm (only used for females)
 * * `is_male` - Biological sex
 *
 * # Returns
 * Estimated body fat percentage
 */
export function estimate_body_fat(waist_cm: number, neck_cm: number, height_cm: number, hip_cm: number, is_male: boolean): number;

/**
 * Estimate maximum heart rate based on age
 *
 * Uses the Tanaka formula: 208 - (0.7 × age)
 * More accurate than the older 220 - age formula
 *
 * # Arguments
 * * `age_years` - Age in years
 *
 * # Returns
 * Estimated maximum heart rate
 */
export function estimate_max_heart_rate(age_years: number): number;

/**
 * Generate a new random encryption key (base64 encoded)
 */
export function generate_key(): string;

/**
 * Classify glycemic load
 *
 * Low: ≤10
 * Medium: 11-19
 * High: ≥20
 */
export function glycemic_load_category(gl: number): string;

/**
 * Hash data using SHA-256
 *
 * # Arguments
 * * `data` - Data to hash
 * * `salt` - Optional salt to add
 *
 * # Returns
 * Hex-encoded hash
 */
export function hash_data(data: string, salt?: string | null): string;

/**
 * Calculate heart rate zones based on max heart rate
 *
 * # Arguments
 * * `max_hr` - Maximum heart rate (can be estimated as 220 - age)
 *
 * # Returns
 * Vector of zone boundaries [zone1_min, zone1_max, zone2_max, zone3_max, zone4_max, zone5_max]
 */
export function heart_rate_zones(max_hr: number): Uint32Array;

/**
 * Calculate ideal weight range using BMI 18.5-25
 *
 * # Arguments
 * * `height_cm` - Height in centimeters
 *
 * # Returns
 * Tuple of (min_weight_kg, max_weight_kg)
 */
export function ideal_weight_range(height_cm: number): Float64Array;

/**
 * Initialize the WASM module (sets up panic hook for better error messages)
 */
export function init(): void;

/**
 * Mask email for display
 * Example: "john@example.com" -> "j***@e******.com"
 */
export function mask_email(email: string): string;

/**
 * Mask sensitive string for display
 * Example: "John Smith" -> "J*** S****"
 */
export function mask_string(input: string): string;

/**
 * Calculate recommended daily water intake
 *
 * General rule: 30-35 ml per kg of body weight
 *
 * # Arguments
 * * `weight_kg` - Weight in kilograms
 *
 * # Returns
 * Recommended water intake in milliliters
 */
export function recommended_water_intake(weight_kg: number): number;

/**
 * Sanitize string input by removing dangerous characters
 *
 * Removes HTML tags and special characters that could be used for XSS
 *
 * # Arguments
 * * `input` - String to sanitize
 *
 * # Returns
 * Sanitized string
 */
export function sanitize_string(input: string): string;

/**
 * Sanitize string with length limit
 *
 * # Arguments
 * * `input` - String to sanitize
 * * `max_length` - Maximum allowed length
 *
 * # Returns
 * Sanitized and truncated string
 */
export function sanitize_string_with_limit(input: string, max_length: number): string;

/**
 * Validate barcode format (UPC-A, EAN-13, EAN-8)
 *
 * # Arguments
 * * `barcode` - Barcode string to validate
 *
 * # Returns
 * true if valid, false otherwise
 */
export function validate_barcode(barcode: string): boolean;

/**
 * Validate date string in YYYY-MM-DD format
 *
 * # Arguments
 * * `date` - Date string to validate
 *
 * # Returns
 * true if valid, false otherwise
 */
export function validate_date(date: string): boolean;

/**
 * Validate datetime string in ISO 8601 format
 *
 * # Arguments
 * * `datetime` - Datetime string to validate
 *
 * # Returns
 * true if valid, false otherwise
 */
export function validate_datetime(datetime: string): boolean;

/**
 * Validate email format
 *
 * # Arguments
 * * `email` - Email address to validate
 *
 * # Returns
 * true if valid, false otherwise
 */
export function validate_email(email: string): boolean;

/**
 * Validate fasting protocol format (HH:MM)
 *
 * # Arguments
 * * `protocol` - Protocol string (e.g., "16:8")
 *
 * # Returns
 * true if valid, false otherwise
 */
export function validate_fasting_protocol(protocol: string): boolean;

/**
 * Validate and sanitize a food name
 *
 * # Arguments
 * * `name` - Food name to validate
 *
 * # Returns
 * Sanitized food name or error
 */
export function validate_food_name(name: string): string;

/**
 * Validate meal type
 *
 * # Arguments
 * * `meal_type` - Meal type to validate
 *
 * # Returns
 * true if valid, false otherwise
 */
export function validate_meal_type(meal_type: string): boolean;

/**
 * Validate number is within range
 *
 * # Arguments
 * * `value` - Value to validate
 * * `min` - Minimum allowed value
 * * `max` - Maximum allowed value
 *
 * # Returns
 * true if within range, false otherwise
 */
export function validate_range(value: number, min: number, max: number): boolean;

/**
 * Validate UUID format
 *
 * # Arguments
 * * `uuid` - UUID string to validate
 *
 * # Returns
 * true if valid, false otherwise
 */
export function validate_uuid(uuid: string): boolean;

/**
 * Version of the library
 */
export function version(): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly sanitize_string: (a: number, b: number) => [number, number];
    readonly sanitize_string_with_limit: (a: number, b: number, c: number) => [number, number];
    readonly validate_barcode: (a: number, b: number) => number;
    readonly validate_date: (a: number, b: number) => number;
    readonly validate_datetime: (a: number, b: number) => number;
    readonly validate_email: (a: number, b: number) => number;
    readonly validate_fasting_protocol: (a: number, b: number) => number;
    readonly validate_food_name: (a: number, b: number) => [number, number, number, number];
    readonly validate_meal_type: (a: number, b: number) => number;
    readonly validate_range: (a: number, b: number, c: number) => number;
    readonly validate_uuid: (a: number, b: number) => number;
    readonly decrypt_data: (a: number, b: number, c: number, d: number) => [number, number, number, number];
    readonly encrypt_data: (a: number, b: number, c: number, d: number) => [number, number, number, number];
    readonly generate_key: () => [number, number];
    readonly hash_data: (a: number, b: number, c: number, d: number) => [number, number];
    readonly mask_email: (a: number, b: number) => [number, number];
    readonly mask_string: (a: number, b: number) => [number, number];
    readonly __wbg_get_macrobreakdown_carbs_g: (a: number) => number;
    readonly __wbg_get_macrobreakdown_carbs_pct: (a: number) => number;
    readonly __wbg_get_macrobreakdown_fat_g: (a: number) => number;
    readonly __wbg_get_macrobreakdown_fat_pct: (a: number) => number;
    readonly __wbg_get_macrobreakdown_protein_g: (a: number) => number;
    readonly __wbg_get_macrobreakdown_protein_pct: (a: number) => number;
    readonly __wbg_get_macrobreakdown_total_calories: (a: number) => number;
    readonly __wbg_get_nutritiondata_cholesterol: (a: number) => number;
    readonly __wbg_get_nutritiondata_saturated_fat: (a: number) => number;
    readonly __wbg_macrobreakdown_free: (a: number, b: number) => void;
    readonly __wbg_nutritiondata_free: (a: number, b: number) => void;
    readonly __wbg_set_macrobreakdown_carbs_g: (a: number, b: number) => void;
    readonly __wbg_set_macrobreakdown_carbs_pct: (a: number, b: number) => void;
    readonly __wbg_set_macrobreakdown_fat_g: (a: number, b: number) => void;
    readonly __wbg_set_macrobreakdown_fat_pct: (a: number, b: number) => void;
    readonly __wbg_set_macrobreakdown_protein_g: (a: number, b: number) => void;
    readonly __wbg_set_macrobreakdown_protein_pct: (a: number, b: number) => void;
    readonly __wbg_set_macrobreakdown_total_calories: (a: number, b: number) => void;
    readonly __wbg_set_nutritiondata_cholesterol: (a: number, b: number) => void;
    readonly __wbg_set_nutritiondata_saturated_fat: (a: number, b: number) => void;
    readonly calculate_calories_from_macros: (a: number, b: number, c: number) => number;
    readonly calculate_daily_macros: (a: number, b: number, c: number, d: number, e: number) => number;
    readonly calculate_glycemic_load: (a: number, b: number) => number;
    readonly calculate_macro_percentages: (a: number, b: number, c: number) => number;
    readonly check_meal_fits: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number) => [number, number];
    readonly glycemic_load_category: (a: number) => [number, number];
    readonly nutritiondata_from_macros: (a: number, b: number, c: number, d: number) => number;
    readonly nutritiondata_macro_breakdown: (a: number) => number;
    readonly nutritiondata_new: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => number;
    readonly nutritiondata_scale: (a: number, b: number) => number;
    readonly __wbg_set_nutritiondata_calories: (a: number, b: number) => void;
    readonly __wbg_set_nutritiondata_carbs: (a: number, b: number) => void;
    readonly __wbg_set_nutritiondata_fat: (a: number, b: number) => void;
    readonly __wbg_set_nutritiondata_fiber: (a: number, b: number) => void;
    readonly __wbg_set_nutritiondata_protein: (a: number, b: number) => void;
    readonly __wbg_set_nutritiondata_sodium: (a: number, b: number) => void;
    readonly __wbg_set_nutritiondata_sugar: (a: number, b: number) => void;
    readonly __wbg_get_nutritiondata_calories: (a: number) => number;
    readonly __wbg_get_nutritiondata_carbs: (a: number) => number;
    readonly __wbg_get_nutritiondata_fat: (a: number) => number;
    readonly __wbg_get_nutritiondata_fiber: (a: number) => number;
    readonly __wbg_get_nutritiondata_protein: (a: number) => number;
    readonly __wbg_get_nutritiondata_sodium: (a: number) => number;
    readonly __wbg_get_nutritiondata_sugar: (a: number) => number;
    readonly init: () => void;
    readonly version: () => [number, number];
    readonly __wbg_get_healthmetrics_activity_level: (a: number) => number;
    readonly __wbg_get_healthmetrics_age_years: (a: number) => number;
    readonly __wbg_get_healthmetrics_height_cm: (a: number) => number;
    readonly __wbg_get_healthmetrics_is_male: (a: number) => number;
    readonly __wbg_get_healthmetrics_weight_kg: (a: number) => number;
    readonly __wbg_healthmetrics_free: (a: number, b: number) => void;
    readonly __wbg_set_healthmetrics_activity_level: (a: number, b: number) => void;
    readonly __wbg_set_healthmetrics_age_years: (a: number, b: number) => void;
    readonly __wbg_set_healthmetrics_height_cm: (a: number, b: number) => void;
    readonly __wbg_set_healthmetrics_is_male: (a: number, b: number) => void;
    readonly __wbg_set_healthmetrics_weight_kg: (a: number, b: number) => void;
    readonly bmi_category: (a: number) => [number, number];
    readonly calculate_bmi: (a: number, b: number) => number;
    readonly calculate_bmr: (a: number, b: number, c: number, d: number) => number;
    readonly calculate_tdee: (a: number, b: number, c: number, d: number, e: number) => number;
    readonly estimate_body_fat: (a: number, b: number, c: number, d: number, e: number) => number;
    readonly estimate_max_heart_rate: (a: number) => number;
    readonly healthmetrics_bmi: (a: number) => number;
    readonly healthmetrics_bmr: (a: number) => number;
    readonly healthmetrics_new: (a: number, b: number, c: number, d: number, e: number) => number;
    readonly healthmetrics_tdee: (a: number) => number;
    readonly heart_rate_zones: (a: number) => [number, number];
    readonly ideal_weight_range: (a: number) => [number, number];
    readonly recommended_water_intake: (a: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
