# Quarks

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
| iOS App | Swift, SwiftUI, HealthKit |
| Backend | Supabase (PostgreSQL, Auth, Realtime) |
| Web | Next.js 14, Tailwind CSS, shadcn/ui |
| AI | Claude API (configurable) |

## Project Structure

```
├── ios/                 # iOS app (Swift/SwiftUI)
├── web/                 # Web dashboard (Next.js)
├── supabase/           # Backend (migrations, functions)
├── docs/               # Documentation
├── CLAUDE.md           # Claude Code guidelines
└── AGENTS.md           # Swarm agent definitions
```

## Getting Started

### Prerequisites

- Xcode 15+ (for iOS development)
- Node.js 18+ (for web development)
- Supabase CLI
- A Supabase project

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/qxlsz/quarks.git
   cd quarks
   ```

2. **Set up Supabase**
   ```bash
   # Install Supabase CLI
   brew install supabase/tap/supabase

   # Start local Supabase
   supabase start

   # Apply migrations
   supabase db push
   ```

3. **iOS App**
   ```bash
   open ios/Quarks.xcodeproj
   # Configure signing and run on device
   ```

4. **Web Dashboard**
   ```bash
   cd web
   npm install
   cp .env.example .env.local
   # Add your Supabase credentials to .env.local
   npm run dev
   ```

## Health Data

The app tracks the following health metrics:

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

Insights include:
- Daily health summaries
- Trend analysis and recommendations
- Anomaly detection
- Correlation analysis (e.g., sleep vs. recovery)

## Development

See [CLAUDE.md](./CLAUDE.md) for coding guidelines and conventions.

See [AGENTS.md](./AGENTS.md) for swarm agent configurations.

## Roadmap

- [x] Project setup and architecture
- [ ] Supabase database schema
- [ ] iOS app skeleton with HealthKit
- [ ] Basic health data sync
- [ ] Web dashboard with charts
- [ ] AI insights integration
- [ ] Android app (Health Connect)
- [ ] Apple Watch app

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.
