# GetZen: App Store Publishing + Claude AI Health Insights

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship GetZen to the App Store with real Claude-powered health analysis, replacing all placeholder/mock data with live insights.

**Architecture:** The iOS app calls a Supabase Edge Function with health data context. The edge function calls Claude API with a structured health analysis prompt and stores insights in the `health_insights` table. The iOS app fetches and displays these insights. Users can optionally provide their own Claude API key in settings (stored in iOS Keychain, sent per-request over HTTPS), otherwise the app's server-side key is used.

**Important Xcode Note:** This project uses `GENERATE_INFOPLIST_FILE = YES` in its build settings. New Swift files must be added to `project.pbxproj` (PBXFileReference + PBXBuildFile + PBXGroup + PBXSourcesBuildPhase). The easiest way is to open the project in Xcode and drag files into the navigator — Xcode updates `project.pbxproj` automatically. Alternatively, use `ruby` or `xcodeproj` gem scripts. All tasks that create new `.swift` files include a step to add them to the Xcode project.

**Tech Stack:** Swift 5.9+ / SwiftUI, Supabase Edge Functions (Deno), Claude API (Anthropic SDK), Xcode 15+

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `ios/KQuarks/Services/AIInsightsService.swift` | Calls Supabase edge function, manages insight generation lifecycle |
| `ios/KQuarks/PrivacyInfo.xcprivacy` | Apple-required privacy manifest for App Store submission |
| `supabase/functions/generate-insights/index.ts` | Edge function: receives health data, calls Claude API, stores insights |
| `ios/KQuarks/Services/KeychainHelper.swift` | Secure storage for user API keys via iOS Keychain (placed in Services/ to avoid creating new Xcode group) |

### Modified Files

| File | Changes |
|------|---------|
| `ios/KQuarks.xcodeproj/project.pbxproj` | Add new files to build (via Xcode drag-and-drop recommended) |
| `ios/KQuarks/Views/SettingsView.swift` | Wire up AI settings to persist and actually save API keys |
| `ios/KQuarks/Views/InsightsView.swift` | Connect to real AI service instead of sample data |
| `ios/KQuarks/Views/Dashboard/DashboardListView.swift` | Replace hardcoded mock scores with real computed values |
| `ios/KQuarks/Services/HealthKitService.swift` | Add `fetchWeekSummary()` for multi-day context to send to Claude |
| `ios/KQuarks/Services/SupabaseService.swift` | Add edge function invocation + API key storage methods |

---

## Phase 1: App Store Readiness

### Task 1: Add Privacy Manifest (PrivacyInfo.xcprivacy)

Apple requires a privacy manifest for all apps submitted after Spring 2024. HealthKit apps especially need this.

**Files:**
- Create: `ios/KQuarks/PrivacyInfo.xcprivacy`

- [ ] **Step 1: Create the privacy manifest file**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSPrivacyTracking</key>
    <false/>
    <key>NSPrivacyTrackingDomains</key>
    <array/>
    <key>NSPrivacyCollectedDataTypes</key>
    <array>
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypeHealth</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
    </array>
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>CA92.1</string>
            </array>
        </dict>
    </array>
</dict>
</plist>
```

- [ ] **Step 2: Add file to Xcode project (Resources build phase)**

Open the project in Xcode and drag `PrivacyInfo.xcprivacy` into the GetZen group in the navigator. Ensure it's added to the GetZen target. Xcode will automatically place it in the **Resources** build phase (not Sources). Verify: Target → Build Phases → Copy Bundle Resources should list `PrivacyInfo.xcprivacy`.

If working from CLI, add entries to `project.pbxproj`: a `PBXFileReference`, a `PBXBuildFile` in the `PBXResourcesBuildPhase` (not `PBXSourcesBuildPhase`), and include it in the appropriate `PBXGroup`.

- [ ] **Step 3: Verify the file is included in the build**

```bash
cd ios && xcodebuild build \
  -project KQuarks.xcodeproj \
  -scheme GetZen \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO 2>&1 | tail -20
```
Expected: Build succeeds with no privacy manifest warnings.

- [ ] **Step 4: Commit**

```bash
git add ios/KQuarks/PrivacyInfo.xcprivacy
git commit -m "Add Apple privacy manifest for App Store submission"
```

---

### Task 2: Update HealthKit Usage Descriptions in Build Settings

**Files:**
- Modify: `ios/KQuarks.xcodeproj/project.pbxproj`

**Important:** This project uses `GENERATE_INFOPLIST_FILE = YES`, so HealthKit usage descriptions are already set via `INFOPLIST_KEY_NSHealth*` build settings in `project.pbxproj` (not in `Info.plist` directly). We need to update the existing strings to mention AI insights. Do NOT add these keys to `Info.plist` — that would create conflicts.

- [ ] **Step 1: Update usage description strings in project.pbxproj**

In `project.pbxproj`, find and update the `INFOPLIST_KEY_NSHealthShareUsageDescription` values in BOTH Debug and Release build configurations:

```
// Old:
INFOPLIST_KEY_NSHealthShareUsageDescription = "GetZen needs access to your health data to display insights and sync to the cloud.";

// New:
INFOPLIST_KEY_NSHealthShareUsageDescription = "GetZen reads your health data to display activity, heart rate, sleep, and workout metrics on your dashboard and generate personalized AI-powered health insights.";
```

This needs to be done in both the Debug and Release `buildSettings` sections of `project.pbxproj`.

- [ ] **Step 2: Build and verify**

```bash
cd ios && xcodebuild build \
  -project KQuarks.xcodeproj \
  -scheme GetZen \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO 2>&1 | tail -5
```
Expected: BUILD SUCCEEDED

- [ ] **Step 3: Commit**

```bash
git add ios/KQuarks.xcodeproj/project.pbxproj
git commit -m "Update HealthKit usage descriptions to mention AI insights"
```

---

### Task 3: Fix Placeholder URLs and Version Info

**Files:**
- Modify: `ios/KQuarks/Views/SettingsView.swift`

The settings view has `example.com` URLs for Privacy Policy and Terms of Service. These must be real URLs for App Store submission (Apple requires a privacy policy URL for HealthKit apps).

- [ ] **Step 1: Update privacy policy and terms URLs**

In `ios/KQuarks/Views/SettingsView.swift`, replace the placeholder URLs:

```swift
// Replace example.com URLs with your actual URLs
// If you don't have these yet, create simple pages on your website
Link(destination: URL(string: "https://kquarks.app/privacy")!) {
    Label("Privacy Policy", systemImage: "hand.raised")
}

Link(destination: URL(string: "https://kquarks.app/terms")!) {
    Label("Terms of Service", systemImage: "doc.text")
}
```

**Note to implementer:** Ask the user what domain/URLs they want to use. If they don't have a website yet, they can host these on GitHub Pages, Notion, or even as static pages on their Vercel deployment (e.g., `getzen.vercel.app/privacy`).

- [ ] **Step 2: Update version to use bundle version**

Replace the hardcoded version string:

```swift
// Before
Text("1.0.0")

// After
Text(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0")
```

- [ ] **Step 3: Commit**

```bash
git add ios/KQuarks/Views/SettingsView.swift
git commit -m "Replace placeholder URLs and use dynamic version string"
```

---

## Phase 2: Claude AI Health Insights Integration

### Task 4: Create Keychain Helper for Secure API Key Storage

**Files:**
- Create: `ios/KQuarks/Services/KeychainHelper.swift`

User-provided API keys must be stored securely in the iOS Keychain, never in UserDefaults or plain text. We place this in `Services/` (an existing Xcode group) to avoid creating a new `Utils/` group.

- [ ] **Step 1: Create KeychainHelper**

```swift
import Foundation
import Security

enum KeychainHelper {
    enum KeychainError: Error {
        case duplicateItem
        case itemNotFound
        case unexpectedStatus(OSStatus)
    }

    static func save(key: String, value: String) throws {
        guard let data = value.data(using: .utf8) else { return }

        // Delete existing item first
        let deleteQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecAttrService as String: "com.kquarks.app"
        ]
        SecItemDelete(deleteQuery as CFDictionary)

        let addQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecAttrService as String: "com.kquarks.app",
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock
        ]

        let status = SecItemAdd(addQuery as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw KeychainError.unexpectedStatus(status)
        }
    }

    static func load(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecAttrService as String: "com.kquarks.app",
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess, let data = result as? Data else {
            return nil
        }

        return String(data: data, encoding: .utf8)
    }

    static func delete(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecAttrService as String: "com.kquarks.app"
        ]
        SecItemDelete(query as CFDictionary)
    }
}
```

- [ ] **Step 2: Add file to Xcode project**

Open Xcode, drag `KeychainHelper.swift` into the `Services` group in the project navigator. Ensure it's added to the GetZen target. Xcode will update `project.pbxproj` automatically.

- [ ] **Step 3: Build and verify**

```bash
cd ios && xcodebuild build \
  -project KQuarks.xcodeproj \
  -scheme GetZen \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO 2>&1 | tail -5
```
Expected: BUILD SUCCEEDED

- [ ] **Step 4: Commit**

```bash
git add ios/KQuarks/Services/KeychainHelper.swift ios/KQuarks.xcodeproj/project.pbxproj
git commit -m "Add KeychainHelper for secure API key storage"
```

---

### Task 5: Create Supabase Edge Function for Claude Health Analysis

**Files:**
- Create: `supabase/functions/generate-insights/index.ts`

This is the core AI integration. The edge function receives health data from the iOS app, builds a detailed prompt, calls Claude API, parses the response, and stores structured insights in the database.

- [ ] **Step 1: Create the functions directory and edge function**

```bash
mkdir -p supabase/functions/generate-insights
```

Create `supabase/functions/generate-insights/index.ts`:

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface HealthContext {
  dailySummary: {
    date: string
    steps: number
    distanceMeters: number
    activeCalories: number
    totalCalories: number
    floorsClimbed: number
    restingHeartRate: number | null
    avgHrv: number | null
    sleepDurationMinutes: number | null
    sleepQualityScore: number | null
    activeMinutes: number
  }
  weekHistory: Array<{
    date: string
    steps: number
    activeCalories: number
    restingHeartRate: number | null
    avgHrv: number | null
    sleepDurationMinutes: number | null
  }>
  recentWorkouts: Array<{
    workoutType: string
    durationMinutes: number
    activeCalories: number | null
    avgHeartRate: number | null
  }>
  recentSleep: Array<{
    durationMinutes: number
    deepMinutes: number
    remMinutes: number
    coreMinutes: number
    awakeMinutes: number
  }>
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the user
    const supabaseAuth = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!
    )
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(
      authHeader.replace("Bearer ", "")
    )
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { healthContext, userApiKey } = await req.json() as {
      healthContext: HealthContext
      userApiKey?: string
    }

    // Determine which API key to use
    const apiKey = userApiKey || Deno.env.get("ANTHROPIC_API_KEY")
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "No API key configured. Please add your Claude API key in Settings > AI Provider." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Build the health analysis prompt
    const prompt = buildHealthPrompt(healthContext)

    // Call Claude API
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: `You are a health data analyst embedded in a personal health tracking app called GetZen.
Your role is to analyze the user's health metrics and provide actionable, personalized insights.

Guidelines:
- Be specific with numbers and comparisons (e.g., "Your HRV increased 15% from 42ms to 48ms")
- Compare today's metrics against the user's own weekly averages, not population norms
- Flag concerning trends early but don't be alarmist
- Suggest concrete actions (e.g., "Consider a 20-minute walk after lunch" not "Be more active")
- Acknowledge positive trends and progress
- Keep each insight to 2-3 sentences max
- Return ONLY valid JSON, no markdown or extra text

Return a JSON object with this exact structure:
{
  "recoveryScore": <0-100 integer based on sleep quality + HRV + resting HR trends>,
  "strainScore": <0.0-21.0 float based on activity intensity + calories + workout load>,
  "insights": [
    {
      "category": "sleep" | "activity" | "heart" | "recovery" | "general",
      "title": "<short title, 5-8 words>",
      "content": "<2-3 sentence insight with specific numbers>",
      "priority": "low" | "normal" | "high"
    }
  ]
}

Generate 3-5 insights covering different categories. At least one should be actionable advice.`,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    })

    if (!claudeResponse.ok) {
      const errorBody = await claudeResponse.text()
      console.error("Claude API error:", claudeResponse.status, errorBody)
      return new Response(
        JSON.stringify({ error: `AI service error: ${claudeResponse.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const claudeData = await claudeResponse.json()
    const responseText = claudeData.content[0].text

    // Parse Claude's response
    let analysisResult
    try {
      analysisResult = JSON.parse(responseText)
    } catch {
      console.error("Failed to parse Claude response:", responseText)
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Store insights in database
    const insightsToStore = analysisResult.insights.map((insight: {
      category: string
      title: string
      content: string
      priority: string
    }) => ({
      user_id: user.id,
      category: insight.category,
      title: insight.title,
      content: insight.content,
      priority: insight.priority,
      is_read: false,
    }))

    if (insightsToStore.length > 0) {
      const { error: insertError } = await supabase
        .from("health_insights")
        .insert(insightsToStore)

      if (insertError) {
        console.error("Failed to store insights:", insertError)
      }
    }

    return new Response(
      JSON.stringify({
        recoveryScore: analysisResult.recoveryScore,
        strainScore: analysisResult.strainScore,
        insights: analysisResult.insights,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Edge function error:", error)
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})

function buildHealthPrompt(ctx: HealthContext): string {
  const today = ctx.dailySummary
  const weekAvg = calculateWeekAverages(ctx.weekHistory)

  let prompt = `## Today's Health Data (${today.date})

**Activity:**
- Steps: ${today.steps.toLocaleString()} (weekly avg: ${weekAvg.steps.toLocaleString()})
- Active Calories: ${today.activeCalories.toFixed(0)} kcal (weekly avg: ${weekAvg.activeCalories.toFixed(0)})
- Distance: ${(today.distanceMeters / 1000).toFixed(1)} km
- Floors Climbed: ${today.floorsClimbed}
- Active Minutes: ${today.activeMinutes}

**Heart:**
- Resting Heart Rate: ${today.restingHeartRate ?? "N/A"} bpm (weekly avg: ${weekAvg.restingHeartRate?.toFixed(0) ?? "N/A"})
- HRV: ${today.avgHrv?.toFixed(0) ?? "N/A"} ms (weekly avg: ${weekAvg.avgHrv?.toFixed(0) ?? "N/A"})

**Sleep:**
- Duration: ${today.sleepDurationMinutes ? (today.sleepDurationMinutes / 60).toFixed(1) + " hours" : "N/A"} (weekly avg: ${weekAvg.sleepDurationMinutes ? (weekAvg.sleepDurationMinutes / 60).toFixed(1) + " hours" : "N/A"})
`

  if (ctx.recentSleep.length > 0) {
    const lastSleep = ctx.recentSleep[0]
    prompt += `- Deep Sleep: ${lastSleep.deepMinutes} min
- REM: ${lastSleep.remMinutes} min
- Light/Core: ${lastSleep.coreMinutes} min
- Awake: ${lastSleep.awakeMinutes} min
`
  }

  if (ctx.recentWorkouts.length > 0) {
    prompt += `\n**Recent Workouts (last 7 days):**\n`
    for (const w of ctx.recentWorkouts.slice(0, 5)) {
      prompt += `- ${w.workoutType}: ${w.durationMinutes} min, ${w.activeCalories?.toFixed(0) ?? "?"} cal, avg HR ${w.avgHeartRate ?? "?"} bpm\n`
    }
  }

  prompt += `\n**7-Day Trend Data:**\n`
  for (const day of ctx.weekHistory) {
    prompt += `- ${day.date}: ${day.steps} steps, ${day.activeCalories.toFixed(0)} cal, RHR ${day.restingHeartRate ?? "?"}, HRV ${day.avgHrv?.toFixed(0) ?? "?"}, Sleep ${day.sleepDurationMinutes ? (day.sleepDurationMinutes / 60).toFixed(1) + "h" : "?"}\n`
  }

  prompt += `\nAnalyze this health data and provide personalized insights with recovery and strain scores.`

  return prompt
}

function calculateWeekAverages(history: HealthContext["weekHistory"]): {
  steps: number
  activeCalories: number
  restingHeartRate: number | null
  avgHrv: number | null
  sleepDurationMinutes: number | null
} {
  if (history.length === 0) {
    return { steps: 0, activeCalories: 0, restingHeartRate: null, avgHrv: null, sleepDurationMinutes: null }
  }

  const count = history.length
  const steps = history.reduce((sum, d) => sum + d.steps, 0) / count
  const cal = history.reduce((sum, d) => sum + d.activeCalories, 0) / count

  const rhrValues = history.filter(d => d.restingHeartRate != null).map(d => d.restingHeartRate!)
  const hrvValues = history.filter(d => d.avgHrv != null).map(d => d.avgHrv!)
  const sleepValues = history.filter(d => d.sleepDurationMinutes != null).map(d => d.sleepDurationMinutes!)

  return {
    steps: Math.round(steps),
    activeCalories: cal,
    restingHeartRate: rhrValues.length > 0 ? rhrValues.reduce((a, b) => a + b, 0) / rhrValues.length : null,
    avgHrv: hrvValues.length > 0 ? hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length : null,
    sleepDurationMinutes: sleepValues.length > 0 ? sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length : null,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add supabase/functions/generate-insights/index.ts
git commit -m "Add Supabase edge function for Claude-powered health analysis"
```

---

### Task 6: Add Week Summary Fetching to HealthKitService

**Files:**
- Modify: `ios/KQuarks/Services/HealthKitService.swift:72-95`

The AI needs multi-day context to identify trends. Add a method to fetch the last 7 days of data.

- [ ] **Step 1: Add fetchWeekSummaries method**

Add this method to `HealthKitService` after `fetchTodaySummary()`:

```swift
/// Fetches daily summaries for the past N days for AI context
func fetchWeekSummaries(days: Int = 7) async throws -> [DaySummaryForAI] {
    let calendar = Calendar.current
    let now = Date()
    var summaries: [DaySummaryForAI] = []

    for dayOffset in 0..<days {
        let date = calendar.date(byAdding: .day, value: -dayOffset, to: now)!
        let startOfDay = calendar.startOfDay(for: date)
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!

        async let steps = fetchSum(for: .stepCount, from: startOfDay, to: endOfDay)
        async let calories = fetchSum(for: .activeEnergyBurned, from: startOfDay, to: endOfDay)
        async let rhr = fetchLatestInRange(for: .restingHeartRate, from: startOfDay, to: endOfDay)
        async let hrv = fetchLatestInRange(for: .heartRateVariabilitySDNN, from: startOfDay, to: endOfDay)

        let dateFormatter = ISO8601DateFormatter()
        dateFormatter.formatOptions = [.withFullDate]

        let summary = try await DaySummaryForAI(
            date: dateFormatter.string(from: startOfDay),
            steps: Int(steps ?? 0),
            activeCalories: calories ?? 0,
            restingHeartRate: rhr.map { Int($0) },
            avgHrv: hrv,
            sleepDurationMinutes: nil // Sleep is fetched separately
        )
        summaries.append(summary)
    }

    return summaries
}

/// Fetch latest value within a date range
func fetchLatestInRange(for identifier: HKQuantityTypeIdentifier, from startDate: Date, to endDate: Date) async throws -> Double? {
    let quantityType = HKQuantityType(identifier)
    let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
    let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)

    return try await withCheckedThrowingContinuation { continuation in
        let query = HKSampleQuery(
            sampleType: quantityType,
            predicate: predicate,
            limit: 1,
            sortDescriptors: [sortDescriptor]
        ) { _, samples, error in
            if let error = error {
                continuation.resume(throwing: error)
                return
            }
            guard let sample = samples?.first as? HKQuantitySample else {
                continuation.resume(returning: nil)
                return
            }
            let unit = self.preferredUnit(for: identifier)
            continuation.resume(returning: sample.quantity.doubleValue(for: unit))
        }
        self.healthStore.execute(query)
    }
}
```

- [ ] **Step 2: Add the DaySummaryForAI model**

Add to the bottom of `HealthKitService.swift` (after `HealthKitError`):

```swift
struct DaySummaryForAI: Codable {
    let date: String
    let steps: Int
    let activeCalories: Double
    let restingHeartRate: Int?
    let avgHrv: Double?
    let sleepDurationMinutes: Int?
}
```

- [ ] **Step 3: Build and verify**

```bash
cd ios && xcodebuild build \
  -project KQuarks.xcodeproj \
  -scheme GetZen \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO 2>&1 | tail -5
```
Expected: BUILD SUCCEEDED

- [ ] **Step 4: Commit**

```bash
git add ios/KQuarks/Services/HealthKitService.swift
git commit -m "Add week summary fetching for AI health context"
```

---

### Task 7: Create AIInsightsService

**Files:**
- Create: `ios/KQuarks/Services/AIInsightsService.swift`

This service orchestrates: gather health data -> call edge function -> return parsed insights.

- [ ] **Step 1: Create the service**

```swift
import Foundation
import HealthKit

@Observable
class AIInsightsService {
    static let shared = AIInsightsService()

    var isGenerating = false
    var lastError: String?
    var latestRecoveryScore: Int?
    var latestStrainScore: Double?

    private let healthKit = HealthKitService.shared
    private let supabase = SupabaseService.shared

    struct AIAnalysisResult: Codable {
        let recoveryScore: Int
        let strainScore: Double
        let insights: [AIInsight]
    }

    struct AIInsight: Codable {
        let category: String
        let title: String
        let content: String
        let priority: String
    }

    struct EdgeFunctionRequest: Encodable {
        let healthContext: HealthContext
        let userApiKey: String?
    }

    struct HealthContext: Codable {
        let dailySummary: DailySummaryContext
        let weekHistory: [DaySummaryForAI]
        let recentWorkouts: [WorkoutContext]
        let recentSleep: [SleepContext]
    }

    struct DailySummaryContext: Codable {
        let date: String
        let steps: Int
        let distanceMeters: Double
        let activeCalories: Double
        let totalCalories: Double
        let floorsClimbed: Int
        let restingHeartRate: Int?
        let avgHrv: Double?
        let sleepDurationMinutes: Int?
        let sleepQualityScore: Int?
        let activeMinutes: Int
    }

    struct WorkoutContext: Codable {
        let workoutType: String
        let durationMinutes: Int
        let activeCalories: Double?
        let avgHeartRate: Int?
    }

    struct SleepContext: Codable {
        let durationMinutes: Int
        let deepMinutes: Int
        let remMinutes: Int
        let coreMinutes: Int
        let awakeMinutes: Int
    }

    /// Generate fresh insights from current health data via Claude
    func generateInsights() async -> AIAnalysisResult? {
        await MainActor.run {
            isGenerating = true
            lastError = nil
        }

        defer {
            Task { @MainActor in
                isGenerating = false
            }
        }

        do {
            // 1. Gather health context
            let context = try await buildHealthContext()

            // 2. Get user's API key if they have one
            let userApiKey = KeychainHelper.load(key: "claude_api_key")

            // 3. Call edge function
            let result = try await supabase.invokeGenerateInsights(
                healthContext: context,
                userApiKey: userApiKey
            )

            await MainActor.run {
                latestRecoveryScore = result.recoveryScore
                latestStrainScore = result.strainScore
            }

            return result
        } catch {
            await MainActor.run {
                lastError = error.localizedDescription
            }
            return nil
        }
    }

    private func buildHealthContext() async throws -> HealthContext {
        let today = try await healthKit.fetchTodaySummary()
        let weekHistory = try await healthKit.fetchWeekSummaries(days: 7)

        let calendar = Calendar.current
        let weekAgo = calendar.date(byAdding: .day, value: -7, to: Date())!
        let workouts = try await healthKit.fetchWorkouts(from: weekAgo, to: Date())
        let sleepSamples = try await healthKit.fetchSleepAnalysis(from: weekAgo, to: Date())

        let dateFormatter = ISO8601DateFormatter()
        dateFormatter.formatOptions = [.withFullDate]

        let dailySummary = DailySummaryContext(
            date: dateFormatter.string(from: Date()),
            steps: today.steps,
            distanceMeters: today.distanceMeters,
            activeCalories: today.activeCalories,
            totalCalories: today.activeCalories, // approximation
            floorsClimbed: today.floorsClimbed,
            restingHeartRate: today.restingHeartRate,
            avgHrv: today.hrv,
            sleepDurationMinutes: today.sleepHours.map { Int($0 * 60) },
            sleepQualityScore: nil,
            activeMinutes: 0
        )

        // Uses the HKWorkoutActivityType.name extension from SyncService.swift
        let workoutContexts = workouts.prefix(5).map { workout in
            WorkoutContext(
                workoutType: workout.workoutActivityType.name,
                durationMinutes: Int(workout.duration / 60),
                activeCalories: workout.totalEnergyBurned?.doubleValue(for: .kilocalorie()),
                avgHeartRate: nil
            )
        }

        // Group sleep samples into sessions (simplified)
        let sleepContexts = buildSleepContexts(from: sleepSamples)

        return HealthContext(
            dailySummary: dailySummary,
            weekHistory: weekHistory,
            recentWorkouts: workoutContexts,
            recentSleep: sleepContexts
        )
    }

    private func buildSleepContexts(from samples: [HKCategorySample]) -> [SleepContext] {
        guard !samples.isEmpty else { return [] }

        // Group samples by night (within 12-hour windows)
        var deepMinutes = 0
        var remMinutes = 0
        var coreMinutes = 0
        var awakeMinutes = 0
        var totalMinutes = 0

        for sample in samples {
            let minutes = Int(sample.endDate.timeIntervalSince(sample.startDate) / 60)
            let value = HKCategoryValueSleepAnalysis(rawValue: sample.value)

            switch value {
            case .asleepDeep:
                deepMinutes += minutes
                totalMinutes += minutes
            case .asleepREM:
                remMinutes += minutes
                totalMinutes += minutes
            case .asleepCore, .asleepUnspecified:
                coreMinutes += minutes
                totalMinutes += minutes
            case .awake, .inBed:
                awakeMinutes += minutes
            default:
                break
            }
        }

        guard totalMinutes > 0 else { return [] }

        return [SleepContext(
            durationMinutes: totalMinutes,
            deepMinutes: deepMinutes,
            remMinutes: remMinutes,
            coreMinutes: coreMinutes,
            awakeMinutes: awakeMinutes
        )]
    }
}

// Note: HKWorkoutActivityType.name extension already exists in SyncService.swift
// Do NOT duplicate it here — it will cause a compilation error.
```

- [ ] **Step 2: Add the edge function invocation method to SupabaseService**

Add this method to `ios/KQuarks/Services/SupabaseService.swift` in the `// MARK: - AI Insights` section:

```swift
/// Call the generate-insights edge function
func invokeGenerateInsights(
    healthContext: AIInsightsService.HealthContext,
    userApiKey: String?
) async throws -> AIInsightsService.AIAnalysisResult {
    guard let session = currentSession else {
        throw SupabaseError.notAuthenticated
    }

    struct RequestBody: Encodable {
        let healthContext: AIInsightsService.HealthContext
        let userApiKey: String?
    }

    let body = RequestBody(healthContext: healthContext, userApiKey: userApiKey)
    let bodyData = try JSONEncoder().encode(body)

    let url = URL(string: Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as! String)!
        .appendingPathComponent("functions/v1/generate-insights")

    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
    request.setValue(
        Bundle.main.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String ?? "",
        forHTTPHeaderField: "apikey"
    )
    request.httpBody = bodyData

    let (data, response) = try await URLSession.shared.data(for: request)

    guard let httpResponse = response as? HTTPURLResponse else {
        throw SupabaseError.networkError
    }

    guard httpResponse.statusCode == 200 else {
        if let errorBody = try? JSONDecoder().decode([String: String].self, from: data),
           let errorMessage = errorBody["error"] {
            throw SupabaseError.unknown(NSError(domain: "AI", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: errorMessage]))
        }
        throw SupabaseError.networkError
    }

    let result = try JSONDecoder().decode(AIInsightsService.AIAnalysisResult.self, from: data)
    return result
}
```

- [ ] **Step 3: Add AIInsightsService.swift to Xcode project**

Open Xcode, drag `AIInsightsService.swift` into the `Services` group. Ensure it's added to the GetZen target.

- [ ] **Step 4: Build and verify**

```bash
cd ios && xcodebuild build \
  -project KQuarks.xcodeproj \
  -scheme GetZen \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO 2>&1 | tail -10
```
Expected: BUILD SUCCEEDED

- [ ] **Step 5: Commit**

```bash
git add ios/KQuarks/Services/AIInsightsService.swift ios/KQuarks/Services/SupabaseService.swift ios/KQuarks.xcodeproj/project.pbxproj
git commit -m "Add AIInsightsService with Claude edge function integration"
```

---

### Task 8: Wire Up AI Settings to Actually Persist

**Files:**
- Modify: `ios/KQuarks/Views/SettingsView.swift:175-224`

The current AISettingsView has a picker and API key field but doesn't save anything.

- [ ] **Step 1: Rewrite AISettingsView to use Keychain + UserDefaults**

Replace the entire `AISettingsView` struct in `SettingsView.swift`:

```swift
struct AISettingsView: View {
    @State private var selectedProvider: AIProvider = {
        let saved = UserDefaults.standard.string(forKey: "ai_provider") ?? "claude"
        return AIProvider(rawValue: saved) ?? .claude
    }()
    @State private var apiKey: String = ""
    @State private var showSavedAlert = false
    @State private var hasExistingKey = false

    var body: some View {
        List {
            Section {
                Picker("Provider", selection: $selectedProvider) {
                    ForEach(AIProvider.allCases, id: \.self) { provider in
                        Text(provider.title).tag(provider)
                    }
                }
            } footer: {
                Text("Claude is the default AI provider. Your health data is sent securely to generate personalized insights.")
            }

            Section("API Key") {
                if selectedProvider == .claude {
                    SecureField(hasExistingKey ? "••••••••••••••••" : "Enter Claude API Key (optional)", text: $apiKey)
                        .textContentType(.password)
                        .autocorrectionDisabled()

                    if hasExistingKey {
                        Button("Remove Saved Key", role: .destructive) {
                            KeychainHelper.delete(key: "claude_api_key")
                            apiKey = ""
                            hasExistingKey = false
                        }
                    }
                } else {
                    SecureField("Enter API Key", text: $apiKey)
                        .textContentType(.password)
                        .autocorrectionDisabled()
                }
            } footer: {
                if selectedProvider == .claude {
                    Text("Optional. If not provided, the app's built-in key will be used. Your key is stored securely in the iOS Keychain and never leaves your device except to authenticate API calls.")
                } else {
                    Text("Required for this provider. Your key is stored securely in the iOS Keychain.")
                }
            }

            Section {
                Button("Save") {
                    saveSettings()
                }
                .disabled(needsApiKey && apiKey.isEmpty && !hasExistingKey)
            }

            Section {
                Button("Generate Insights Now") {
                    Task {
                        _ = await AIInsightsService.shared.generateInsights()
                    }
                }
                .disabled(AIInsightsService.shared.isGenerating)

                if AIInsightsService.shared.isGenerating {
                    HStack {
                        ProgressView()
                        Text("Analyzing your health data...")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                if let error = AIInsightsService.shared.lastError {
                    Text(error)
                        .font(.caption)
                        .foregroundColor(.red)
                }
            }
        }
        .navigationTitle("AI Provider")
        .alert("Settings Saved", isPresented: $showSavedAlert) {
            Button("OK") { }
        }
        .onAppear {
            hasExistingKey = KeychainHelper.load(key: "claude_api_key") != nil
        }
    }

    private var needsApiKey: Bool {
        selectedProvider != .claude
    }

    private func saveSettings() {
        UserDefaults.standard.set(selectedProvider.rawValue, forKey: "ai_provider")

        if !apiKey.isEmpty {
            let keyName: String
            switch selectedProvider {
            case .claude: keyName = "claude_api_key"
            case .openai: keyName = "openai_api_key"
            case .custom: keyName = "custom_api_key"
            }
            try? KeychainHelper.save(key: keyName, value: apiKey)
            hasExistingKey = true
            apiKey = ""
        }

        showSavedAlert = true
    }
}

enum AIProvider: String, CaseIterable {
    case claude
    case openai
    case custom

    var title: String {
        switch self {
        case .claude: return "Claude (Default)"
        case .openai: return "OpenAI GPT-4"
        case .custom: return "Custom API"
        }
    }
}
```

- [ ] **Step 2: Build and verify**

```bash
cd ios && xcodebuild build \
  -project KQuarks.xcodeproj \
  -scheme GetZen \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add ios/KQuarks/Views/SettingsView.swift
git commit -m "Wire AI settings to persist API keys via Keychain"
```

---

### Task 9: Connect InsightsView to Real AI Service

**Files:**
- Modify: `ios/KQuarks/Views/InsightsView.swift`

Replace the sample data with real Supabase-backed insights and real AI generation.

- [ ] **Step 1: Rewrite InsightsView to use real data**

Replace the `loadInsights()` and `generateInsights()` methods:

```swift
private func loadInsights() async {
    isLoading = true
    do {
        let healthInsights = try await SupabaseService.shared.fetchInsights()
        insights = healthInsights.map { insight in
            InsightItem(
                date: insight.createdAt,
                category: InsightCategory.from(string: insight.category),
                title: insight.title,
                content: insight.content,
                priority: insight.priority == "high" ? .high : (insight.priority == "low" ? .low : .normal)
            )
        }
    } catch {
        // Fall back to empty state if not authenticated or no data
        insights = []
    }
    isLoading = false
}

private func generateInsights() async {
    isLoading = true
    let result = await AIInsightsService.shared.generateInsights()
    if let result = result {
        insights = result.insights.map { insight in
            InsightItem(
                date: Date(),
                category: InsightCategory.from(string: insight.category),
                title: insight.title,
                content: insight.content,
                priority: insight.priority == "high" ? .high : (insight.priority == "low" ? .low : .normal)
            )
        }
    }
    isLoading = false
}
```

Also add a helper to `InsightCategory`:

```swift
static func from(string: String) -> InsightCategory {
    switch string.lowercased() {
    case "sleep": return .sleep
    case "activity": return .activity
    case "heart": return .heart
    case "recovery": return .recovery
    case "nutrition": return .nutrition
    default: return .recovery
    }
}
```

- [ ] **Step 2: Build and verify**

```bash
cd ios && xcodebuild build \
  -project KQuarks.xcodeproj \
  -scheme GetZen \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
git add ios/KQuarks/Views/InsightsView.swift
git commit -m "Connect InsightsView to real AI service and Supabase data"
```

---

### Task 10: Replace Dashboard Mock Scores with Real AI Data

**Files:**
- Modify: `ios/KQuarks/Views/Dashboard/DashboardListView.swift:316-388`

The `DashboardListViewModel` has hardcoded recovery (78) and strain (14.2) scores. Replace with real AI-computed values.

- [ ] **Step 1: Update DashboardListViewModel**

Replace the mock computed properties and update `loadData()`:

```swift
@Observable
class DashboardListViewModel {
    var todaySummary: TodayHealthSummary?
    var insights: [HealthInsight] = []
    var isLoading = false
    var isSyncing = false
    var error: String?

    // Real scores from AI analysis (with sensible defaults)
    var recoveryScore: Int = 70
    var strainScore: Double = 8.0
    var recoveryTrend: Int? = nil
    var strainTrend: Int? = nil
    var stepsTrend: Int? = nil
    var hrvTrend: Int? = nil

    private let healthKit = HealthKitService.shared
    private let syncService = SyncService.shared
    private let aiService = AIInsightsService.shared

    func loadData() async {
        await MainActor.run {
            isLoading = true
            error = nil
        }

        do {
            let summary = try await healthKit.fetchTodaySummary()
            await MainActor.run {
                todaySummary = summary
                isLoading = false
            }

            // Load cached AI scores if available
            if let cachedRecovery = aiService.latestRecoveryScore {
                await MainActor.run { recoveryScore = cachedRecovery }
            }
            if let cachedStrain = aiService.latestStrainScore {
                await MainActor.run { strainScore = cachedStrain }
            }

            // Load insights from Supabase
            if let fetchedInsights = try? await SupabaseService.shared.fetchInsights() {
                await MainActor.run { insights = fetchedInsights }
            }

            // Calculate trends from week data
            await calculateTrends()

        } catch {
            await MainActor.run {
                self.error = error.localizedDescription
                isLoading = false
            }
        }
    }

    func sync() async {
        await MainActor.run {
            isSyncing = true
        }

        await syncService.performFullSync()

        await MainActor.run {
            isSyncing = false
        }

        await loadData()
    }

    func refreshAIInsights() async {
        let result = await aiService.generateInsights()
        if let result = result {
            await MainActor.run {
                recoveryScore = result.recoveryScore
                strainScore = result.strainScore
            }
            // Reload insights from DB
            if let fetchedInsights = try? await SupabaseService.shared.fetchInsights() {
                await MainActor.run { insights = fetchedInsights }
            }
        }
    }

    private func calculateTrends() async {
        do {
            let weekData = try await healthKit.fetchWeekSummaries(days: 7)
            guard weekData.count >= 2 else { return }

            let todaySteps = weekData.first?.steps ?? 0
            let avgSteps = weekData.dropFirst().reduce(0) { $0 + $1.steps } / max(weekData.count - 1, 1)
            if avgSteps > 0 {
                await MainActor.run {
                    stepsTrend = Int(((Double(todaySteps) - Double(avgSteps)) / Double(avgSteps)) * 100)
                }
            }

            let todayHrv = weekData.first?.avgHrv
            let hrvValues = weekData.dropFirst().compactMap { $0.avgHrv }
            if let todayHrv = todayHrv, !hrvValues.isEmpty {
                let avgHrv = hrvValues.reduce(0, +) / Double(hrvValues.count)
                if avgHrv > 0 {
                    await MainActor.run {
                        hrvTrend = Int(((todayHrv - avgHrv) / avgHrv) * 100)
                    }
                }
            }
        } catch {
            // Trends are non-critical, silently fail
        }
    }

    func generatePrimaryInsight() -> String {
        if recoveryScore >= 80 {
            return "Your recovery is excellent. Today is ideal for high-intensity training."
        }
        if recoveryScore >= 60 {
            return "You're moderately recovered. Consider a balanced workout today."
        }
        return "Your recovery is low. Prioritize rest and light activity today."
    }

    func generateSecondaryInsight() -> String? {
        if let trend = hrvTrend, trend > 10 {
            return "HRV trending up \(trend)% this week — a positive adaptation sign."
        }
        if let trend = stepsTrend, trend > 20 {
            return "You're \(trend)% more active than your weekly average. Great momentum!"
        }
        return nil
    }
}
```

- [ ] **Step 2: Add AI refresh button to the dashboard toolbar**

In `DashboardListView`, add a sparkles button next to the sync button in the toolbar:

```swift
ToolbarItem(placement: .topBarTrailing) {
    HStack(spacing: 12) {
        Button {
            Task {
                await viewModel.refreshAIInsights()
            }
        } label: {
            Image(systemName: aiService.isGenerating ? "sparkles" : "sparkles")
                .symbolEffect(.pulse, isActive: aiService.isGenerating)
        }
        .disabled(aiService.isGenerating)

        Button {
            Task {
                await viewModel.sync()
            }
        } label: {
            Image(systemName: viewModel.isSyncing ? "arrow.triangle.2.circlepath" : "arrow.clockwise")
                .rotationEffect(.degrees(viewModel.isSyncing ? 360 : 0))
                .animation(
                    viewModel.isSyncing
                        ? .linear(duration: 1).repeatForever(autoreverses: false)
                        : .default,
                    value: viewModel.isSyncing
                )
        }
        .disabled(viewModel.isSyncing)
    }
}
```

Add the service reference to the view:

```swift
private let aiService = AIInsightsService.shared
```

- [ ] **Step 3: Build and verify**

```bash
cd ios && xcodebuild build \
  -project KQuarks.xcodeproj \
  -scheme GetZen \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add ios/KQuarks/Views/Dashboard/DashboardListView.swift
git commit -m "Replace mock dashboard scores with real AI-computed values and trends"
```

---

## Phase 3: Polish and Publish

### Task 11: Replace Hardcoded Detail Values with Real Data

**Files:**
- Modify: `ios/KQuarks/Views/Dashboard/DashboardListView.swift:254-289`

The detail expansion panels (recovery, strain, sleep, heart) show hardcoded values like "85% quality" and "1h 23m deep sleep".

- [ ] **Step 1: Replace hardcoded sleep details with real data**

Replace the `sleepDetails` computed property (currently `private var sleepDetails: some View`) with a function. **Important:** Also update the existing call site from `AnyView(sleepDetails)` to `AnyView(sleepDetails(summary: summary))`:

```swift
private func sleepDetails(summary: TodayHealthSummary) -> some View {
    VStack(spacing: 8) {
        if let sleepContext = viewModel.latestSleepContext {
            MetricDetailRow(label: "Deep Sleep", value: formatMinutes(sleepContext.deepMinutes), color: .sleep)
            MetricDetailRow(label: "REM", value: formatMinutes(sleepContext.remMinutes), color: .hrv)
            MetricDetailRow(label: "Light", value: formatMinutes(sleepContext.coreMinutes), color: .secondary)
            MetricDetailRow(label: "Awake", value: formatMinutes(sleepContext.awakeMinutes), color: .warning)
        } else {
            Text("No sleep data available")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}

private func formatMinutes(_ minutes: Int) -> String {
    let h = minutes / 60
    let m = minutes % 60
    if h > 0 {
        return "\(h)h \(m)m"
    }
    return "\(m)m"
}
```

- [ ] **Step 2: Add latestSleepContext to the view model**

Add to `DashboardListViewModel`:

```swift
var latestSleepContext: AIInsightsService.SleepContext? = nil

// In loadData(), after fetching today's summary, add:
// Fetch last night's sleep breakdown
let calendar = Calendar.current
let yesterday = calendar.date(byAdding: .day, value: -1, to: calendar.startOfDay(for: Date()))!
let sleepSamples = try? await healthKit.fetchSleepAnalysis(from: yesterday, to: Date())
if let samples = sleepSamples, !samples.isEmpty {
    var deep = 0, rem = 0, core = 0, awake = 0
    for sample in samples {
        let mins = Int(sample.endDate.timeIntervalSince(sample.startDate) / 60)
        switch HKCategoryValueSleepAnalysis(rawValue: sample.value) {
        case .asleepDeep: deep += mins
        case .asleepREM: rem += mins
        case .asleepCore, .asleepUnspecified: core += mins
        case .awake, .inBed: awake += mins
        default: break
        }
    }
    await MainActor.run {
        latestSleepContext = AIInsightsService.SleepContext(
            durationMinutes: deep + rem + core,
            deepMinutes: deep, remMinutes: rem,
            coreMinutes: core, awakeMinutes: awake
        )
    }
}
```

- [ ] **Step 3: Update the sleep metric row sublabel**

Replace the hardcoded "85% quality" with real data:

```swift
// In metricsSection, replace the sleep MetricRowView
if let formattedSleep = summary.formattedSleep {
    let sleepSublabel: String = {
        guard let ctx = viewModel.latestSleepContext, ctx.durationMinutes > 0 else { return "" }
        let deepPct = Int(Double(ctx.deepMinutes) / Double(ctx.durationMinutes) * 100)
        return "\(deepPct)% deep sleep"
    }()

    MetricRowView(
        icon: "moon.fill",
        label: "Sleep",
        value: formattedSleep,
        sublabel: sleepSublabel,
        color: .sleep
    ) {
        AnyView(sleepDetails(summary: summary))
    }
}
```

- [ ] **Step 4: Build and verify**

```bash
cd ios && xcodebuild build \
  -project KQuarks.xcodeproj \
  -scheme GetZen \
  -destination 'generic/platform=iOS Simulator' \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO 2>&1 | tail -5
```

- [ ] **Step 5: Commit**

```bash
git add ios/KQuarks/Views/Dashboard/DashboardListView.swift
git commit -m "Replace hardcoded dashboard detail values with real HealthKit data"
```

---

### Task 12: App Store Submission Checklist and Xcode Configuration

This task covers the manual steps needed in Xcode and Apple Developer Portal. These cannot be fully automated via CLI.

**No code files to create** — this is a reference guide for the user.

- [ ] **Step 1: Apple Developer Account Setup**

Ensure you have an active Apple Developer Program membership ($99/year).
Go to: https://developer.apple.com/account

- [ ] **Step 2: Register App ID with HealthKit capability**

1. Go to https://developer.apple.com/account/resources/identifiers/list
2. Click "+" to create a new App ID
3. Select "App IDs" → Continue
4. Platform: iOS
5. Description: "GetZen"
6. Bundle ID: Explicit → `com.yourname.getzen` (match your Xcode bundle ID)
7. Under Capabilities, check:
   - HealthKit
   - Sign in with Apple
8. Click Continue → Register

- [ ] **Step 3: Create Provisioning Profile**

1. Go to https://developer.apple.com/account/resources/profiles/list
2. Click "+" → iOS App Development (for testing) or App Store Distribution (for submission)
3. Select your App ID
4. Select your development/distribution certificate
5. Select devices (for development profile)
6. Name it and download

- [ ] **Step 4: Configure Xcode Signing**

In Xcode:
1. Open `ios/KQuarks.xcodeproj`
2. Select the GetZen target
3. Go to "Signing & Capabilities" tab
4. Check "Automatically manage signing" (easiest approach)
5. Select your Team from the dropdown
6. Set Bundle Identifier to match your registered App ID
7. Verify HealthKit capability is listed (it should be, from entitlements)

- [ ] **Step 5: Create App Store Connect Listing**

1. Go to https://appstoreconnect.apple.com
2. My Apps → "+" → New App
3. Platform: iOS
4. Name: "GetZen"
5. Primary Language: English
6. Bundle ID: Select your registered App ID
7. SKU: "getzen-001" (any unique string)

- [ ] **Step 6: Required App Store Metadata**

Prepare the following before submission:
- **App Icon**: 1024x1024 PNG (no alpha channel, no rounded corners)
- **Screenshots**: At least one set for iPhone 6.7" display
- **Description**: App description (up to 4000 chars)
- **Keywords**: Health, fitness, Apple Health, AI, insights, heart rate, sleep, activity
- **Privacy Policy URL**: Must be a real, accessible URL
- **Support URL**: Your website or GitHub repo URL
- **Category**: Health & Fitness
- **Age Rating**: Fill out the questionnaire (no objectionable content)
- **HealthKit Usage**: In the "App Privacy" section, declare Health data usage

- [ ] **Step 7: Build and Upload Archive**

In Xcode:
1. Select "Any iOS Device (arm64)" as the build destination
2. Product → Archive
3. When archive completes, click "Distribute App"
4. Select "App Store Connect" → Upload
5. Follow the prompts (signing, bitcode, etc.)

Or via command line:
```bash
cd ios && xcodebuild archive \
  -project KQuarks.xcodeproj \
  -scheme GetZen \
  -archivePath build/GetZen.xcarchive \
  -destination 'generic/platform=iOS'

xcodebuild -exportArchive \
  -archivePath build/GetZen.xcarchive \
  -exportPath build/export \
  -exportOptionsPlist ExportOptions.plist
```

- [ ] **Step 8: Submit for Review**

In App Store Connect:
1. Select your app → Version "1.0"
2. Add the uploaded build
3. Fill in "What's New" (for updates) or leave blank for initial release
4. Under "App Review Information", add notes for reviewers:
   - "This app requires HealthKit access to function. Please test on a physical device with Health data."
   - Add a demo account if login is required
5. Click "Submit for Review"

**Expected Timeline:** Apple typically reviews within 24-48 hours. HealthKit apps may take slightly longer due to additional privacy review.

---

### Task 13: Deploy Supabase Edge Function

- [ ] **Step 1: Set the ANTHROPIC_API_KEY secret**

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key-here
```

- [ ] **Step 2: Deploy the edge function**

```bash
supabase functions deploy generate-insights
```

- [ ] **Step 3: Verify deployment**

```bash
# Test with curl (replace with your project URL and anon key)
curl -X POST \
  'https://dbokxnlpllrnhhpyuryj.supabase.co/functions/v1/generate-insights' \
  -H 'Authorization: Bearer YOUR_USER_JWT' \
  -H 'apikey: YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"healthContext":{"dailySummary":{"date":"2026-03-17","steps":8500,"distanceMeters":6800,"activeCalories":420,"totalCalories":2100,"floorsClimbed":12,"restingHeartRate":58,"avgHrv":45,"sleepDurationMinutes":450,"sleepQualityScore":null,"activeMinutes":65},"weekHistory":[],"recentWorkouts":[],"recentSleep":[]}}'
```
Expected: JSON response with `recoveryScore`, `strainScore`, and `insights` array.

---

## Summary of Deliverables

| What | Status Before | Status After |
|------|--------------|--------------|
| Privacy Manifest | Missing | PrivacyInfo.xcprivacy added |
| HealthKit Usage Descriptions | Missing | NSHealthShareUsageDescription in Info.plist |
| AI Insights | Hardcoded samples | Real Claude API analysis via edge function |
| Recovery/Strain Scores | Hardcoded (78, 14.2) | AI-computed from real health data |
| Dashboard Detail Panels | Hardcoded values | Real HealthKit data |
| API Key Management | Non-functional UI | Keychain storage, persisted settings |
| Trend Calculations | Hardcoded | Computed from 7-day HealthKit history |
| Privacy/Terms URLs | example.com | Real URLs |
| Edge Function | None | generate-insights deployed on Supabase |
| App Store Readiness | Not ready | All requirements documented + code ready |
