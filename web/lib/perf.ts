export async function measurePerf<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now()
  const result = await fn()
  const duration = performance.now() - start
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[Perf] ${name}: ${duration.toFixed(2)}ms`)
  }
  return result
}

export function withPerfHeaders(response: Response, durationMs: number): Response {
  const headers = new Headers(response.headers)
  headers.set('Server-Timing', `total;dur=${durationMs.toFixed(0)}`)
  return new Response(response.body, { status: response.status, headers })
}
