/**
 * Dexcom CGM Integration
 * References:
 *   Dexcom Developer Portal: https://developer.dexcom.com/
 *   ADA 2023 Time-in-Range guidelines
 *   Battelino et al. 2019, TIR clinical targets
 *
 * Setup:
 *   1. Register at https://developer.dexcom.com/
 *   2. Set DEXCOM_CLIENT_ID and DEXCOM_CLIENT_SECRET in .env
 *   3. Add redirect URI: {APP_URL}/api/integrations/dexcom/callback
 *   4. Run: supabase functions deploy cgm-sync
 */

// ── OAuth URLs ─────────────────────────────────────────────────────────────

export const DEXCOM_OAUTH = {
  authorizeUrl: 'https://api.dexcom.com/v3/oauth2/authorize',
  tokenUrl: 'https://api.dexcom.com/v3/oauth2/token',
  scope: 'offline_access',
  egvsUrl: 'https://api.dexcom.com/v3/users/self/egvs',
  devBaseUrl: 'https://sandbox-api.dexcom.com', // for testing without a sensor
}

// ── Types ──────────────────────────────────────────────────────────────────

export type CGMTrend =
  | 'rising_rapidly' | 'rising' | 'flat' | 'falling' | 'falling_rapidly' | 'unknown'

export interface CGMReading {
  recorded_at: string     // ISO 8601
  glucose_mgdl: number
  trend: CGMTrend
  trend_rate?: number     // mg/dL per minute
  meal_context?: string
}

export interface CGMStats {
  period: string
  totalReadings: number
  avgGlucose: number
  minGlucose: number
  maxGlucose: number
  stdDev: number
  /** Time-in-Range (ADA: 70–180 mg/dL for non-diabetic) */
  tirPct: number
  /** Time Below Range (<70 mg/dL) */
  tbrPct: number
  /** Time Above Range (>180 mg/dL) */
  tarPct: number
  /** Glucose Management Indicator (approximation of HbA1c) */
  gmi: number
  /** Coefficient of Variation (%) — target ≤36% per consensus */
  cv: number
  readings: CGMReading[]
}

export interface TIRTarget {
  label: string
  tirMin: number  // minimum acceptable TIR %
  tbrMax: number  // maximum acceptable TBR %
  tarMax: number  // maximum acceptable TAR %
  color: string
}

// ── ADA/EASD Time-in-Range targets (Battelino 2019) ──────────────────────

export const TIR_TARGETS: Record<string, TIRTarget> = {
  type1: {
    label: 'Type 1 Diabetes',
    tirMin: 70, tbrMax: 4, tarMax: 25,
    color: '#3B82F6',
  },
  type2: {
    label: 'Type 2 Diabetes',
    tirMin: 70, tbrMax: 4, tarMax: 25,
    color: '#10B981',
  },
  pregnancy: {
    label: 'Pregnancy (T1D)',
    tirMin: 70, tbrMax: 1, tarMax: 25,
    color: '#F59E0B',
  },
  elderly: {
    label: 'Elderly / High Risk',
    tirMin: 50, tbrMax: 1, tarMax: 10,
    color: '#6B7280',
  },
  general: {
    label: 'General Wellness',
    tirMin: 90, tbrMax: 1, tarMax: 5,
    color: '#8B5CF6',
  },
}

// ── PKCE helpers ──────────────────────────────────────────────────────────

/** Generate PKCE code verifier + challenge (SHA-256, base64url). Browser-safe. */
export async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  const verifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  return { verifier, challenge }
}

/** Build the Dexcom authorization URL with PKCE. */
export function buildDexcomAuthUrl(params: {
  clientId: string
  redirectUri: string
  state: string
  challenge: string
}): string {
  const p = new URLSearchParams({
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    response_type: 'code',
    scope: DEXCOM_OAUTH.scope,
    state: params.state,
    code_challenge: params.challenge,
    code_challenge_method: 'S256',
  })
  return `${DEXCOM_OAUTH.authorizeUrl}?${p.toString()}`
}

// ── Token exchange ────────────────────────────────────────────────────────

export interface DexcomTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

export async function exchangeDexcomCode(params: {
  code: string
  verifier: string
  clientId: string
  clientSecret: string
  redirectUri: string
}): Promise<DexcomTokens> {
  const res = await fetch(DEXCOM_OAUTH.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${params.clientId}:${params.clientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: params.code,
      code_verifier: params.verifier,
      redirect_uri: params.redirectUri,
    }),
  })
  if (!res.ok) throw new Error(`Dexcom token exchange failed: ${await res.text()}`)
  return res.json()
}

export async function refreshDexcomToken(params: {
  refreshToken: string
  clientId: string
  clientSecret: string
}): Promise<DexcomTokens> {
  const res = await fetch(DEXCOM_OAUTH.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${params.clientId}:${params.clientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: params.refreshToken,
    }),
  })
  if (!res.ok) throw new Error(`Dexcom token refresh failed: ${await res.text()}`)
  return res.json()
}

// ── Reading fetch & normalisation ─────────────────────────────────────────

const TREND_MAP: Record<string, CGMTrend> = {
  DoubleUp: 'rising_rapidly',
  SingleUp: 'rising_rapidly',
  FortyFiveUp: 'rising',
  Flat: 'flat',
  FortyFiveDown: 'falling',
  SingleDown: 'falling_rapidly',
  DoubleDown: 'falling_rapidly',
}

interface DexcomEGV {
  systemTime: string
  value: number
  trend: string
  trendRate?: number
}

export async function fetchDexcomReadings(
  accessToken: string,
  hoursBack = 24
): Promise<CGMReading[]> {
  const endDate   = new Date().toISOString()
  const startDate = new Date(Date.now() - hoursBack * 3_600_000).toISOString()

  const res = await fetch(
    `${DEXCOM_OAUTH.egvsUrl}?startDate=${startDate}&endDate=${endDate}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) throw new Error(`Dexcom EGV fetch failed: ${await res.text()}`)

  const { egvs }: { egvs: DexcomEGV[] } = await res.json()
  return (egvs ?? [])
    .filter(e => e.value > 0 && e.value < 999)
    .map(e => ({
      recorded_at: e.systemTime,
      glucose_mgdl: e.value,
      trend: TREND_MAP[e.trend] ?? 'unknown',
      trend_rate: e.trendRate,
    }))
}

// ── Analytics ─────────────────────────────────────────────────────────────

/**
 * Compute Time-in-Range stats from an array of readings.
 * ADA ranges: <70 low | 70–180 in-range | >180 high
 */
export function computeCGMStats(readings: CGMReading[], periodLabel = '24h'): CGMStats {
  if (readings.length === 0) {
    return {
      period: periodLabel, totalReadings: 0, avgGlucose: 0,
      minGlucose: 0, maxGlucose: 0, stdDev: 0,
      tirPct: 0, tbrPct: 0, tarPct: 0, gmi: 0, cv: 0, readings,
    }
  }

  const values = readings.map(r => r.glucose_mgdl)
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const min = Math.min(...values)
  const max = Math.max(...values)
  const variance = values.reduce((a, b) => a + (b - avg) ** 2, 0) / values.length
  const stdDev = Math.sqrt(variance)
  const cv = Math.round((stdDev / avg) * 100 * 10) / 10

  const tir = values.filter(v => v >= 70 && v <= 180).length
  const tbr = values.filter(v => v < 70).length
  const tar = values.filter(v => v > 180).length
  const n = values.length

  // GMI formula (Bergenstal 2018): GMI(%) = 3.31 + 0.02392 × mean_glucose_mg/dL
  const gmi = Math.round((3.31 + 0.02392 * avg) * 10) / 10

  return {
    period: periodLabel,
    totalReadings: n,
    avgGlucose: Math.round(avg),
    minGlucose: min,
    maxGlucose: max,
    stdDev: Math.round(stdDev * 10) / 10,
    tirPct: Math.round((tir / n) * 1000) / 10,
    tbrPct: Math.round((tbr / n) * 1000) / 10,
    tarPct: Math.round((tar / n) * 1000) / 10,
    gmi,
    cv,
    readings,
  }
}

/** Score TIR against a target profile (0–100) */
export function scoreTIR(stats: CGMStats, target: TIRTarget): number {
  let score = 100
  if (stats.tirPct < target.tirMin) score -= (target.tirMin - stats.tirPct) * 1.5
  if (stats.tbrPct > target.tbrMax) score -= (stats.tbrPct - target.tbrMax) * 3
  if (stats.tarPct > target.tarMax) score -= (stats.tarPct - target.tarMax) * 1
  return Math.max(0, Math.min(100, Math.round(score)))
}

/** Current glucose status message */
export function getGlucoseStatus(mgdl: number, trend: CGMTrend): string {
  const dir = {
    rising_rapidly: '⬆⬆ Rising quickly',
    rising: '⬆ Rising',
    flat: '→ Stable',
    falling: '⬇ Falling',
    falling_rapidly: '⬇⬇ Falling quickly',
    unknown: '',
  }[trend] ?? ''

  if (mgdl < 70) return `🔴 Low (${mgdl} mg/dL) ${dir}`.trim()
  if (mgdl <= 180) return `🟢 In range (${mgdl} mg/dL) ${dir}`.trim()
  return `🟡 High (${mgdl} mg/dL) ${dir}`.trim()
}
