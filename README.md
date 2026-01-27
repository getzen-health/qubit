# KQuarks

A comprehensive health tracking application that syncs Apple Health data to the cloud, provides insightful analytics, and offers a web dashboard for data visualization.

## Features

- **Apple Health Sync**: Automatically sync all your health data from Apple Health
- **Comprehensive Tracking**: Sleep, workouts, heart rate, activity, body metrics, and more
- **AI-Powered Insights**: Get personalized health insights powered by Claude AI
- **Web Dashboard**: Access your health data from any browser
- **Privacy First**: Your data is encrypted and you control access

## Tech Stack

| Component | Technology |
|-----------|------------|
| iOS App | Swift 5.9+, SwiftUI, HealthKit |
| Backend | Supabase (PostgreSQL, Auth, Realtime) |
| Web | Next.js 14, Tailwind CSS, shadcn/ui |
| AI | Claude API (configurable) |

## Project Structure

```
├── ios/                 # iOS app (Swift/SwiftUI)
│   ├── KQuarks.xcodeproj # Xcode project
│   └── KQuarks/          # Source code
│       ├── App/         # App entry point
│       ├── Models/      # Data models
│       ├── Views/       # SwiftUI views
│       ├── ViewModels/  # View models
│       ├── Services/    # HealthKit, Supabase, Sync
│       └── Utils/       # Extensions, helpers
├── web/                 # Web dashboard (Next.js)
├── supabase/           # Backend (migrations, functions)
├── .github/workflows/  # CI/CD pipelines
├── CLAUDE.md           # Claude Code guidelines
└── AGENTS.md           # Swarm agent definitions
```

## Getting Started

### Prerequisites

- **macOS** 14.0+ (Sonoma or later)
- **Xcode** 15.0+ (download from Mac App Store)
- **Node.js** 18+ (for web development)
- **Supabase CLI** (for backend)
- iOS device or Simulator with iOS 17.0+

### iOS App Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/qxlsz/kquarks.git
   cd kquarks
   ```

2. **Open in Xcode**
   ```bash
   open ios/KQuarks.xcodeproj
   ```

3. **Download iOS Simulator (if needed)**
   ```bash
   xcodebuild -downloadPlatform iOS
   ```

4. **Build and Run**
   - Select a simulator or connected device
   - Press `Cmd + R` to build and run
   - Or use command line:
     ```bash
     cd ios
     xcodebuild build \
       -project KQuarks.xcodeproj \
       -scheme KQuarks \
       -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
       -configuration Debug \
       CODE_SIGNING_ALLOWED=NO
     ```

5. **For physical device testing**
   - Open Xcode and sign in with your Apple ID
   - Select your team in Signing & Capabilities
   - Connect your device and select it as the run destination
   - Build and run

### Backend Setup (Supabase)

1. **Install Supabase CLI**
   ```bash
   brew install supabase/tap/supabase
   ```

2. **Start local Supabase**
   ```bash
   supabase start
   ```

3. **Apply database migrations**
   ```bash
   supabase db push
   ```

4. **Get your local credentials**
   ```bash
   supabase status
   ```

### Web Dashboard Setup

1. **Install dependencies**
   ```bash
   cd web
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   Add your Supabase credentials to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## CI/CD

The project uses GitHub Actions for continuous integration:

| Workflow | Trigger | Actions |
|----------|---------|---------|
| `ios.yml` | Push to `ios/**` | Build iOS app, run SwiftLint |
| `web.yml` | Push to `web/**` | Build Next.js, run ESLint |
| `supabase.yml` | Push to `supabase/**` | Validate migrations |

## Health Data Tracked

### Activity
- Steps, distance, calories burned, floors climbed

### Heart
- Heart rate, resting heart rate, heart rate variability (HRV)

### Sleep
- Sleep duration, sleep stages (REM, deep, core, awake)

### Workouts
- Exercise type, duration, calories, heart rate zones

### Body
- Weight, body fat percentage, height

### Vitals
- Blood pressure, respiratory rate, blood oxygen (SpO2)

## AI Insights

The app provides AI-powered health insights using:
- **Claude** (default): Anthropic's Claude for intelligent analysis
- **OpenAI**: GPT-4 for alternative insights
- **Custom**: Connect your own AI provider

---

## Publishing to App Store

### Phase 1: Apple Developer Setup

1. **Enroll in Apple Developer Program**
   - Go to [developer.apple.com](https://developer.apple.com)
   - Enroll ($99/year for individuals, $299/year for organizations)
   - Wait for approval (usually 24-48 hours)

2. **Create App ID**
   - Go to Certificates, Identifiers & Profiles
   - Create a new App ID with bundle identifier: `com.qxlsz.kquarks`
   - Enable HealthKit capability

3. **Create Provisioning Profiles**
   - Development profile for testing
   - Distribution profile for App Store

### Phase 2: App Store Connect Setup

1. **Create App in App Store Connect**
   - Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - Click "+" to add a new app
   - Fill in app information:
     - Name: KQuarks
     - Primary language: English
     - Bundle ID: com.qxlsz.kquarks
     - SKU: kquarks-health-app

2. **Prepare App Store Listing**
   - **App Icon**: 1024x1024 PNG (no transparency)
   - **Screenshots**: Required sizes for each device
     - iPhone 6.7" (1290 x 2796)
     - iPhone 6.5" (1284 x 2778)
     - iPhone 5.5" (1242 x 2208)
   - **App Description**: Compelling description of features
   - **Keywords**: health, fitness, sleep, heart rate, etc.
   - **Privacy Policy URL**: Required for HealthKit apps
   - **Support URL**: Your support page

3. **HealthKit Requirements**
   - Provide detailed usage descriptions for each health data type
   - Explain why the app needs access to health data
   - Create a privacy policy covering health data handling

### Phase 3: Build & Submit

1. **Archive the App**
   ```bash
   cd ios
   xcodebuild archive \
     -project KQuarks.xcodeproj \
     -scheme KQuarks \
     -archivePath build/KQuarks.xcarchive \
     -destination 'generic/platform=iOS'
   ```

2. **Export for App Store**
   ```bash
   xcodebuild -exportArchive \
     -archivePath build/KQuarks.xcarchive \
     -exportPath build/AppStore \
     -exportOptionsPlist ExportOptions.plist
   ```

3. **Upload to App Store Connect**
   - Use Xcode Organizer (recommended)
   - Or use `xcrun altool` / Transporter app

4. **Submit for Review**
   - Select the uploaded build
   - Complete all required metadata
   - Submit for App Review

### Phase 4: App Review

- **Timeline**: Usually 24-48 hours, can be longer
- **Common rejection reasons for health apps**:
  - Missing privacy policy
  - Inadequate health data usage descriptions
  - Broken functionality
  - Incomplete metadata

### Checklist for Submission

- [ ] Apple Developer Program enrolled
- [ ] App ID created with HealthKit capability
- [ ] Bundle ID matches in Xcode project
- [ ] App icons added (all required sizes)
- [ ] Launch screen configured
- [ ] Privacy policy URL (required for HealthKit)
- [ ] Health data usage descriptions in Info.plist
- [ ] Screenshots for all required device sizes
- [ ] App description and keywords
- [ ] Support URL
- [ ] Age rating completed
- [ ] Tested on physical device
- [ ] No crashes or critical bugs

---

## Roadmap

- [x] Project setup and architecture
- [x] iOS app skeleton with HealthKit
- [x] CI/CD pipelines
- [ ] Supabase cloud deployment
- [ ] Basic health data sync
- [ ] Web dashboard with charts
- [ ] AI insights integration
- [ ] App Store submission
- [ ] Android app (Health Connect)
- [ ] Apple Watch app

## Development

See [CLAUDE.md](./CLAUDE.md) for coding guidelines and conventions.

See [AGENTS.md](./AGENTS.md) for swarm agent configurations.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

MIT License - see [LICENSE](./LICENSE) for details.
