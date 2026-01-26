# KQuarks - Swarm Agent Definitions

This file defines specialized agents for parallel development of KQuarks.

## Agent Definitions

### ios-agent

**Description**: iOS app development specialist for Swift/SwiftUI and HealthKit integration.

**Responsibilities**:
- SwiftUI views and components
- HealthKit data reading and permissions
- SwiftData models and persistence
- Supabase iOS SDK integration
- MVVM view models
- Background sync implementation

**Tools**: Read, Write, Edit, Glob, Grep, Bash (for xcodebuild)

**Context Files**:
- `ios/Quarks/**/*.swift`
- `CLAUDE.md`

---

### web-agent

**Description**: Web dashboard development with Next.js, React, and Tailwind CSS.

**Responsibilities**:
- Next.js App Router pages
- React components with shadcn/ui
- Data visualization with Recharts
- Supabase client integration
- Responsive design
- Authentication flows

**Tools**: Read, Write, Edit, Glob, Grep, Bash (for npm/pnpm)

**Context Files**:
- `web/**/*.{ts,tsx,css}`
- `CLAUDE.md`

---

### supabase-agent

**Description**: Backend development with Supabase, PostgreSQL, and Edge Functions.

**Responsibilities**:
- Database schema design and migrations
- Row Level Security policies
- Edge Functions (Deno/TypeScript)
- Real-time subscriptions
- Auth configuration
- API design

**Tools**: Read, Write, Edit, Glob, Grep, Bash (for supabase CLI)

**Context Files**:
- `supabase/**/*`
- `CLAUDE.md`

---

### ai-insights-agent

**Description**: AI integration specialist for health insights and analysis.

**Responsibilities**:
- Claude API integration
- OpenAI API integration
- Health data analysis prompts
- Insight generation logic
- User AI settings management
- Edge function for AI calls

**Tools**: Read, Write, Edit, Glob, Grep, WebFetch

**Context Files**:
- `supabase/functions/generate-insights/**/*`
- `ios/Quarks/Services/InsightsService.swift`
- `web/lib/insights.ts`

---

### docs-agent

**Description**: Documentation and project management.

**Responsibilities**:
- README updates
- API documentation
- Setup guides
- Architecture diagrams
- Changelog management

**Tools**: Read, Write, Edit, Glob

**Context Files**:
- `*.md`
- `docs/**/*`

---

## Swarm Configurations

### Full Stack Development

Launch all agents for comprehensive feature development:

```
agents: [ios-agent, web-agent, supabase-agent]
```

### iOS Feature

Focus on mobile app development:

```
agents: [ios-agent, supabase-agent]
```

### Web Feature

Focus on web dashboard:

```
agents: [web-agent, supabase-agent]
```

### AI Feature

Implement AI-powered insights:

```
agents: [ai-insights-agent, supabase-agent, ios-agent, web-agent]
```

## Task Examples

### Example: Add Sleep Tracking

```yaml
task: "Implement sleep tracking feature"
agents:
  - supabase-agent:
      - Create sleep_records table migration
      - Add RLS policies for sleep data
  - ios-agent:
      - Read HKCategorySample for sleep analysis
      - Create SleepView with stage breakdown
      - Implement sync to Supabase
  - web-agent:
      - Create sleep dashboard page
      - Add sleep stage pie chart
      - Show weekly sleep trends
```

### Example: Add Heart Rate Monitoring

```yaml
task: "Implement heart rate monitoring"
agents:
  - supabase-agent:
      - Create heart_rate_samples table
      - Add time-series indexes
  - ios-agent:
      - Read HKQuantitySample for heart rate
      - Background observation for live HR
      - Sync samples to Supabase
  - web-agent:
      - Create heart rate chart component
      - Show daily HR range
      - Display resting HR trends
```

### Example: AI Health Insights

```yaml
task: "Implement AI-powered health insights"
agents:
  - supabase-agent:
      - Create user_ai_settings table
      - Create generate-insights edge function
  - ai-insights-agent:
      - Design insight generation prompts
      - Implement Claude API calls
      - Handle multi-provider support
  - ios-agent:
      - Create InsightsView
      - Display daily insights card
  - web-agent:
      - Create insights dashboard section
      - Add AI provider settings page
```

## Agent Communication

Agents should:
1. Read `CLAUDE.md` for project context
2. Check existing code patterns before creating new ones
3. Use consistent naming conventions
4. Update shared types/models when changing data structures
5. Document public APIs and complex logic
