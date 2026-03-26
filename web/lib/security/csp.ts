// Content Security Policy configuration
export function getCSPHeader(): string {
  const policies = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://images.openfoodfacts.org https://static.openfoodfacts.org https://*.supabase.co https://avatars.githubusercontent.com",
    "connect-src 'self' https://*.supabase.co https://api.ouraring.com https://api.fitbit.com https://www.googleapis.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ]
  return policies.join('; ')
}
