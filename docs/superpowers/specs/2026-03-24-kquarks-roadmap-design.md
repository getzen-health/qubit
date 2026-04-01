# GetZen 10-Hour Sprint + 1-Year Roadmap

**Date:** 2026-03-24
**Target:** Public App Store launch + AI-first + Apple Watch
**Sprint deadline:** 2026-03-28 (end of week) / 10-hour execution window

---

## Vision

GetZen ships as a **platform**: iPhone is the data source, Watch is the ambient layer, Web is the analysis layer, Claude is the intelligence layer. Each is independently valuable, compounding together.

---

## System Architecture (12-month target)

```
iPhone (HealthKit) ──► Supabase (Postgres + Edge Functions + Realtime)
       │                        │
Apple Watch ◄────────────────────┤  Claude API (sonnet-4-6)
(watchOS companion)              │  briefings │ chat │ anomalies │ predictions
                                 │
                        Next.js Web Dashboard
                        (analytics, coach view, sharing)
```

---

## 10-Hour Sprint Tracks (parallel execution)

### Track 1: Apple Watch Companion App
**Goal:** Functional watchOS target with glanceable metrics and complications

- Create `KQuarksWatch` watchOS target in Xcode project
- `WatchContentView`: today's rings progress, HRV, resting HR, steps, sleep hours
- `WatchSessionManager`: WatchConnectivity bridge to iOS app (sends latest health snapshot)
- Two complications: ring progress (circular) + HRV trend (corner)
- Background refresh every 30 min via `WKApplicationRefreshBackgroundTask`

**Files to create:**
- `ios/KQuarksWatch/KQuarksWatchApp.swift`
- `ios/KQuarksWatch/Views/WatchContentView.swift`
- `ios/KQuarksWatch/Services/WatchSessionManager.swift`
- `ios/KQuarksWatch/Complications/RingsComplication.swift`
- `ios/KQuarksWatch/Complications/HRVComplication.swift`

---

### Track 2: AI Daily Briefings (Push Notifications)
**Goal:** Every morning Claude sends a personalized health summary via push

**iOS side:**
- `AIBriefingService.swift` — fetches last 24h summary from Supabase, calls Claude API, formats as push payload
- Scheduled via `BGTaskScheduler` (morning, ~7am)
- `NotificationService` extension: registers `com.getzen.morning-briefing` task identifier

**Supabase Edge Function:**
- `supabase/functions/morning-briefing/index.ts`
- Fetches `daily_summaries` for user (last 7 days for context)
- Calls Claude API: `claude-sonnet-4-6` with system prompt as health coach
- Sends push via Supabase Realtime or direct APNs webhook
- Cron: `0 7 * * *` (7am UTC, configurable per user timezone)

**Prompt structure:**
```
System: You are a personal health coach. Analyze the user's last 7 days and give a 2-3 sentence morning briefing. Be specific, encouraging, and actionable. No fluff.
User: [JSON summary of last 7 days: steps, HRV, sleep, workouts, calories]
```

---

### Track 3: Anomaly Detection
**Goal:** Claude proactively alerts when it detects meaningful pattern breaks

**Supabase Edge Function:**
- `supabase/functions/anomaly-detector/index.ts`
- Runs on new `daily_summaries` insert (Supabase trigger / webhook)
- Compares today vs 14-day rolling average for: HRV, resting HR, sleep duration, step count
- If any metric deviates >1.5 SD: calls Claude to contextualize and generate alert
- Pushes notification via FCM/APNs

**iOS side:**
- `AnomalyAlertView.swift` — in-app card showing detected anomaly + Claude explanation
- Tappable from notification → deep links to relevant view (e.g. HRVDetailView)

**Anomaly categories:**
- HRV crash (>20% below 14-day avg) → likely overtraining or illness
- Sleep regression (>1h less than avg for 3+ days) → sleep debt accumulating
- Resting HR spike (>5 bpm above avg) → recovery concern
- Step cliff (>50% below avg) → sedentary pattern forming
- Workout streak break → motivational nudge

---

### Track 4: App Store Onboarding
**Goal:** First-run experience that converts installs to active HealthKit-connected users

**Screens:**
1. `OnboardingWelcomeView` — hero screen, value prop ("Your health. Deeper.")
2. `OnboardingHealthKitView` — explain what data we read and why, request permissions
3. `OnboardingNotificationsView` — opt-in to morning briefings
4. `OnboardingProfileView` — name, goals (optional, skippable)
5. `OnboardingFirstSyncView` — animated sync progress, "Your data is loading..."

**App Store requirements:**
- `PrivacyPolicyView` — in-app privacy policy (required for HealthKit apps)
- `AppIconAssets` — 1024x1024 icon + all required sizes
- `StoreScreenshots` — 6.9" iPhone 16 Pro Max screenshots (Dashboard, Sleep, Workouts, AI Briefing, Watch)
- `AppDescription.md` — App Store description draft

**AppDelegate / info.plist:**
- `NSHealthShareUsageDescription` — "GetZen reads your health data to provide insights and track your fitness progress."
- `NSHealthUpdateUsageDescription` — not required (read-only)
- Background modes: `fetch`, `remote-notification`, `processing`

---

### Track 5: Health Coach Chatbot
**Goal:** In-app Claude conversation that can answer questions about your own data

**UI:**
- `HealthChatView.swift` — chat interface, messages list + input field
- `ChatMessage` model — role (user/assistant), content, timestamp
- `ChatViewModel` — manages conversation, calls Claude API with data context

**Claude API integration:**
- System prompt includes last 30 days of daily summaries as structured context
- Streaming responses via `URLSession` SSE
- Suggested questions: "Why is my HRV low this week?", "Am I overtraining?", "When should I do my next hard workout?"
- Context window: last 10 messages + data summary (fits in 200k context easily)

**Data context injected per session:**
```json
{
  "last_30_days": [...daily_summaries...],
  "recent_workouts": [...last_10_workouts...],
  "user_goals": {...},
  "current_streaks": {...}
}
```

---

### Track 6: Web Dashboard Enhancements
**Goal:** Web parity with iOS for key metrics, shareable health reports

- `web/app/ai-chat/page.tsx` — Claude chat interface on web
- `web/app/briefings/page.tsx` — history of AI briefings
- `web/app/anomalies/page.tsx` — anomaly detection history + explanations
- `web/components/ShareCard.tsx` — shareable health snapshot image (OG card style)
- `web/app/api/claude/route.ts` — proxy Claude API calls (keeps key server-side)

---

### Track 7: Predictive Insights
**Goal:** Forward-looking AI predictions for recovery, performance, injury risk

**Supabase Edge Function:**
- `supabase/functions/predictions/index.ts`
- Runs weekly (Sunday night)
- Analyzes 90-day trend for: HRV trend, training load (ACWR), sleep consistency, resting HR
- Claude generates 3 predictions: next 7-day outlook, optimal hard training day, injury risk flag
- Stores in `predictions` table

**iOS:**
- `PredictiveInsightsView.swift` — "Your week ahead" card on Dashboard
- Three prediction cards: Recovery forecast, Performance window, Caution flags

---

## Quarterly Roadmap (post-sprint)

| Quarter | Platform | AI | Quality/Ops |
|---------|----------|----|-------------|
| Q1 Done | Watch companion v1, complications | Briefings + anomalies | App Store v1.0 |
| Q2 Jul–Sep | Watch workout tracking (live HR, pace) | Chatbot GA, predictions v1 | Crash monitoring, Supabase caching |
| Q3 Oct–Dec | Android Health Connect beta | Predictive coaching, personalization | Subscription/IAP |
| Q4 Jan–Mar 2027 | Android GA | AI goal setting, habit coaching | App Store optimization, growth |

---

## Data Models

### New tables needed
```sql
-- AI briefings history
create table briefings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  date date not null,
  content text not null,
  created_at timestamptz default now()
);

-- Anomaly alerts
create table anomalies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  detected_at timestamptz default now(),
  metric text not null,
  value double precision not null,
  avg_value double precision not null,
  deviation double precision not null,
  severity text check (severity in ('low','medium','high')),
  claude_explanation text,
  dismissed_at timestamptz
);

-- AI chat history
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  role text check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- Predictions
create table predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  week_of date not null,
  recovery_forecast text,
  performance_window text,
  caution_flags text,
  raw_response jsonb,
  created_at timestamptz default now()
);
```

---

## Error Handling

- Claude API failures: fall back to rule-based summary (no AI, still useful)
- HealthKit auth denied: graceful degradation, prompt re-auth from Settings
- Watch connectivity lost: Watch shows cached data with "last synced" timestamp
- Push notification denied: in-app notification center as fallback
- Supabase offline: local SwiftData cache serves stale data with banner

---

## Testing Strategy

- Unit: XCTest for `AIBriefingService`, `AnomalyDetector` business logic
- Integration: Supabase local dev for Edge Function testing
- UI: XCUITest for onboarding flow (critical path)
- Manual: Watch simulator for complications preview
- Beta: TestFlight for internal testing before App Store submission
