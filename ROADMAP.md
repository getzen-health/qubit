# KQuarks — Roadmap to Launch

## What KQuarks Is
A health tracking app combining **Bevel-style** dashboards with **Yuka-style** food scanning.
- iOS (Swift/SwiftUI) reads Apple Health → syncs to cloud
- Web dashboard (Next.js 14) visualises all metrics + AI insights
- QuarkScore™ food health scoring (like Yuka, built from scratch)

---

## Current State (March 2026)
| Area | Status |
|------|--------|
| iOS app | ✅ Builds, 440+ views, HealthKit sync, widget |
| Web dashboard | ✅ 100+ pages, TypeScript strict, deployed on Vercel |
| Backend | ✅ Supabase (Postgres + RLS + Edge Functions) |
| API security | ✅ 204/209 routes use `createSecureApiHandler` |
| Food scanner | ✅ Web (QuarkScore™), iOS in progress |
| AI insights | ✅ Claude API edge function |
| App Store | ❌ Not submitted |
| Privacy policy | ❌ Missing |
| Onboarding | ❌ Missing |
| App icons | ❌ Missing real assets |

---

## 7-Day Plan to Customer Launch
> Assumes 8–10 hours of autonomous engineering work per day, agents running in parallel.

---

### Day 1 — Foundation & Security (in progress)
**Goal: Zero known security gaps, clean builds on both platforms**

| Task | Est | Status |
|------|-----|--------|
| Food/workouts API auth + Zod validation | 1.5h | 🔄 agent running |
| iOS food scanner — VisionKit + OpenFoodFacts + QuarkScore | 2.0h | 🔄 agent running |
| Web cleanup — consolidate SummaryCard, N+1 fix, loading skeletons | 2.0h | 🔄 agent running |
| Claude AI API route — add Zod validation | 0.5h | pending |
| Suppress console.error stack traces in production | 0.5h | pending |
| Standardise all API error shapes `{error, code?}` | 1.0h | pending |
| iOS SyncService — add `@MainActor` (off-thread UI mutation fix) | 0.5h | pending |
| iOS barcode format validation (8–14 digits) | 0.5h | pending |
| **Total** | **~9h** | |

---

### Day 2 — iOS Feature Parity + Stub Pages Pt.1
**Goal: iOS matches web on new features; top 6 stub pages get real content**

| Task | Est |
|------|-----|
| iOS `CaffeineView` — quick-add, daily total, sleep cutoff warning | 1.5h |
| iOS `EnergyView` — 1–5 emoji tap check-in, 7-day sparkline | 1.0h |
| iOS `HearingHealthView` — NIOSH dose %, dB log form (stub → real) | 1.0h |
| iOS `DeskBreaksView` — break timer, suggestion cards | 1.0h |
| Web `/vo2max` — VO2Max estimate, age-norm percentile, trend chart | 1.0h |
| Web `/sleep-analytics` — sleep stages, debt tracker, circadian score | 1.0h |
| Web `/running` — recent runs, pace trend, best efforts | 1.0h |
| Web `/recovery` — readiness score (HRV + sleep + resting HR), chart | 1.0h |
| **Total** | **~9.5h** | |

---

### Day 3 — Stub Pages Pt.2 + Strength Training
**Goal: All high-traffic pages show real data; strength logging live on web + iOS**

| Task | Est |
|------|-----|
| Web `/breathing` — guided 4-7-8, box, Wim Hof timer | 1.0h |
| Web `/correlations` — scatter plots: sleep↔HRV, caffeine↔sleep, steps↔mood | 1.5h |
| Web `/zones` — HR zones + time-in-zone from workouts | 1.0h |
| Web `/trends` — long-term trend lines, streak detection | 1.0h |
| iOS `VO2MaxView` — chart + age norms (stub → real) | 1.0h |
| iOS `RunningView` — recent runs list, pace trend | 1.0h |
| iOS `RecoveryView` — readiness score + factors | 1.0h |
| Web + iOS: Strength training — sets×reps×weight, 60-exercise library, PRs, progressive overload | 2.5h |
| **Total** | **~10h** | |

---

### Day 4 — Intelligence Layer
**Goal: KQuarks connects the dots — surfaces insights users can't see themselves**

| Task | Est |
|------|-----|
| Correlations engine (`web/lib/correlations.ts`) — Pearson correlation, top-3 auto-detect | 2.0h |
| `/correlations` page — full implementation with Recharts scatter + regression | 1.5h |
| Body battery real algorithm: `(HRV×0.4) + (sleep×0.35) + (restingHR⁻¹×0.25)` | 1.0h |
| AI insights v2 — 14-day context window, weekly narrative, actionable suggestions | 2.0h |
| HealthKit sync batching — 500-record chunks instead of 1 request/type | 1.0h |
| `/predictions` page — 7-day health forecast based on trends | 1.0h |
| **Total** | **~8.5h** | |

---

### Day 5 — App Store Prep Pt.1
**Goal: App is legally compliant, has proper onboarding, icons ready**

| Task | Est |
|------|-----|
| Privacy Policy page (`/privacy`) — GDPR/CCPA compliant, covers HealthKit + AI | 1.0h |
| Terms of Service page (`/terms`) | 0.5h |
| Support page (`/support`) with FAQ and contact form | 0.5h |
| iOS onboarding flow — 3 screens: HealthKit permissions → set goals → first sync | 2.5h |
| App icon — generate all required sizes (1024px master → all variants via script) | 1.0h |
| Launch screen / splash screen polish | 0.5h |
| In-app subscription setup (RevenueCat) — Free tier + Pro ($4.99/mo or $39.99/yr) | 2.0h |
| Paywall screen — what's free vs Pro (AI insights, exports, correlations) | 1.0h |
| **Total** | **~9h** | |

---

### Day 6 — App Store Prep Pt.2 + Web Production
**Goal: App Store Connect ready; web domain live; TestFlight open**

| Task | Est |
|------|-----|
| App Store screenshots — 6.9" + 13" (7 screenshots per spec in docs/) | 2.5h |
| App Store Connect — create app, fill metadata from docs/app-store/metadata.md | 1.0h |
| TestFlight build — archive, upload, add internal testers | 1.5h |
| Custom domain (kquarks.app) — Vercel DNS, SSL, redirect www → root | 0.5h |
| Marketing landing page (`/`) — hero, 3 feature blocks, App Store badge, screenshots | 2.5h |
| Web `robots.txt`, `sitemap.xml`, OG meta tags for all pages | 0.5h |
| Push notification setup (Supabase + APNs) — morning briefing at 7am | 1.0h |
| **Total** | **~9.5h** | |

---

### Day 7 — Polish, Beta Fixes & Submit
**Goal: Ship v1.0 to App Store; web dashboard publicly accessible**

| Task | Est |
|------|-----|
| Address any TestFlight crash reports / beta feedback | 2.0h |
| Final UI polish pass — spacing, dark mode parity, accessibility labels | 1.5h |
| Shareable health cards — weekly stats card image (Vercel OG), share sheet | 1.5h |
| Widget improvements — health score + body battery tile, interactive +water | 1.0h |
| App Store submission — select build, answer review questions, submit | 0.5h |
| Web public launch — remove any beta banners, enable sign-up | 0.5h |
| Post-launch monitoring — Vercel analytics, Supabase dashboard, crash alerts | 0.5h |
| **Total** | **~8h** | |

---

## Post-Launch Backlog (Week 2+)

### Growth
- [ ] Android app (Kotlin + Jetpack Compose + Health Connect)
- [ ] Apple Watch companion app
- [ ] Referral program ("Invite a friend, both get 1 month Pro")
- [ ] Integration exports (Fitbit, Garmin, Oura data import)

### Features
- [ ] AI real-time coaching (streamed Claude responses)
- [ ] Social challenges (step competitions with friends)
- [ ] Doctor share report (clean PDF of health trends)
- [ ] Streak leaderboard (anonymous opt-in)

---

## Quality Gates (enforced before every PR)
```
✅ npx tsc --noEmit          → 0 errors
✅ xcodebuild (Catalyst)     → BUILD SUCCEEDED
✅ All new API routes        → createSecureApiHandler + Zod + rateLimit
✅ All new DB tables         → RLS + user_id filter on every query
✅ No Co-authored-by         → commits by Rajashekarredde only
✅ Branch protection         → feature branch → PR → merge (no direct push to main)
```

---

## Architecture
```
/ios        Swift/SwiftUI — HealthKit → Supabase sync
/web        Next.js 14 App Router — dashboard, food scanner, AI insights
/supabase   Postgres migrations, RLS, Edge Functions
/docs       App Store assets, API reference, architecture
```
