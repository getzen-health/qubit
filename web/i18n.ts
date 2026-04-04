import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'

// Define supported locales
const locales = ['en', 'es', 'fr', 'pt', 'de', 'ja', 'zh', 'ko']

export default getRequestConfig(async ({ locale }) => {
  // Fall back to English for static generation where locale is undefined
  const resolvedLocale = locale && locales.includes(locale as string) ? locale as string : 'en'
  if (locale && !locales.includes(locale as string)) notFound()

  return {
    locale: resolvedLocale,
    messages: (await import(`./messages/${resolvedLocale}.json`)).default,
  }
})
