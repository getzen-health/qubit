import { useEffect, useRef, useState } from 'react'
import { cachedFetch, invalidateCache } from '@/lib/request-cache'

interface UseApiOptions {
  skip?: boolean
  revalidate?: boolean
}

/**
 * React hook for deduplicated API requests with 3s cache
 * Multiple components fetching the same endpoint will share the result
 */
export function useCachedApi<T>(
  url: string,
  options?: UseApiOptions
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (options?.skip) {
      setIsLoading(false)
      return
    }

    if (options?.revalidate) {
      invalidateCache(url)
    }

    let canceled = false

    cachedFetch<T>(url)
      .then((result) => {
        if (!canceled && isMountedRef.current) {
          setData(result)
          setError(null)
        }
      })
      .catch((err) => {
        if (!canceled && isMountedRef.current) {
          setError(err)
        }
      })
      .finally(() => {
        if (!canceled && isMountedRef.current) {
          setIsLoading(false)
        }
      })

    return () => {
      canceled = true
    }
  }, [url, options?.skip, options?.revalidate])

  return { data, error, isLoading }
}
