/* @ts-self-types="./quarks_core.d.ts" */

/**
 * Health metrics data structure
 */
export class HealthMetrics {
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        HealthMetricsFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_healthmetrics_free(ptr, 0);
    }
    /**
     * Activity level (1.2 = sedentary, 1.375 = light, 1.55 = moderate, 1.725 = active, 1.9 = very active)
     * @returns {number}
     */
    get activity_level() {
        const ret = wasm.__wbg_get_healthmetrics_activity_level(this.__wbg_ptr);
        return ret;
    }
    /**
     * Age in years
     * @returns {number}
     */
    get age_years() {
        const ret = wasm.__wbg_get_healthmetrics_age_years(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Height in centimeters
     * @returns {number}
     */
    get height_cm() {
        const ret = wasm.__wbg_get_healthmetrics_height_cm(this.__wbg_ptr);
        return ret;
    }
    /**
     * Biological sex (true = male, false = female)
     * @returns {boolean}
     */
    get is_male() {
        const ret = wasm.__wbg_get_healthmetrics_is_male(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Weight in kilograms
     * @returns {number}
     */
    get weight_kg() {
        const ret = wasm.__wbg_get_healthmetrics_weight_kg(this.__wbg_ptr);
        return ret;
    }
    /**
     * Calculate BMI for this health profile
     * @returns {number}
     */
    bmi() {
        const ret = wasm.healthmetrics_bmi(this.__wbg_ptr);
        return ret;
    }
    /**
     * Calculate BMR for this health profile
     * @returns {number}
     */
    bmr() {
        const ret = wasm.healthmetrics_bmr(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} weight_kg
     * @param {number} height_cm
     * @param {number} age_years
     * @param {boolean} is_male
     * @param {number} activity_level
     */
    constructor(weight_kg, height_cm, age_years, is_male, activity_level) {
        const ret = wasm.healthmetrics_new(weight_kg, height_cm, age_years, is_male, activity_level);
        this.__wbg_ptr = ret >>> 0;
        HealthMetricsFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Calculate TDEE for this health profile
     * @returns {number}
     */
    tdee() {
        const ret = wasm.healthmetrics_tdee(this.__wbg_ptr);
        return ret;
    }
    /**
     * Activity level (1.2 = sedentary, 1.375 = light, 1.55 = moderate, 1.725 = active, 1.9 = very active)
     * @param {number} arg0
     */
    set activity_level(arg0) {
        wasm.__wbg_set_healthmetrics_activity_level(this.__wbg_ptr, arg0);
    }
    /**
     * Age in years
     * @param {number} arg0
     */
    set age_years(arg0) {
        wasm.__wbg_set_healthmetrics_age_years(this.__wbg_ptr, arg0);
    }
    /**
     * Height in centimeters
     * @param {number} arg0
     */
    set height_cm(arg0) {
        wasm.__wbg_set_healthmetrics_height_cm(this.__wbg_ptr, arg0);
    }
    /**
     * Biological sex (true = male, false = female)
     * @param {boolean} arg0
     */
    set is_male(arg0) {
        wasm.__wbg_set_healthmetrics_is_male(this.__wbg_ptr, arg0);
    }
    /**
     * Weight in kilograms
     * @param {number} arg0
     */
    set weight_kg(arg0) {
        wasm.__wbg_set_healthmetrics_weight_kg(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) HealthMetrics.prototype[Symbol.dispose] = HealthMetrics.prototype.free;

/**
 * Macro nutrient breakdown with percentages
 */
export class MacroBreakdown {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(MacroBreakdown.prototype);
        obj.__wbg_ptr = ptr;
        MacroBreakdownFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        MacroBreakdownFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_macrobreakdown_free(ptr, 0);
    }
    /**
     * Carbs grams
     * @returns {number}
     */
    get carbs_g() {
        const ret = wasm.__wbg_get_macrobreakdown_carbs_g(this.__wbg_ptr);
        return ret;
    }
    /**
     * Carbs percentage of total calories
     * @returns {number}
     */
    get carbs_pct() {
        const ret = wasm.__wbg_get_macrobreakdown_carbs_pct(this.__wbg_ptr);
        return ret;
    }
    /**
     * Fat grams
     * @returns {number}
     */
    get fat_g() {
        const ret = wasm.__wbg_get_macrobreakdown_fat_g(this.__wbg_ptr);
        return ret;
    }
    /**
     * Fat percentage of total calories
     * @returns {number}
     */
    get fat_pct() {
        const ret = wasm.__wbg_get_macrobreakdown_fat_pct(this.__wbg_ptr);
        return ret;
    }
    /**
     * Protein grams
     * @returns {number}
     */
    get protein_g() {
        const ret = wasm.__wbg_get_macrobreakdown_protein_g(this.__wbg_ptr);
        return ret;
    }
    /**
     * Protein percentage of total calories
     * @returns {number}
     */
    get protein_pct() {
        const ret = wasm.__wbg_get_macrobreakdown_protein_pct(this.__wbg_ptr);
        return ret;
    }
    /**
     * Total calories from macros
     * @returns {number}
     */
    get total_calories() {
        const ret = wasm.__wbg_get_macrobreakdown_total_calories(this.__wbg_ptr);
        return ret;
    }
    /**
     * Carbs grams
     * @param {number} arg0
     */
    set carbs_g(arg0) {
        wasm.__wbg_set_macrobreakdown_carbs_g(this.__wbg_ptr, arg0);
    }
    /**
     * Carbs percentage of total calories
     * @param {number} arg0
     */
    set carbs_pct(arg0) {
        wasm.__wbg_set_macrobreakdown_carbs_pct(this.__wbg_ptr, arg0);
    }
    /**
     * Fat grams
     * @param {number} arg0
     */
    set fat_g(arg0) {
        wasm.__wbg_set_macrobreakdown_fat_g(this.__wbg_ptr, arg0);
    }
    /**
     * Fat percentage of total calories
     * @param {number} arg0
     */
    set fat_pct(arg0) {
        wasm.__wbg_set_macrobreakdown_fat_pct(this.__wbg_ptr, arg0);
    }
    /**
     * Protein grams
     * @param {number} arg0
     */
    set protein_g(arg0) {
        wasm.__wbg_set_macrobreakdown_protein_g(this.__wbg_ptr, arg0);
    }
    /**
     * Protein percentage of total calories
     * @param {number} arg0
     */
    set protein_pct(arg0) {
        wasm.__wbg_set_macrobreakdown_protein_pct(this.__wbg_ptr, arg0);
    }
    /**
     * Total calories from macros
     * @param {number} arg0
     */
    set total_calories(arg0) {
        wasm.__wbg_set_macrobreakdown_total_calories(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) MacroBreakdown.prototype[Symbol.dispose] = MacroBreakdown.prototype.free;

/**
 * Nutritional information for a food item
 */
export class NutritionData {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(NutritionData.prototype);
        obj.__wbg_ptr = ptr;
        NutritionDataFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        NutritionDataFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_nutritiondata_free(ptr, 0);
    }
    /**
     * Calories (kcal)
     * @returns {number}
     */
    get calories() {
        const ret = wasm.__wbg_get_macrobreakdown_protein_g(this.__wbg_ptr);
        return ret;
    }
    /**
     * Carbohydrates (grams)
     * @returns {number}
     */
    get carbs() {
        const ret = wasm.__wbg_get_macrobreakdown_fat_g(this.__wbg_ptr);
        return ret;
    }
    /**
     * Cholesterol (milligrams)
     * @returns {number}
     */
    get cholesterol() {
        const ret = wasm.__wbg_get_nutritiondata_cholesterol(this.__wbg_ptr);
        return ret;
    }
    /**
     * Fat (grams)
     * @returns {number}
     */
    get fat() {
        const ret = wasm.__wbg_get_macrobreakdown_protein_pct(this.__wbg_ptr);
        return ret;
    }
    /**
     * Fiber (grams)
     * @returns {number}
     */
    get fiber() {
        const ret = wasm.__wbg_get_macrobreakdown_carbs_pct(this.__wbg_ptr);
        return ret;
    }
    /**
     * Protein (grams)
     * @returns {number}
     */
    get protein() {
        const ret = wasm.__wbg_get_macrobreakdown_carbs_g(this.__wbg_ptr);
        return ret;
    }
    /**
     * Saturated fat (grams)
     * @returns {number}
     */
    get saturated_fat() {
        const ret = wasm.__wbg_get_nutritiondata_saturated_fat(this.__wbg_ptr);
        return ret;
    }
    /**
     * Sodium (milligrams)
     * @returns {number}
     */
    get sodium() {
        const ret = wasm.__wbg_get_macrobreakdown_total_calories(this.__wbg_ptr);
        return ret;
    }
    /**
     * Sugar (grams)
     * @returns {number}
     */
    get sugar() {
        const ret = wasm.__wbg_get_macrobreakdown_fat_pct(this.__wbg_ptr);
        return ret;
    }
    /**
     * Create from basic macros only
     * @param {number} calories
     * @param {number} protein
     * @param {number} carbs
     * @param {number} fat
     * @returns {NutritionData}
     */
    static from_macros(calories, protein, carbs, fat) {
        const ret = wasm.nutritiondata_from_macros(calories, protein, carbs, fat);
        return NutritionData.__wrap(ret);
    }
    /**
     * Get macro breakdown for this nutrition data
     * @returns {MacroBreakdown}
     */
    macro_breakdown() {
        const ret = wasm.nutritiondata_macro_breakdown(this.__wbg_ptr);
        return MacroBreakdown.__wrap(ret);
    }
    /**
     * @param {number} calories
     * @param {number} protein
     * @param {number} carbs
     * @param {number} fat
     * @param {number} fiber
     * @param {number} sugar
     * @param {number} sodium
     * @param {number} saturated_fat
     * @param {number} cholesterol
     */
    constructor(calories, protein, carbs, fat, fiber, sugar, sodium, saturated_fat, cholesterol) {
        const ret = wasm.nutritiondata_new(calories, protein, carbs, fat, fiber, sugar, sodium, saturated_fat, cholesterol);
        this.__wbg_ptr = ret >>> 0;
        NutritionDataFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Scale nutrition data by a multiplier (for servings)
     * @param {number} multiplier
     * @returns {NutritionData}
     */
    scale(multiplier) {
        const ret = wasm.nutritiondata_scale(this.__wbg_ptr, multiplier);
        return NutritionData.__wrap(ret);
    }
    /**
     * Calories (kcal)
     * @param {number} arg0
     */
    set calories(arg0) {
        wasm.__wbg_set_macrobreakdown_protein_g(this.__wbg_ptr, arg0);
    }
    /**
     * Carbohydrates (grams)
     * @param {number} arg0
     */
    set carbs(arg0) {
        wasm.__wbg_set_macrobreakdown_fat_g(this.__wbg_ptr, arg0);
    }
    /**
     * Cholesterol (milligrams)
     * @param {number} arg0
     */
    set cholesterol(arg0) {
        wasm.__wbg_set_nutritiondata_cholesterol(this.__wbg_ptr, arg0);
    }
    /**
     * Fat (grams)
     * @param {number} arg0
     */
    set fat(arg0) {
        wasm.__wbg_set_macrobreakdown_protein_pct(this.__wbg_ptr, arg0);
    }
    /**
     * Fiber (grams)
     * @param {number} arg0
     */
    set fiber(arg0) {
        wasm.__wbg_set_macrobreakdown_carbs_pct(this.__wbg_ptr, arg0);
    }
    /**
     * Protein (grams)
     * @param {number} arg0
     */
    set protein(arg0) {
        wasm.__wbg_set_macrobreakdown_carbs_g(this.__wbg_ptr, arg0);
    }
    /**
     * Saturated fat (grams)
     * @param {number} arg0
     */
    set saturated_fat(arg0) {
        wasm.__wbg_set_nutritiondata_saturated_fat(this.__wbg_ptr, arg0);
    }
    /**
     * Sodium (milligrams)
     * @param {number} arg0
     */
    set sodium(arg0) {
        wasm.__wbg_set_macrobreakdown_total_calories(this.__wbg_ptr, arg0);
    }
    /**
     * Sugar (grams)
     * @param {number} arg0
     */
    set sugar(arg0) {
        wasm.__wbg_set_macrobreakdown_fat_pct(this.__wbg_ptr, arg0);
    }
}
if (Symbol.dispose) NutritionData.prototype[Symbol.dispose] = NutritionData.prototype.free;

/**
 * Get BMI category
 *
 * # Arguments
 * * `bmi` - BMI value
 *
 * # Returns
 * Category string
 * @param {number} bmi
 * @returns {string}
 */
export function bmi_category(bmi) {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.bmi_category(bmi);
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

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
 * @param {number} weight_kg
 * @param {number} height_cm
 * @returns {number}
 */
export function calculate_bmi(weight_kg, height_cm) {
    const ret = wasm.calculate_bmi(weight_kg, height_cm);
    return ret;
}

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
 * @param {number} weight_kg
 * @param {number} height_cm
 * @param {number} age_years
 * @param {boolean} is_male
 * @returns {number}
 */
export function calculate_bmr(weight_kg, height_cm, age_years, is_male) {
    const ret = wasm.calculate_bmr(weight_kg, height_cm, age_years, is_male);
    return ret;
}

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
 * @param {number} protein_g
 * @param {number} carbs_g
 * @param {number} fat_g
 * @returns {number}
 */
export function calculate_calories_from_macros(protein_g, carbs_g, fat_g) {
    const ret = wasm.calculate_calories_from_macros(protein_g, carbs_g, fat_g);
    return ret;
}

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
 * @param {number} tdee
 * @param {string} goal
 * @param {number} protein_per_kg
 * @param {number} weight_kg
 * @returns {NutritionData}
 */
export function calculate_daily_macros(tdee, goal, protein_per_kg, weight_kg) {
    const ptr0 = passStringToWasm0(goal, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.calculate_daily_macros(tdee, ptr0, len0, protein_per_kg, weight_kg);
    return NutritionData.__wrap(ret);
}

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
 * @param {number} glycemic_index
 * @param {number} carbs_g
 * @returns {number}
 */
export function calculate_glycemic_load(glycemic_index, carbs_g) {
    const ret = wasm.calculate_glycemic_load(glycemic_index, carbs_g);
    return ret;
}

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
 * @param {number} protein_g
 * @param {number} carbs_g
 * @param {number} fat_g
 * @returns {MacroBreakdown}
 */
export function calculate_macro_percentages(protein_g, carbs_g, fat_g) {
    const ret = wasm.calculate_macro_percentages(protein_g, carbs_g, fat_g);
    return MacroBreakdown.__wrap(ret);
}

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
 * @param {number} weight_kg
 * @param {number} height_cm
 * @param {number} age_years
 * @param {boolean} is_male
 * @param {number} activity_level
 * @returns {number}
 */
export function calculate_tdee(weight_kg, height_cm, age_years, is_male, activity_level) {
    const ret = wasm.calculate_tdee(weight_kg, height_cm, age_years, is_male, activity_level);
    return ret;
}

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
 * @param {number} meal_calories
 * @param {number} meal_protein
 * @param {number} meal_carbs
 * @param {number} meal_fat
 * @param {number} consumed_calories
 * @param {number} consumed_protein
 * @param {number} consumed_carbs
 * @param {number} consumed_fat
 * @param {number} target_calories
 * @param {number} target_protein
 * @param {number} target_carbs
 * @param {number} target_fat
 * @returns {string}
 */
export function check_meal_fits(meal_calories, meal_protein, meal_carbs, meal_fat, consumed_calories, consumed_protein, consumed_carbs, consumed_fat, target_calories, target_protein, target_carbs, target_fat) {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.check_meal_fits(meal_calories, meal_protein, meal_carbs, meal_fat, consumed_calories, consumed_protein, consumed_carbs, consumed_fat, target_calories, target_protein, target_carbs, target_fat);
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Decrypt data encrypted with AES-256-GCM
 *
 * # Arguments
 * * `encrypted_base64` - Base64 encoded ciphertext
 * * `key_base64` - Base64 encoded 256-bit key
 *
 * # Returns
 * Decrypted plaintext
 * @param {string} encrypted_base64
 * @param {string} key_base64
 * @returns {string}
 */
export function decrypt_data(encrypted_base64, key_base64) {
    let deferred4_0;
    let deferred4_1;
    try {
        const ptr0 = passStringToWasm0(encrypted_base64, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(key_base64, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.decrypt_data(ptr0, len0, ptr1, len1);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

/**
 * Encrypt data using AES-256-GCM
 *
 * # Arguments
 * * `plaintext` - The data to encrypt
 * * `key_base64` - Base64 encoded 256-bit key
 *
 * # Returns
 * Base64 encoded ciphertext (nonce + encrypted data + tag)
 * @param {string} plaintext
 * @param {string} key_base64
 * @returns {string}
 */
export function encrypt_data(plaintext, key_base64) {
    let deferred4_0;
    let deferred4_1;
    try {
        const ptr0 = passStringToWasm0(plaintext, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(key_base64, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.encrypt_data(ptr0, len0, ptr1, len1);
        var ptr3 = ret[0];
        var len3 = ret[1];
        if (ret[3]) {
            ptr3 = 0; len3 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred4_0 = ptr3;
        deferred4_1 = len3;
        return getStringFromWasm0(ptr3, len3);
    } finally {
        wasm.__wbindgen_free(deferred4_0, deferred4_1, 1);
    }
}

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
 * @param {number} waist_cm
 * @param {number} neck_cm
 * @param {number} height_cm
 * @param {number} hip_cm
 * @param {boolean} is_male
 * @returns {number}
 */
export function estimate_body_fat(waist_cm, neck_cm, height_cm, hip_cm, is_male) {
    const ret = wasm.estimate_body_fat(waist_cm, neck_cm, height_cm, hip_cm, is_male);
    return ret;
}

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
 * @param {number} age_years
 * @returns {number}
 */
export function estimate_max_heart_rate(age_years) {
    const ret = wasm.estimate_max_heart_rate(age_years);
    return ret >>> 0;
}

/**
 * Generate a new random encryption key (base64 encoded)
 * @returns {string}
 */
export function generate_key() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.generate_key();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Classify glycemic load
 *
 * Low: ≤10
 * Medium: 11-19
 * High: ≥20
 * @param {number} gl
 * @returns {string}
 */
export function glycemic_load_category(gl) {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.glycemic_load_category(gl);
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Hash data using SHA-256
 *
 * # Arguments
 * * `data` - Data to hash
 * * `salt` - Optional salt to add
 *
 * # Returns
 * Hex-encoded hash
 * @param {string} data
 * @param {string | null} [salt]
 * @returns {string}
 */
export function hash_data(data, salt) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(data, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        var ptr1 = isLikeNone(salt) ? 0 : passStringToWasm0(salt, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len1 = WASM_VECTOR_LEN;
        const ret = wasm.hash_data(ptr0, len0, ptr1, len1);
        deferred3_0 = ret[0];
        deferred3_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Calculate heart rate zones based on max heart rate
 *
 * # Arguments
 * * `max_hr` - Maximum heart rate (can be estimated as 220 - age)
 *
 * # Returns
 * Vector of zone boundaries [zone1_min, zone1_max, zone2_max, zone3_max, zone4_max, zone5_max]
 * @param {number} max_hr
 * @returns {Uint32Array}
 */
export function heart_rate_zones(max_hr) {
    const ret = wasm.heart_rate_zones(max_hr);
    var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
    return v1;
}

/**
 * Calculate ideal weight range using BMI 18.5-25
 *
 * # Arguments
 * * `height_cm` - Height in centimeters
 *
 * # Returns
 * Tuple of (min_weight_kg, max_weight_kg)
 * @param {number} height_cm
 * @returns {Float64Array}
 */
export function ideal_weight_range(height_cm) {
    const ret = wasm.ideal_weight_range(height_cm);
    var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
    wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
    return v1;
}

/**
 * Initialize the WASM module (sets up panic hook for better error messages)
 */
export function init() {
    wasm.init();
}

/**
 * Mask email for display
 * Example: "john@example.com" -> "j***@e******.com"
 * @param {string} email
 * @returns {string}
 */
export function mask_email(email) {
    let deferred2_0;
    let deferred2_1;
    try {
        const ptr0 = passStringToWasm0(email, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.mask_email(ptr0, len0);
        deferred2_0 = ret[0];
        deferred2_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * Mask sensitive string for display
 * Example: "John Smith" -> "J*** S****"
 * @param {string} input
 * @returns {string}
 */
export function mask_string(input) {
    let deferred2_0;
    let deferred2_1;
    try {
        const ptr0 = passStringToWasm0(input, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.mask_string(ptr0, len0);
        deferred2_0 = ret[0];
        deferred2_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

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
 * @param {number} weight_kg
 * @returns {number}
 */
export function recommended_water_intake(weight_kg) {
    const ret = wasm.recommended_water_intake(weight_kg);
    return ret;
}

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
 * @param {string} input
 * @returns {string}
 */
export function sanitize_string(input) {
    let deferred2_0;
    let deferred2_1;
    try {
        const ptr0 = passStringToWasm0(input, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.sanitize_string(ptr0, len0);
        deferred2_0 = ret[0];
        deferred2_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * Sanitize string with length limit
 *
 * # Arguments
 * * `input` - String to sanitize
 * * `max_length` - Maximum allowed length
 *
 * # Returns
 * Sanitized and truncated string
 * @param {string} input
 * @param {number} max_length
 * @returns {string}
 */
export function sanitize_string_with_limit(input, max_length) {
    let deferred2_0;
    let deferred2_1;
    try {
        const ptr0 = passStringToWasm0(input, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.sanitize_string_with_limit(ptr0, len0, max_length);
        deferred2_0 = ret[0];
        deferred2_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
    }
}

/**
 * Validate barcode format (UPC-A, EAN-13, EAN-8)
 *
 * # Arguments
 * * `barcode` - Barcode string to validate
 *
 * # Returns
 * true if valid, false otherwise
 * @param {string} barcode
 * @returns {boolean}
 */
export function validate_barcode(barcode) {
    const ptr0 = passStringToWasm0(barcode, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.validate_barcode(ptr0, len0);
    return ret !== 0;
}

/**
 * Validate date string in YYYY-MM-DD format
 *
 * # Arguments
 * * `date` - Date string to validate
 *
 * # Returns
 * true if valid, false otherwise
 * @param {string} date
 * @returns {boolean}
 */
export function validate_date(date) {
    const ptr0 = passStringToWasm0(date, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.validate_date(ptr0, len0);
    return ret !== 0;
}

/**
 * Validate datetime string in ISO 8601 format
 *
 * # Arguments
 * * `datetime` - Datetime string to validate
 *
 * # Returns
 * true if valid, false otherwise
 * @param {string} datetime
 * @returns {boolean}
 */
export function validate_datetime(datetime) {
    const ptr0 = passStringToWasm0(datetime, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.validate_datetime(ptr0, len0);
    return ret !== 0;
}

/**
 * Validate email format
 *
 * # Arguments
 * * `email` - Email address to validate
 *
 * # Returns
 * true if valid, false otherwise
 * @param {string} email
 * @returns {boolean}
 */
export function validate_email(email) {
    const ptr0 = passStringToWasm0(email, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.validate_email(ptr0, len0);
    return ret !== 0;
}

/**
 * Validate fasting protocol format (HH:MM)
 *
 * # Arguments
 * * `protocol` - Protocol string (e.g., "16:8")
 *
 * # Returns
 * true if valid, false otherwise
 * @param {string} protocol
 * @returns {boolean}
 */
export function validate_fasting_protocol(protocol) {
    const ptr0 = passStringToWasm0(protocol, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.validate_fasting_protocol(ptr0, len0);
    return ret !== 0;
}

/**
 * Validate and sanitize a food name
 *
 * # Arguments
 * * `name` - Food name to validate
 *
 * # Returns
 * Sanitized food name or error
 * @param {string} name
 * @returns {string}
 */
export function validate_food_name(name) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.validate_food_name(ptr0, len0);
        var ptr2 = ret[0];
        var len2 = ret[1];
        if (ret[3]) {
            ptr2 = 0; len2 = 0;
            throw takeFromExternrefTable0(ret[2]);
        }
        deferred3_0 = ptr2;
        deferred3_1 = len2;
        return getStringFromWasm0(ptr2, len2);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Validate meal type
 *
 * # Arguments
 * * `meal_type` - Meal type to validate
 *
 * # Returns
 * true if valid, false otherwise
 * @param {string} meal_type
 * @returns {boolean}
 */
export function validate_meal_type(meal_type) {
    const ptr0 = passStringToWasm0(meal_type, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.validate_meal_type(ptr0, len0);
    return ret !== 0;
}

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
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {boolean}
 */
export function validate_range(value, min, max) {
    const ret = wasm.validate_range(value, min, max);
    return ret !== 0;
}

/**
 * Validate UUID format
 *
 * # Arguments
 * * `uuid` - UUID string to validate
 *
 * # Returns
 * true if valid, false otherwise
 * @param {string} uuid
 * @returns {boolean}
 */
export function validate_uuid(uuid) {
    const ptr0 = passStringToWasm0(uuid, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.validate_uuid(ptr0, len0);
    return ret !== 0;
}

/**
 * Version of the library
 * @returns {string}
 */
export function version() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.version();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg___wbindgen_is_function_0095a73b8b156f76: function(arg0) {
            const ret = typeof(arg0) === 'function';
            return ret;
        },
        __wbg___wbindgen_is_object_5ae8e5880f2c1fbd: function(arg0) {
            const val = arg0;
            const ret = typeof(val) === 'object' && val !== null;
            return ret;
        },
        __wbg___wbindgen_is_string_cd444516edc5b180: function(arg0) {
            const ret = typeof(arg0) === 'string';
            return ret;
        },
        __wbg___wbindgen_is_undefined_9e4d92534c42d778: function(arg0) {
            const ret = arg0 === undefined;
            return ret;
        },
        __wbg___wbindgen_throw_be289d5034ed271b: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_call_389efe28435a9388: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.call(arg1);
            return ret;
        }, arguments); },
        __wbg_call_4708e0c13bdc8e95: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.call(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_crypto_86f2631e91b51511: function(arg0) {
            const ret = arg0.crypto;
            return ret;
        },
        __wbg_error_7534b8e9a36f1ab4: function(arg0, arg1) {
            let deferred0_0;
            let deferred0_1;
            try {
                deferred0_0 = arg0;
                deferred0_1 = arg1;
                console.error(getStringFromWasm0(arg0, arg1));
            } finally {
                wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
            }
        },
        __wbg_getRandomValues_b3f15fcbfabb0f8b: function() { return handleError(function (arg0, arg1) {
            arg0.getRandomValues(arg1);
        }, arguments); },
        __wbg_length_32ed9a279acd054c: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_msCrypto_d562bbe83e0d4b91: function(arg0) {
            const ret = arg0.msCrypto;
            return ret;
        },
        __wbg_new_8a6f238a6ece86ea: function() {
            const ret = new Error();
            return ret;
        },
        __wbg_new_no_args_1c7c842f08d00ebb: function(arg0, arg1) {
            const ret = new Function(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_new_with_length_a2c39cbe88fd8ff1: function(arg0) {
            const ret = new Uint8Array(arg0 >>> 0);
            return ret;
        },
        __wbg_node_e1f24f89a7336c2e: function(arg0) {
            const ret = arg0.node;
            return ret;
        },
        __wbg_process_3975fd6c72f520aa: function(arg0) {
            const ret = arg0.process;
            return ret;
        },
        __wbg_prototypesetcall_bdcdcc5842e4d77d: function(arg0, arg1, arg2) {
            Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
        },
        __wbg_randomFillSync_f8c153b79f285817: function() { return handleError(function (arg0, arg1) {
            arg0.randomFillSync(arg1);
        }, arguments); },
        __wbg_require_b74f47fc2d022fd6: function() { return handleError(function () {
            const ret = module.require;
            return ret;
        }, arguments); },
        __wbg_stack_0ed75d68575b0f3c: function(arg0, arg1) {
            const ret = arg1.stack;
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg_static_accessor_GLOBAL_12837167ad935116: function() {
            const ret = typeof global === 'undefined' ? null : global;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_GLOBAL_THIS_e628e89ab3b1c95f: function() {
            const ret = typeof globalThis === 'undefined' ? null : globalThis;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_SELF_a621d3dfbb60d0ce: function() {
            const ret = typeof self === 'undefined' ? null : self;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_WINDOW_f8727f0cf888e0bd: function() {
            const ret = typeof window === 'undefined' ? null : window;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_subarray_a96e1fef17ed23cb: function(arg0, arg1, arg2) {
            const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
            return ret;
        },
        __wbg_versions_4e31226f5e8dc909: function(arg0) {
            const ret = arg0.versions;
            return ret;
        },
        __wbindgen_cast_0000000000000001: function(arg0, arg1) {
            // Cast intrinsic for `Ref(Slice(U8)) -> NamedExternref("Uint8Array")`.
            const ret = getArrayU8FromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_cast_0000000000000002: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./quarks_core_bg.js": import0,
    };
}

const HealthMetricsFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_healthmetrics_free(ptr >>> 0, 1));
const MacroBreakdownFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_macrobreakdown_free(ptr >>> 0, 1));
const NutritionDataFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_nutritiondata_free(ptr >>> 0, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function getArrayF64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}

function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

let cachedFloat64ArrayMemory0 = null;
function getFloat64ArrayMemory0() {
    if (cachedFloat64ArrayMemory0 === null || cachedFloat64ArrayMemory0.byteLength === 0) {
        cachedFloat64ArrayMemory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint32ArrayMemory0 = null;
function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_externrefs.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasm;
function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedFloat64ArrayMemory0 = null;
    cachedUint32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('quarks_core_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
