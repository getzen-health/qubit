import { NextResponse } from 'next/server'
import { versionedHeaders, type DeprecationOptions } from './api-version'

/**
 * Enhanced NextResponse.json that automatically includes API version headers.
 * Use this for all API responses to ensure consistency.
 *
 * @example
 * // Basic success response
 * return apiResponse({ data: users })
 *
 * @example
 * // With status code
 * return apiResponse({ error: 'Not found' }, 404)
 *
 * @example
 * // Deprecated endpoint
 * return apiResponse(
 *   { data: oldEndpoint },
 *   200,
 *   { removedInVersion: '2.0', migrateToUrl: '/api/v1/new-endpoint' }
 * )
 */
export function apiResponse<T>(
  data: T,
  status: number = 200,
  deprecation?: DeprecationOptions,
  extraHeaders?: Record<string, string>
) {
  return NextResponse.json(data, {
    status,
    headers: versionedHeaders(extraHeaders, deprecation),
  })
}

/**
 * API error response helper that includes version headers.
 *
 * @example
 * return apiError({ message: 'Unauthorized' }, 401)
 */
export function apiError(error: Record<string, unknown> | string, status: number = 500) {
  const errorData = typeof error === 'string' ? { error } : error
  return apiResponse(errorData, status)
}

/**
 * Creates a response with cache headers.
 * Useful for CDN-friendly responses.
 *
 * @example
 * return apiResponseWithCache({ data }, 200, 3600) // Cache for 1 hour
 */
export function apiResponseWithCache<T>(
  data: T,
  status: number = 200,
  cacheSeconds: number = 0,
  deprecation?: DeprecationOptions
) {
  const headers: Record<string, string> = {}

  if (cacheSeconds > 0) {
    headers['Cache-Control'] = `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`
  } else {
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
  }

  return apiResponse(data, status, deprecation, headers)
}
