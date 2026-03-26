# E2E Tests

End-to-end tests for critical KQuarks user flows using Playwright.

## Test Coverage

### 1. Authentication Flow (`auth.spec.ts`)
- Navigate to login page
- Verify login form elements are visible
- Test invalid credentials error handling
- Check password reset link availability

### 2. Dashboard Load (`dashboard.spec.ts`)
- Load dashboard and verify key metric cards
- Display steps card
- Display sleep card
- Display heart rate card
- Verify no error pages appear

### 3. Food Scanner Flow (`food-scanner.spec.ts`)
- Navigate to food scanner page
- Display food search interface
- Allow searching for food items
- Check camera/barcode scanner availability
- Display search results

### 4. Export Flow (`export.spec.ts`)
- Navigate to export page
- Display export format options (CSV, JSON, PDF)
- Allow CSV export
- Show data selection options
- Show date range selection
- Trigger download when export is clicked

## Running Tests

### Run all E2E tests
```bash
npm run e2e
```

### Run tests in UI mode (interactive)
```bash
npm run e2e:ui
```

### Debug tests step-by-step
```bash
npm run e2e:debug
```

### Run specific test file
```bash
npx playwright test e2e/auth.spec.ts
```

### Run tests in CI environment
```bash
npm run e2e
```

## Test Environment

- **Browser Support**: Chromium, Firefox, WebKit
- **Base URL**: http://localhost:3000
- **Screenshots**: Captured on failure
- **Video Traces**: Recorded on first retry

## Configuration

Tests are configured in `playwright.config.ts`:
- Runs against local dev server (auto-starts on test run)
- Parallel execution enabled for faster results
- Reports generated as HTML

## Notes

- Tests use `getByRole()` and `getByText()` for resilient selectors
- Tests are designed to be independent and can run in any order
- No test data setup required - tests use public pages or handle missing data
