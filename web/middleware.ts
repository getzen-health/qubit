import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
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
