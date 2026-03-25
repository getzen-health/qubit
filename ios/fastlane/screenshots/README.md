# App Store Screenshots

This directory contains screenshots for the App Store listing.

## Requirements

Screenshots must meet the following specifications:
- Resolution: 1170 x 2532 px (iPhone 15 Pro)
- Safe area margin: At least 20px from edges
- Format: PNG or JPG

## Screen Descriptions

1. **health_tracking.png** - Health tracking dashboard with steps, HRV, and sleep data
2. **readiness_score.png** - Daily readiness score calculation
3. **food_scanner.png** - Barcode scanner for food intelligence
4. **ai_insights.png** - AI-powered health insights
5. **social_challenges.png** - Social challenges and leaderboards

## Generating Screenshots

Use fastlane snapshot to automatically generate screenshots:

```bash
cd ios
fastlane snapshot
```

This requires UI tests configured with snapshots in KQuarksUITests.
