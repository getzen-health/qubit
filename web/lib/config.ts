/**
 * Application Configuration
 *
 * This module provides configuration constants that are backed by environment variables.
 * All limits, page sizes, and other configurable values should be defined here to avoid
 * magic numbers scattered throughout the codebase.
 *
 * Environment variables should be set in .env.local (development) or your deployment
 * platform's environment variable settings (production).
 */

/**
 * API Request/Response Configuration
 */
export const API_CONFIG = {
  /** Maximum number of chat messages in a single request */
  MAX_CHAT_MESSAGES: parseInt(process.env.MAX_CHAT_MESSAGES || '50'),

  /** Maximum content length for Claude API requests (in characters) */
  MAX_CONTENT_LENGTH: parseInt(process.env.MAX_CONTENT_LENGTH || '5000'),

  /** Maximum system prompt length (in characters) */
  MAX_SYSTEM_PROMPT_LENGTH: parseInt(process.env.MAX_SYSTEM_PROMPT_LENGTH || '2000'),

  /** Maximum length for API keys stored in database (in characters) */
  MAX_API_KEY_LENGTH: parseInt(process.env.MAX_API_KEY_LENGTH || '500'),
} as const

/**
 * Food/Nutrition API Configuration
 */
export const FOOD_API_CONFIG = {
  /** Maximum number of food search results per page */
  MAX_SEARCH_PAGE_SIZE: parseInt(process.env.MAX_SEARCH_PAGE_SIZE || '20'),

  /** Maximum page number allowed for food searches */
  MAX_SEARCH_PAGE: parseInt(process.env.MAX_SEARCH_PAGE || '100'),

  /** Maximum length for food name input (in characters) */
  MAX_FOOD_NAME_LENGTH: parseInt(process.env.MAX_FOOD_NAME_LENGTH || '200'),

  /** Maximum calorie value per meal entry */
  MAX_CALORIES: parseInt(process.env.MAX_CALORIES || '10000'),

  /** Maximum macronutrient value in grams per meal entry */
  MAX_MACRONUTRIENT_G: parseInt(process.env.MAX_MACRONUTRIENT_G || '1000'),

  /** Maximum note length for meals (in characters) */
  MAX_MEAL_NOTE_LENGTH: parseInt(process.env.MAX_MEAL_NOTE_LENGTH || '500'),

  /** Maximum barcode length (EAN-13 standard) */
  MAX_BARCODE_LENGTH: parseInt(process.env.MAX_BARCODE_LENGTH || '14'),

  /** Maximum product name length */
  MAX_PRODUCT_NAME_LENGTH: parseInt(process.env.MAX_PRODUCT_NAME_LENGTH || '255'),

  /** Maximum food history limit per request */
  MAX_FOOD_HISTORY_LIMIT: parseInt(process.env.MAX_FOOD_HISTORY_LIMIT || '50'),

  /** Default food history limit per request */
  DEFAULT_FOOD_HISTORY_LIMIT: parseInt(process.env.DEFAULT_FOOD_HISTORY_LIMIT || '20'),
} as const

/**
 * Workout/Activity API Configuration
 */
export const WORKOUT_API_CONFIG = {
  /** Maximum number of workouts to return in "more" endpoint */
  MAX_WORKOUTS_LIMIT: parseInt(process.env.MAX_WORKOUTS_LIMIT || '100'),

  /** Default number of workouts per request */
  DEFAULT_WORKOUTS_LIMIT: parseInt(process.env.DEFAULT_WORKOUTS_LIMIT || '30'),
} as const

/**
 * Health Data API Configuration
 */
export const HEALTH_API_CONFIG = {
  /** Maximum glucose samples returned per query */
  MAX_GLUCOSE_SAMPLES: parseInt(process.env.MAX_GLUCOSE_SAMPLES || '288'),

  /** Maximum number of days to retrieve health history */
  MAX_HISTORY_DAYS: parseInt(process.env.MAX_HISTORY_DAYS || '365'),

  /** Default number of days for health history */
  DEFAULT_HISTORY_DAYS: parseInt(process.env.DEFAULT_HISTORY_DAYS || '30'),

  /** Maximum fasting records per request */
  MAX_FASTING_RECORDS_LIMIT: parseInt(process.env.MAX_FASTING_RECORDS_LIMIT || '50'),

  /** Default fasting records per request */
  DEFAULT_FASTING_RECORDS_LIMIT: parseInt(process.env.DEFAULT_FASTING_RECORDS_LIMIT || '10'),

  /** Maximum check-in history days */
  MAX_CHECKIN_DAYS: parseInt(process.env.MAX_CHECKIN_DAYS || '90'),
} as const

/**
 * File Upload Configuration
 */
export const FILE_CONFIG = {
  /** Maximum file size for uploads in bytes (50 MB default) */
  MAX_FILE_SIZE_BYTES: parseInt(process.env.MAX_FILE_SIZE_BYTES || String(50 * 1024 * 1024)),
} as const

/**
 * Validation Configuration
 */
export const VALIDATION_CONFIG = {
  /** Maximum length for string fields (in characters) */
  MAX_STRING_LENGTH: parseInt(process.env.MAX_STRING_LENGTH || '500'),

  /** Maximum length for titles/names (in characters) */
  MAX_TITLE_LENGTH: parseInt(process.env.MAX_TITLE_LENGTH || '120'),

  /** Maximum category name length (in characters) */
  MAX_CATEGORY_LENGTH: parseInt(process.env.MAX_CATEGORY_LENGTH || '100'),

  /** Minimum category name length (in characters) */
  MIN_CATEGORY_LENGTH: parseInt(process.env.MIN_CATEGORY_LENGTH || '2'),
} as const
