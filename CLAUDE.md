# KQuarks - Claude Code Guidelines

## Project Overview

KQuarks is a comprehensive health tracking app that syncs Apple Health data to the cloud, displays interesting stats and AI-powered insights, and provides a web interface for data visualization.

## Architecture

### Technology Stack

| Component | Technology |
|-----------|------------|
| iOS App | Swift 5.9+, SwiftUI, HealthKit, SwiftData |
| Android App | Kotlin, Jetpack Compose, Health Connect (future) |
| Backend | Supabase (Postgres, Auth, Edge Functions, Realtime) |
| Web Dashboard | Next.js 14+, Tailwind CSS, shadcn/ui, Recharts |
| AI Insights | Claude API (default), OpenAI, or custom provider |

### Project Structure

```
/
├── ios/                    # Swift iOS app
│   └── Quarks/
│       ├── App/           # App entry, configuration
│       ├── Models/        # Data models
│       ├── Views/         # SwiftUI views
│       ├── ViewModels/    # MVVM view models
│       ├── Services/      # HealthKit, Supabase, Sync
│       └── Utils/         # Extensions, helpers
├── web/                    # Next.js web dashboard
│   ├── app/               # App router pages
│   ├── components/        # React components
│   └── lib/               # Utilities, Supabase client
├── supabase/              # Supabase configuration
│   ├── migrations/        # Database migrations
│   └── functions/         # Edge functions
└── docs/                  # Documentation
```

## Code Style Guidelines

### Swift (iOS)

- Use SwiftUI for all UI components
- Follow MVVM architecture with `@Observable` classes
- Use async/await for all asynchronous operations
- Prefer SwiftData for local persistence
- Use dependency injection for services
- Keep views small and composable

```swift
// Example view model
@Observable
class DashboardViewModel {
    private let healthService: HealthKitService
    private let syncService: SyncService

    var dailySummary: DailySummary?
    var isLoading = false

    func loadData() async {
        isLoading = true
        dailySummary = await healthService.fetchDailySummary()
        isLoading = false
    }
}
```

### TypeScript (Web/Supabase)

- Use TypeScript strict mode
- Prefer functional components with hooks
- Use server components where possible (Next.js App Router)
- Keep components small and focused
- Use Zod for runtime validation

```typescript
// Example component
export async function DashboardPage() {
  const supabase = createServerClient()
  const { data: summary } = await supabase
    .from('daily_summaries')
    .select('*')
    .order('date', { ascending: false })
    .limit(7)

  return <DashboardChart data={summary} />
}
```

### Database

- Use snake_case for table and column names
- Always include `created_at` and `updated_at` timestamps
- Use UUIDs for primary keys
- Enable Row Level Security (RLS) on all tables
- Write migrations incrementally

## Health Data Types

### HealthKit Identifiers to Sync

| Category | Types |
|----------|-------|
| Activity | stepCount, distanceWalkingRunning, activeEnergyBurned, flightsClimbed |
| Heart | heartRate, restingHeartRate, heartRateVariabilitySDNN |
| Sleep | sleepAnalysis (stages: awake, rem, core, deep) |
| Workouts | workoutType, duration, totalEnergyBurned, averageHeartRate |
| Body | bodyMass, bodyFatPercentage, height |
| Vitals | bloodPressure, respiratoryRate, oxygenSaturation |

## API Conventions

### Supabase Edge Functions

- Use Deno runtime
- Return consistent JSON responses
- Handle errors gracefully
- Use service role key for admin operations

```typescript
// Example edge function
Deno.serve(async (req) => {
  try {
    const { userId } = await req.json()
    // Process request
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

## Environment Variables

### iOS (stored in Config.xcconfig or environment)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key

### Web (.env.local)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side only

### Supabase Functions
- `ANTHROPIC_API_KEY` - Claude API key for insights
- `OPENAI_API_KEY` - OpenAI key (optional, user-provided)

## Testing

- iOS: XCTest for unit tests, XCUITest for UI tests
- Web: Vitest for unit tests, Playwright for E2E
- Use mocks for HealthKit and Supabase in tests

## Building the Apps

### iOS App

```bash
# Open in Xcode
open ios/Quarks.xcodeproj

# Build for iOS Simulator
cd ios && xcodebuild build \
  -project Quarks.xcodeproj \
  -scheme Quarks \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO

# Build for macOS (Mac Catalyst)
cd ios && xcodebuild build \
  -project Quarks.xcodeproj \
  -scheme Quarks \
  -destination 'platform=macOS,variant=Mac Catalyst' \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO
```

### Platform Support Status

| Platform | Status | Notes |
|----------|--------|-------|
| iOS | ✅ Supported | Full HealthKit integration |
| macOS (Catalyst) | ✅ Supported | Runs as iPad app on Mac |
| tvOS | ❌ Not supported | No HealthKit on tvOS |
| watchOS | ❌ Needs separate target | Requires watchOS-specific UI |
| visionOS | ❌ Needs separate target | Requires visionOS-specific UI |

### Web Dashboard

```bash
# Development
cd web && npm run dev

# Production build
cd web && npm run build

# Deployment
# Vercel auto-deploys on push to main (Root Directory: web)
```

### Supabase

```bash
# Start local Supabase
supabase start

# Push database migrations
supabase db push

# Serve edge functions locally
supabase functions serve

# Create new migration
supabase migration new <name>
```

## CI/CD

### GitHub Actions Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ios.yml` | Push to `ios/**` | Build iOS & macOS apps |
| `supabase.yml` | Push to `supabase/**` | Validate migrations |

### Vercel (Web)

- Auto-deploys on push to `main`
- Root Directory: `web`
- Framework: Next.js
- No GitHub Actions workflow needed (native integration)

## Security Considerations

- Never store raw API keys in code
- Use Supabase RLS for data access control
- Encrypt user-provided API keys in database
- Request minimal HealthKit permissions
- Implement proper auth token refresh

## Git Commit Guidelines

- Use simple, concise commit messages
- Do NOT add "Co-Authored-By" lines
- Do NOT add Claude Code attribution or emoji signatures
