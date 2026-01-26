# KQuarks - Development Roadmap

## Goal
Build KQuarks - an iOS app that reads Apple Health data and displays it on a web dashboard.

---

## Phase 1: iOS App Foundation (Current)

### 1.1 Project Setup
- [x] Create project architecture docs
- [x] Define database schema
- [ ] Create Xcode project with SwiftUI
- [ ] Configure app signing & capabilities
- [ ] Add HealthKit entitlement
- [ ] Set up Supabase Swift SDK

### 1.2 HealthKit Integration
- [ ] Request HealthKit permissions
- [ ] Read health data types:
  - [ ] Steps & distance
  - [ ] Heart rate & HRV
  - [ ] Sleep analysis
  - [ ] Workouts
  - [ ] Body measurements
- [ ] Background delivery setup

### 1.3 Core UI
- [ ] Onboarding flow (permissions)
- [ ] Dashboard with daily stats
- [ ] Health data list views
- [ ] Settings screen

### 1.4 Supabase Sync
- [ ] User authentication (Apple Sign-In)
- [ ] Upload health data to Supabase
- [ ] Sync status tracking
- [ ] Offline support with SwiftData

### 1.5 App Store Submission
- [ ] App icons & launch screen
- [ ] Privacy policy & terms
- [ ] App Store screenshots
- [ ] App Store Connect setup
- [ ] TestFlight beta testing
- [ ] Submit for review

---

## Phase 2: Web Dashboard

### 2.1 Next.js Setup
- [ ] Create Next.js 14 project
- [ ] Configure Supabase client
- [ ] Set up Tailwind + shadcn/ui
- [ ] Authentication (magic link / Apple)

### 2.2 Dashboard Views
- [ ] Daily summary cards
- [ ] Sleep charts
- [ ] Heart rate graphs
- [ ] Workout history
- [ ] Activity trends

### 2.3 Deployment
- [ ] Deploy to Vercel
- [ ] Custom domain setup
- [ ] SSL configuration

---

## Phase 3: AI Insights

### 3.1 Backend
- [ ] Supabase Edge Function for AI
- [ ] Claude API integration
- [ ] Daily insight generation

### 3.2 Frontend
- [ ] Insights view in iOS app
- [ ] Insights section on web
- [ ] AI provider settings

---

## Phase 4: Polish & Scale

### 4.1 iOS Enhancements
- [ ] Widgets (Lock Screen, Home)
- [ ] Apple Watch app
- [ ] Push notifications
- [ ] Shortcuts integration

### 4.2 Android App
- [ ] Kotlin + Jetpack Compose
- [ ] Health Connect integration
- [ ] Feature parity with iOS

---

## Current Focus: Phase 1

### Immediate Next Steps

1. **Create Xcode Project**
   - New SwiftUI App
   - Add HealthKit capability
   - Configure bundle ID

2. **Build HealthKit Service**
   - Permission requests
   - Data queries
   - Background sync

3. **Create Basic UI**
   - Permission onboarding
   - Dashboard with stats
   - Data sync indicator

4. **Supabase Integration**
   - Auth with Apple Sign-In
   - Data upload
   - Real-time sync

5. **Prepare for App Store**
   - Privacy manifest
   - Health data usage descriptions
   - App Store assets
