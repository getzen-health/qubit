import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Strava activity type mapping to KQuarks workout types
const STRAVA_TO_KQUARKS_MAPPING: Record<string, string> = {
  // Running
  'Run': 'running',
  'Trail run': 'trail_running',
  'Virtual run': 'running',
  
  // Cycling
  'Ride': 'cycling',
  'Gravel ride': 'cycling',
  'Mountain bike ride': 'cycling',
  'E-bike ride': 'cycling',
  'Virtual ride': 'cycling',
  
  // Swimming
  'Swim': 'swimming',
  'Kayak': 'kayaking',
  'Canoeing': 'kayaking',
  
  // Strength
  'Gym': 'strength_training',
  'Workout': 'strength_training',
  'Badminton': 'strength_training',
  
  // Other sports
  'Hike': 'hiking',
  'Rock climbing': 'rock_climbing',
  'Skateboarding': 'skateboarding',
  'Tennis': 'tennis',
  'Soccer': 'soccer',
  'Basketball': 'basketball',
  'Football': 'football',
  'American football': 'football',
  'Rowing': 'rowing',
  'Sailing': 'sailing',
  'Stand up paddleboarding': 'paddle_boarding',
  'Surfing': 'surfing',
  'Windsurfing': 'windsurfing',
  'Kiteboarding': 'kiteboarding',
  'Skiing': 'skiing',
  'Snowboarding': 'snowboarding',
  'Cross-country skiing': 'cross_country_skiing',
  'Backcountry skiing': 'backcountry_skiing',
  'Inline skating': 'inline_skating',
  'Ice skating': 'ice_skating',
  'Elliptical': 'elliptical',
  'Stair stepper': 'stair_climbing',
  'Pilates': 'pilates',
  'Yoga': 'yoga',
  'Boxing': 'boxing',
  'HIIT': 'hiit',
  'CrossFit': 'crossfit',
  'Spin': 'spinning',
  'Handcycle': 'handcycling',
  'Walk': 'walking',
  'Wheelchair': 'wheelchair',
}

interface StravaActivity {
  id: number
  name: string
  type: string
  start_date: string
  moving_time: number
  distance: number
  total_elevation_gain?: number
  average_heartrate?: number
  max_heartrate?: number
  average_speed?: number
  max_speed?: number
  calories?: number
  elev_high?: number
  elev_low?: number
}

function decryptToken(encryptedToken: string): string {
  // TODO: Implement proper decryption
  // For now, assume base64 encoding (NOT SECURE - for development only)
  try {
    return Buffer.from(encryptedToken, 'base64').toString('utf-8')
  } catch {
    throw new Error('Failed to decrypt token')
  }
}

function refreshStravaToken(
  _refreshToken: string,
  _clientId: string,
  _clientSecret: string
): Promise<{ access_token: string; expires_at: number }> {
  // TODO: Implement token refresh
  throw new Error('Token refresh not yet implemented')
}

async function fetchStravaActivities(
  accessToken: string,
  limit = 50
): Promise<StravaActivity[]> {
  const response = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?per_page=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    const error = await response.text()
    console.error('Strava API error:', error)
    throw new Error(`Strava API error: ${response.status}`)
  }

  return response.json()
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get Strava integration from database
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'strava')
      .single()

    if (integrationError || !integration) {
      return NextResponse.json(
        { error: 'Strava integration not connected' },
        { status: 404 }
      )
    }

    // Decrypt access token
    let accessToken: string
    try {
      accessToken = decryptToken(integration.access_token)
    } catch (error) {
      console.error('Token decryption failed:', error)
      return NextResponse.json(
        { error: 'Failed to decrypt Strava token' },
        { status: 500 }
      )
    }

    // Check if token is expired and refresh if needed
    if (integration.expires_at && new Date(integration.expires_at) < new Date()) {
      try {
        if (!integration.refresh_token) {
          return NextResponse.json(
            { error: 'Token expired and no refresh token available' },
            { status: 401 }
          )
        }

        const refreshedToken = await refreshStravaToken(
          decryptToken(integration.refresh_token),
          process.env.STRAVA_CLIENT_ID || '',
          process.env.STRAVA_CLIENT_SECRET || ''
        )

        accessToken = refreshedToken.access_token
      } catch (error) {
        console.error('Token refresh failed:', error)
        return NextResponse.json(
          { error: 'Failed to refresh Strava token' },
          { status: 401 }
        )
      }
    }

    // Fetch recent activities from Strava
    const activities = await fetchStravaActivities(accessToken)

    // Map and insert/upsert activities into workouts table
    let syncedCount = 0
    let skippedCount = 0

    for (const activity of activities) {
      // Map Strava type to KQuarks workout type
      const workoutType = STRAVA_TO_KQUARKS_MAPPING[activity.type] || 'other_activity'

      // Skip activities older than 90 days to avoid huge syncs
      const activityDate = new Date(activity.start_date)
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

      if (activityDate < ninetyDaysAgo) {
        skippedCount++
        continue
      }

      // Calculate calories burned (Strava provides this, or estimate from duration/type)
      const caloriesBurned = activity.calories || null

      // Convert distance from meters to meters (Strava uses meters)
      const distanceMeters = activity.distance || null

      // Calculate average pace if distance and time available
      let avgPacePerKm: number | null = null
      if (distanceMeters && distanceMeters > 0 && activity.moving_time > 0) {
        const distanceKm = distanceMeters / 1000
        avgPacePerKm = activity.moving_time / distanceKm
      }

      // Prepare workout record
      const startTime = new Date(activity.start_date)
      const endTime = new Date(
        startTime.getTime() + activity.moving_time * 1000
      )

      // Upsert workout, avoiding duplicates via strava_activity_id
      const { error: upsertError } = await supabase
        .from('workout_records')
        .upsert(
          {
            user_id: user.id,
            strava_activity_id: activity.id,
            workout_type: workoutType,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            duration_minutes: Math.round(activity.moving_time / 60),
            active_calories: caloriesBurned,
            distance_meters: distanceMeters,
            avg_heart_rate: activity.average_heartrate
              ? Math.round(activity.average_heartrate)
              : null,
            max_heart_rate: activity.max_heartrate
              ? Math.round(activity.max_heartrate)
              : null,
            elevation_gain_meters: activity.total_elevation_gain || null,
            avg_pace_per_km: avgPacePerKm,
            source: 'strava',
            metadata: {
              strava_name: activity.name,
              strava_type: activity.type,
              max_speed: activity.max_speed || null,
            },
          },
          { onConflict: 'user_id,strava_activity_id' }
        )

      if (!upsertError) {
        syncedCount++
      } else {
        console.error(`Failed to sync activity ${activity.id}:`, upsertError)
      }
    }

    // Update last_sync timestamp
    await supabase
      .from('user_integrations')
      .update({ last_sync: new Date().toISOString() })
      .eq('id', integration.id)

    return NextResponse.json({
      success: true,
      syncedCount,
      skippedCount,
      totalProcessed: activities.length,
      message: `Synced ${syncedCount} activities from Strava`,
    })
  } catch (error) {
    console.error('Strava sync error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
