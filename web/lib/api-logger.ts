const isDev = process.env.NODE_ENV !== 'production'

/**
 * Server-side API logger.
 * In development: logs full error including stack traces.
 * In production: logs message only — no stack traces or internal details exposed to log aggregators.
 */
export function apiLogger(message: string, ...args: unknown[]): void {
  if (isDev) {
    console.error('[API]', message, ...args)
  } else {
    console.error('[API]', message)
  }
}
