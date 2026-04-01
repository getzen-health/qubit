# GetZen Android — Scoping Document

## Timeline
Q3 2026: Research & scoping (this doc)
Q4 2026: TestFlight beta equivalent (Google Play Internal Testing)
Q1 2027: Public beta → GA

## Technology Stack
- Language: Kotlin
- UI: Jetpack Compose
- Health data: Health Connect API (Android 14+ native, Android 9-13 via app)
- Backend: Same Supabase (shared with iOS)
- AI: Same Edge Functions (shared)

## Health Connect Equivalents
| iOS HealthKit | Android Health Connect |
|---------------|----------------------|
| stepCount | Steps |
| heartRate | HeartRate |
| sleepAnalysis | SleepSession + SleepStage |
| HKWorkout | ExerciseSession |
| heartRateVariabilitySDNN | HeartRateVariability |
| restingHeartRate | RestingHeartRate |
| activeEnergyBurned | ActiveCaloriesBurned |
| oxygenSaturation | OxygenSaturation |

## Architecture Plan
- `android/` directory at repo root
- Kotlin Multiplatform considered but rejected (too early, Compose Multiplatform not stable enough for HealthKit-equivalent features)
- Native Kotlin/Compose for best Health Connect integration
- Shared Supabase backend — no changes needed
- Shared Edge Functions — no changes needed
- Feature parity target: 80% of iOS views (skip Watch-specific, Mac-specific)

## MVP Feature Set (Q4 2026 beta)
1. HealthKit sync → Health Connect sync
2. Core dashboard (steps, HR, sleep, workouts)
3. AI morning briefings (same Edge Function)
4. Anomaly alerts
5. Web handoff (login → view on web)

## Key Risks
- Health Connect data availability varies by device/OEM
- Background sync restrictions on Android (Doze mode, battery optimization)
- Health Connect permission model differs from HealthKit

## Setup Steps
1. Create `android/` with `settings.gradle.kts`, `app/` module
2. Add Health Connect dependency: `androidx.health.connect:connect-client:1.1.0`
3. Declare permissions in AndroidManifest.xml
4. Implement `HealthConnectService` mirroring iOS `HealthKitService`
