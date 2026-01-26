/**
 * Unified API Security Wrapper
 * Combines rate limiting, validation, and audit logging for API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitHeaders,
  RATE_LIMITS,
} from './rate-limit'
import { applySecurityHeaders } from './headers'
import { createAuditContext, AuditAction, AuditResource } from './audit-log'
import { validateInput } from './validation'
import { redactForLogging } from './encryption'

interface SecureApiConfig {
  // Rate limiting
  rateLimit?: keyof typeof RATE_LIMITS
  skipRateLimit?: boolean

  // Authentication
  requireAuth?: boolean

  // Audit logging
  auditAction?: AuditAction
  auditResource?: AuditResource

  // Input validation
  bodySchema?: z.ZodSchema
  querySchema?: z.ZodSchema
}

interface SecureApiContext<TBody = unknown, TQuery = unknown> {
  user: { id: string; email?: string } | null
  body: TBody
  query: TQuery
  audit: ReturnType<typeof createAuditContext>
  supabase: Awaited<ReturnType<typeof createClient>>
}

type SecureApiHandler<TBody = unknown, TQuery = unknown> = (
  request: NextRequest,
  context: SecureApiContext<TBody, TQuery>
) => Promise<NextResponse>

/**
 * Create a secure API route handler
 */
export function createSecureApiHandler<TBody = unknown, TQuery = unknown>(
  config: SecureApiConfig,
  handler: SecureApiHandler<TBody, TQuery>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now()

    try {
      // 1. Rate limiting
      if (!config.skipRateLimit) {
        const clientId = getClientIdentifier(request)
        const rateLimitType = config.rateLimit || 'default'
        const rateLimit = checkRateLimit(clientId, rateLimitType)

        if (!rateLimit.allowed) {
          const response = NextResponse.json(
            {
              error: 'Too many requests',
              retryAfter: Math.ceil(rateLimit.resetIn / 1000),
            },
            { status: 429 }
          )
          applySecurityHeaders(response.headers)
          Object.entries(createRateLimitHeaders(0, rateLimit.resetIn)).forEach(
            ([key, value]) => response.headers.set(key, value)
          )
          return response
        }
      }

      // 2. Authentication
      const supabase = await createClient()
      let user: { id: string; email?: string } | null = null

      if (config.requireAuth !== false) {
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !authUser) {
          const response = NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          )
          applySecurityHeaders(response.headers)
          return response
        }
        user = { id: authUser.id, email: authUser.email }
      }

      // 3. Input validation - Body
      let validatedBody: TBody = {} as TBody
      if (config.bodySchema && request.method !== 'GET') {
        try {
          const rawBody = await request.json()
          const result = validateInput(config.bodySchema, rawBody)

          if (!result.success) {
            const response = NextResponse.json(
              { error: 'Invalid request body', details: result.error },
              { status: 400 }
            )
            applySecurityHeaders(response.headers)
            return response
          }
          validatedBody = result.data as TBody
        } catch {
          const response = NextResponse.json(
            { error: 'Invalid JSON body' },
            { status: 400 }
          )
          applySecurityHeaders(response.headers)
          return response
        }
      }

      // 4. Input validation - Query params
      let validatedQuery: TQuery = {} as TQuery
      if (config.querySchema) {
        const queryParams = Object.fromEntries(request.nextUrl.searchParams)
        const result = validateInput(config.querySchema, queryParams)

        if (!result.success) {
          const response = NextResponse.json(
            { error: 'Invalid query parameters', details: result.error },
            { status: 400 }
          )
          applySecurityHeaders(response.headers)
          return response
        }
        validatedQuery = result.data as TQuery
      }

      // 5. Create audit context
      const audit = createAuditContext(request)

      // 6. Execute handler
      const context: SecureApiContext<TBody, TQuery> = {
        user,
        body: validatedBody,
        query: validatedQuery,
        audit,
        supabase,
      }

      const response = await handler(request, context)

      // 7. Add security headers to response
      applySecurityHeaders(response.headers)

      // 8. Log successful request (if audit is configured)
      if (config.auditAction && config.auditResource && user) {
        await audit.log(user.id, config.auditAction, config.auditResource, {
          details: {
            method: request.method,
            path: request.nextUrl.pathname,
            duration_ms: Date.now() - startTime,
            body: redactForLogging(validatedBody as Record<string, unknown>),
          },
          success: true,
        })
      }

      return response
    } catch (error) {
      console.error('API error:', error)

      const response = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
      applySecurityHeaders(response.headers)
      return response
    }
  }
}

/**
 * Helper to create error response with security headers
 */
export function secureErrorResponse(
  message: string,
  status: number = 400
): NextResponse {
  const response = NextResponse.json({ error: message }, { status })
  applySecurityHeaders(response.headers)
  return response
}

/**
 * Helper to create success response with security headers
 */
export function secureJsonResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  const response = NextResponse.json(data, { status })
  applySecurityHeaders(response.headers)
  return response
}

/**
 * CORS headers for API routes (if needed for external access)
 */
export function addCorsHeaders(
  response: NextResponse,
  allowedOrigins: string[] = []
): NextResponse {
  // Only allow specific origins in production
  const origin = allowedOrigins[0] || ''

  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400')

  return response
}
