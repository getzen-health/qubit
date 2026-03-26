export const CACHE_PRESETS = {
  // Static data that rarely changes
  static: 'public, max-age=86400, stale-while-revalidate=604800',
  // API data that changes daily
  daily: 'public, max-age=3600, stale-while-revalidate=86400',
  // User-specific private data
  private: 'private, max-age=300, stale-while-revalidate=600',
  // No caching for real-time data
  noCache: 'no-store, no-cache, must-revalidate',
} as const

export function withCacheHeaders(
  response: Response,
  preset: keyof typeof CACHE_PRESETS
): Response {
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', CACHE_PRESETS[preset])
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

export function getCacheHeaders(preset: keyof typeof CACHE_PRESETS): Record<string, string> {
  return { 'Cache-Control': CACHE_PRESETS[preset] }
}
