export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    import('@sentry/nextjs').then(({ captureException, setContext }) => {
      if (context) setContext('additional', context)
      captureException(error)
    })
  } else {
    console.error('[Error]', error, context)
  }
}
