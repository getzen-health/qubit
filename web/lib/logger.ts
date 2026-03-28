const isProd = process.env.NODE_ENV === 'production'

export const logger = {
  error(message: string, error?: unknown): void {
    if (isProd) {
      console.error(message)
    } else {
      console.error(message, error)
    }
  },

  warn(message: string, data?: unknown): void {
    if (isProd) {
      console.warn(message)
    } else {
      console.warn(message, data)
    }
  },

  info(message: string, data?: unknown): void {
    if (isProd) {
      console.info(message)
    } else {
      console.info(message, data)
    }
  },
}
