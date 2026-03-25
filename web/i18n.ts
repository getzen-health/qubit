import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'

// Define supported locales
const locales = ['en', 'es', 'fr']

export default getRequestConfig(async ({ locale }) => {
  // Validate that the requested locale is supported
  if (!locales.includes(locale as any)) notFound()

  return {
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
