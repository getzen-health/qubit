import { NextRequest } from 'next/server'
import {
  createSecureApiHandler,
  secureJsonResponse,
  secureErrorResponse,
} from '@/lib/security'

// Apple Health HKQuantityTypeIdentifier → our metric_type mapping
const APPLE_HEALTH_MAP: Record<string, string> = {
  'HKQuantityTypeIdentifierStepCount': 'steps',
  'HKQuantityTypeIdentifierHeartRate': 'heart_rate',
  'HKQuantityTypeIdentifierRestingHeartRate': 'resting_heart_rate',
  'HKQuantityTypeIdentifierHeartRateVariabilitySDNN': 'hrv',
  'HKQuantityTypeIdentifierBodyMass': 'weight',
  'HKQuantityTypeIdentifierBodyFatPercentage': 'body_fat',
  'HKQuantityTypeIdentifierBloodPressureSystolic': 'blood_pressure_systolic',
  'HKQuantityTypeIdentifierBloodPressureDiastolic': 'blood_pressure_diastolic',
  'HKQuantityTypeIdentifierOxygenSaturation': 'oxygen_saturation',
  'HKQuantityTypeIdentifierDistanceWalkingRunning': 'distance_km',
  'HKQuantityTypeIdentifierActiveEnergyBurned': 'active_calories',
  'HKQuantityTypeIdentifierFlightsClimbed': 'flights_climbed',
  'HKQuantityTypeIdentifierSleepAnalysis': 'sleep_duration_minutes',
}

export const POST = createSecureApiHandler(
  { rateLimit: 'import', requireAuth: true },
  async (req: NextRequest, { user, supabase }) => {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return secureErrorResponse('No file provided', 400)

    const MAX_SIZE = 50 * 1024 * 1024
    const text = await file.slice(0, MAX_SIZE).text()

    // Simple regex-based XML parsing (faster than full DOM parse for large files)
    const recordRegex = /<Record[^>]+type="([^"]+)"[^>]+startDate="([^"]+)"[^>]+value="([^"]+)"[^>]*\/>/g

    const records: Array<{ metric_type: string; value: number; unit: string; recorded_at: string; user_id: string }> = []
    let match
    let count = 0
    const MAX_RECORDS = 10000

    while ((match = recordRegex.exec(text)) !== null && count < MAX_RECORDS) {
      const [, type, startDate, value] = match
      const metricType = APPLE_HEALTH_MAP[type]
      if (!metricType) continue

      const numValue = parseFloat(value)
      if (isNaN(numValue)) continue

      records.push({
        user_id: user!.id,
        metric_type: metricType,
        value: numValue,
        unit: 'apple_health',
        recorded_at: new Date(startDate).toISOString(),
      })
      count++
    }

    if (records.length === 0) {
      return secureErrorResponse('No recognizable health records found in the file', 422)
    }

    const CHUNK = 500
    let inserted = 0
    for (let i = 0; i < records.length; i += CHUNK) {
      const chunk = records.slice(i, i + CHUNK)
      const { error } = await supabase.from('health_metrics').upsert(chunk, {
        onConflict: 'user_id,metric_type,recorded_at',
        ignoreDuplicates: true,
      })
      if (!error) inserted += chunk.length
    }

    return secureJsonResponse({
      success: true,
      total_parsed: records.length,
      total_inserted: inserted,
      message: `Successfully imported ${inserted} health records from Apple Health`,
    })
  }
)
