import { NextResponse } from 'next/server'

export const API_VERSION = "1.0"
export const API_BASE = `/api/v1`

export interface DeprecationOptions {
  /** Version when this endpoint will be removed */
  removedInVersion?: string
  /** Migration guide URL or message */
  migrateToUrl?: string
  /** Additional deprecation message */
  message?: string
}

/** Returns consistent versioned response headers. */
export function versionedHeaders(extra?: Record<string, string>, deprecation?: DeprecationOptions) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  }

  // Always set versioning headers AFTER extra headers to ensure they take precedence
  headers["X-API-Version"] = API_VERSION
  headers["X-App-Version"] = process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0"

  // Add deprecation headers if specified
  if (deprecation) {
    if (deprecation.removedInVersion) {
      headers["X-Deprecated"] = "true"
      headers["X-Deprecated-Removed-Version"] = deprecation.removedInVersion
    }
    if (deprecation.migrateToUrl) {
      headers["X-Deprecated-Migrate-To"] = deprecation.migrateToUrl
    }
    if (deprecation.message) {
      // Base64 encode message to avoid header issues with special characters
      headers["X-Deprecated-Message"] = Buffer.from(deprecation.message).toString('base64')
    }
  }

  return headers
}

/**
 * Wraps NextResponse.json with versioned headers automatically applied.
 * This ensures all API responses include version information.
 */
export function versionedJsonResponse<T>(
  data: T,
  init?: ResponseInit,
  deprecation?: DeprecationOptions
) {
  const headers = versionedHeaders(
    init?.headers instanceof Headers
      ? Object.fromEntries(init.headers)
      : typeof init?.headers === 'object'
        ? (init.headers as Record<string, string>)
        : {},
    deprecation
  )

  return NextResponse.json(data, {
    ...init,
    headers,
  })
}
