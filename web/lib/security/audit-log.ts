/**
 * Audit Logging for Health Data Operations
 * HIPAA-compliant audit trail for sensitive data access
 */

import { createClient } from '@/lib/supabase/server'

export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'LOGIN'
  | 'LOGOUT'
  | 'FAILED_LOGIN'
  | 'PERMISSION_DENIED'

export type AuditResource =
  | 'meal'
  | 'water_log'
  | 'fasting_session'
  | 'health_data'
  | 'user_profile'
  | 'nutrition_settings'
  | 'daily_summary'
  | 'auth'
  | 'daily_checkin'
  | 'habit'
  | 'user_preferences'
  | 'user_widgets'
  | 'workout'
  | 'ai_settings'
  | 'ai_chat'
  | 'predictions'
  | 'food_product'
  | 'friendship'
  | 'challenge'
  | 'user_data'
  | 'medication'
  | 'eye_health'
  | 'financial_wellness'
  | 'annotation'
  | 'achievement'
  | 'anomaly'
  | 'blood_pressure'
  | 'calorie_balance'

interface AuditLogEntry {
  user_id: string
  action: AuditAction
  resource: AuditResource
  resource_id?: string
  details?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  success: boolean
  error_message?: string
}

/**
 * Log an audit event to the database
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = await createClient()

    // Use service role for audit logs to ensure they're always written
    const { error: insertError } = await supabase.from('audit_logs').insert({
      user_id: entry.user_id,
      action: entry.action,
      resource_type: entry.resource,
      resource_id: entry.resource_id,
      details: entry.details,
      ip_address: entry.ip_address,
      user_agent: entry.user_agent,
      success: entry.success,
      error_message: entry.error_message,
      created_at: new Date().toISOString(),
    })
    if (insertError) throw insertError
  } catch (error) {
    // Don't throw - audit logging should never break the main flow
    console.error('Failed to write audit log:', error)
  }
}

/**
 * Create audit logger middleware for API routes
 */
export function createAuditContext(request: Request) {
  const ip = getClientIp(request)
  const userAgent = request.headers.get('user-agent') || 'unknown'

  return {
    ip,
    userAgent,
    log: async (
      userId: string,
      action: AuditAction,
      resource: AuditResource,
      options?: {
        resourceId?: string
        details?: Record<string, unknown>
        success?: boolean
        errorMessage?: string
      }
    ) => {
      await logAuditEvent({
        user_id: userId,
        action,
        resource,
        resource_id: options?.resourceId,
        details: options?.details,
        ip_address: ip,
        user_agent: userAgent,
        success: options?.success ?? true,
        error_message: options?.errorMessage,
      })
    },
  }
}

/**
 * Get client IP from request headers
 */
function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  if (cfConnectingIp) {
    return cfConnectingIp
  }
  if (realIp) {
    return realIp
  }
  return 'unknown'
}

/**
 * Log data export event (for compliance)
 */
export async function logDataExport(
  userId: string,
  exportType: 'full' | 'partial',
  dataTypes: string[],
  request: Request
): Promise<void> {
  await logAuditEvent({
    user_id: userId,
    action: 'EXPORT',
    resource: 'health_data',
    details: {
      export_type: exportType,
      data_types: dataTypes,
      timestamp: new Date().toISOString(),
    },
    ip_address: getClientIp(request),
    user_agent: request.headers.get('user-agent') || 'unknown',
    success: true,
  })
}

/**
 * Log authentication events
 */
export async function logAuthEvent(
  userId: string | null,
  action: 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN',
  request: Request,
  errorMessage?: string
): Promise<void> {
  await logAuditEvent({
    user_id: userId || 'anonymous',
    action,
    resource: 'auth',
    ip_address: getClientIp(request),
    user_agent: request.headers.get('user-agent') || 'unknown',
    success: action !== 'FAILED_LOGIN',
    error_message: errorMessage,
  })
}

/**
 * Log permission denied events (potential security threats)
 */
export async function logPermissionDenied(
  userId: string,
  resource: AuditResource,
  resourceId: string,
  request: Request
): Promise<void> {
  await logAuditEvent({
    user_id: userId,
    action: 'PERMISSION_DENIED',
    resource,
    resource_id: resourceId,
    ip_address: getClientIp(request),
    user_agent: request.headers.get('user-agent') || 'unknown',
    success: false,
    error_message: 'Attempted to access resource without permission',
  })
}
