import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import createMiddleware from 'next-intl/middleware'

const intlMiddleware = createMiddleware({
  locales: ['en', 'es', 'fr'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
})

export async function middleware(request: NextRequest) {
  // Apply i18n middleware first (returns locale-prefixed response)
  const intlResponse = intlMiddleware(request)
  if (intlResponse && intlResponse.status !== 200) return intlResponse

  // Then apply Supabase session middleware
  const sessionResponse = await updateSession(request)
  return sessionResponse
}

export const config = {
  matcher: [
    '/',
    '/(en|es|fr)/:path*',
    '/dashboard/:path*',
    '/workouts/:path*',
    '/sleep/:path*',
    '/hrv/:path*',
    '/vitals/:path*',
    '/food/:path*',
    '/running/:path*',
    '/body/:path*',
    '/ready/:path*',
    '/social/:path*',
    '/settings/:path*',
    '/habits/:path*',
    '/water/:path*',
    '/glucose/:path*',
    '/fasting/:path*',
    '/training-load/:path*',
    '/streaks/:path*',
    '/onboarding/:path*',
    '/api/((?!auth).)*',
  ],
}

