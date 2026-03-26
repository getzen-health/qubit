import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import createMiddleware from 'next-intl/middleware'
import { getCSPHeader } from '@/lib/security/csp'

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

  // Add security headers
  const response = NextResponse.next()
  response.headers.set('Content-Security-Policy', getCSPHeader())
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // Copy cookies and body from sessionResponse if present
  for (const [key, value] of sessionResponse.headers.entries()) {
    response.headers.set(key, value)
  }
  // response.cookies = sessionResponse.cookies
  // response.body = sessionResponse.body

  return response
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

