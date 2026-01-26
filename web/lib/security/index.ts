/**
 * Security Module Exports
 * Centralized security utilities for the health data application
 */

// Security headers
export { securityHeaders, applySecurityHeaders, getProductionCSP } from './headers'

// Rate limiting
export {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
  RATE_LIMITS,
} from './rate-limit'

// Input validation
export {
  // Schemas
  uuidSchema,
  dateSchema,
  sanitizedStringSchema,
  mealItemSchema,
  createMealSchema,
  waterLogSchema,
  startFastingSchema,
  endFastingSchema,
  barcodeSchema,
  foodImageSchema,
  paginationSchema,
  dateRangeSchema,
  // Utilities
  validateInput,
  sanitizeInput,
  sanitizeString,
  type ValidationResult,
} from './validation'

// Audit logging
export {
  logAuditEvent,
  createAuditContext,
  logDataExport,
  logAuthEvent,
  logPermissionDenied,
  type AuditAction,
  type AuditResource,
} from './audit-log'

// Encryption
export {
  generateEncryptionKey,
  encrypt,
  decrypt,
  hashSensitiveData,
  maskSensitiveString,
  maskEmail,
  redactForLogging,
  validateEncryptionKey,
} from './encryption'

// API security wrapper
export {
  createSecureApiHandler,
  secureErrorResponse,
  secureJsonResponse,
  addCorsHeaders,
} from './api-security'
