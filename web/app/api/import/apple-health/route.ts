import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    // Read up to 50MB
    const MAX_SIZE = 50 * 1024 * 1024
    const text = await file.slice(0, MAX_SIZE).text()

    // Simple regex-based XML parsing (faster than full DOM parse for large files)
    // Match: <Record type="HKQuantityTypeIdentifier..." startDate="..." value="..." unit="..."/>
    const recordRegex = /<Record[^>]+type="([^"]+)"[^>]+startDate="([^"]+)"[^>]+value="([^"]+)"[^>]*\/>/g
    
    const records: Array<{ metric_type: string; value: number; unit: string; recorded_at: string; user_id: string }> = []
    let match
    let count = 0
    const MAX_RECORDS = 10000 // cap to avoid DB overload

    while ((match = recordRegex.exec(text)) !== null && count < MAX_RECORDS) {
      const [, type, startDate, value] = match
      const metricType = APPLE_HEALTH_MAP[type]
      if (!metricType) continue
      
      const numValue = parseFloat(value)
      if (isNaN(numValue)) continue

      records.push({
        user_id: user.id,
        metric_type: metricType,
        value: numValue,
        unit: 'apple_health',
        recorded_at: new Date(startDate).toISOString(),
      })
      count++
    }

    if (records.length === 0) {
      return NextResponse.json({ error: 'No recognizable health records found in the file' }, { status: 422 })
    }

    // Batch insert in chunks of 500
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

    return NextResponse.json({
      success: true,
      total_parsed: records.length,
      total_inserted: inserted,
      message: `Successfully imported ${inserted} health records from Apple Health`,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}
