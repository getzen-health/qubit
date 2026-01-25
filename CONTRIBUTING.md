# Contributing to Quarks

Thank you for your interest in contributing to Quarks!

## Development Setup

### Prerequisites

- **macOS 14+** (for iOS development)
- **Xcode 15+**
- **Node.js 20+**
- **Supabase CLI**

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/qxlsz/quarks.git
   cd quarks
   ```

2. **Set up the backend**
   ```bash
   # Install Supabase CLI
   brew install supabase/tap/supabase

   # Start local Supabase
   supabase start

   # Apply migrations
   supabase db push
   ```

3. **Set up iOS app**
   ```bash
   cd ios
   open Quarks.xcodeproj
   ```

4. **Set up web dashboard**
   ```bash
   cd web
   npm install
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   npm run dev
   ```

## Building

### iOS App

```bash
cd ios

# Build for simulator
xcodebuild build \
  -project Quarks.xcodeproj \
  -scheme Quarks \
  -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO

# Run tests
xcodebuild test \
  -project Quarks.xcodeproj \
  -scheme Quarks \
  -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO
```

### Web Dashboard

```bash
cd web

# Development
npm run dev

# Type check
npm run type-check

# Lint
npm run lint

# Build for production
npm run build

# Run tests
npm test
```

### Supabase

```bash
# Start local development
supabase start

# Create new migration
supabase migration new <migration_name>

# Apply migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > web/lib/database.types.ts

# Deploy edge functions
supabase functions deploy
```

## Code Style

### Swift

- Follow [Swift API Design Guidelines](https://swift.org/documentation/api-design-guidelines/)
- Use SwiftUI for all UI components
- Use `@Observable` for view models
- Use `async/await` for asynchronous code
- Run SwiftLint before committing:
  ```bash
  cd ios && swiftlint
  ```

### TypeScript

- Use TypeScript strict mode
- Use functional React components
- Use Next.js App Router patterns
- Run linter before committing:
  ```bash
  cd web && npm run lint
  ```

### SQL

- Use snake_case for table and column names
- Always add RLS policies for new tables
- Include `created_at` and `updated_at` timestamps
- Write reversible migrations when possible

## Git Workflow

1. Create a feature branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes with clear, atomic commits

3. Push and create a pull request
   ```bash
   git push -u origin feature/your-feature-name
   ```

4. Fill out the PR template

5. Wait for CI checks and code review

## Commit Messages

Use clear, descriptive commit messages:

```
feat: Add sleep tracking dashboard
fix: Correct heart rate calculation
docs: Update API documentation
refactor: Simplify HealthKit service
test: Add unit tests for sync service
chore: Update dependencies
```

## Pull Requests

- Fill out the PR template completely
- Ensure all CI checks pass
- Keep PRs focused and reasonably sized
- Include screenshots for UI changes
- Update documentation if needed

## Testing

### iOS

- Write unit tests for services and view models
- Use XCTest framework
- Mock HealthKit and network calls

### Web

- Write unit tests with Vitest
- Use React Testing Library for components
- Write E2E tests with Playwright for critical flows

## Questions?

Open an issue or start a discussion on GitHub.
