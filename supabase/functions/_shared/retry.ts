/**
 * Retry helper with exponential backoff and jitter
 * Retries on transient failures (429, 503, 504) and network errors
 */

export interface RetryOptions {
  maxRetries?: number
  baseDelay?: number // ms
  onRetry?: (attempt: number, error: Error) => void
}

const RETRYABLE_STATUSES = [429, 503, 504]

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, onRetry } = options

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1

      // Check if it's a fetch response with retryable status
      if (error instanceof Error && error.message.startsWith('HTTP')) {
        const statusMatch = error.message.match(/HTTP (\d+)/)
        if (statusMatch) {
          const status = parseInt(statusMatch[1])
          if (!RETRYABLE_STATUSES.includes(status) || isLastAttempt) {
            throw error
          }
        }
      }

      // Network errors and timeouts are always retryable (unless last attempt)
      if (isLastAttempt) {
        throw error
      }

      if (onRetry) {
        onRetry(attempt + 1, error instanceof Error ? error : new Error(String(error)))
      }

      // Exponential backoff with jitter: delay = baseDelay * 2^attempt + random(0, baseDelay)
      const exponentialDelay = baseDelay * Math.pow(2, attempt)
      const jitter = Math.random() * baseDelay
      const delay = exponentialDelay + jitter

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw new Error(`Failed after ${maxRetries} retries`)
}

/**
 * Wrapper for fetch with automatic retry and timeout
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit & { timeout?: number; retries?: RetryOptions } = {},
): Promise<Response> {
  const { timeout = 30000, retries } = options
  const fetchOptions = { ...options }
  delete (fetchOptions as any).timeout
  delete (fetchOptions as any).retries

  return retryWithBackoff(async () => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, { ...fetchOptions, signal: controller.signal })

      if (!response.ok && RETRYABLE_STATUSES.includes(response.status)) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response
    } finally {
      clearTimeout(timeoutId)
    }
  }, retries)
}
