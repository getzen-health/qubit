# KQuarks Deep Links

KQuarks supports deep linking to navigate directly to specific features within the app. Deep links use the `kquarks://` URL scheme and can be invoked from external sources like websites, push notifications, or other apps.

## URL Format

```
kquarks://<destination>[/<sub-path>]
```

## Supported Destinations

| URL | Destination | Notes |
|-----|-------------|-------|
| `kquarks://ready` or `kquarks://readiness` | Readiness Score | Daily readiness dashboard |
| `kquarks://sleep` | Sleep Dashboard | Sleep tracking and analysis |
| `kquarks://workouts` or `kquarks://workout` | Workouts | Workout history and logging |
| `kquarks://food/scan` | Food Barcode Scanner | Scan product barcodes |
| `kquarks://food/diary` or `kquarks://nutrition/diary` | Food Diary | Daily meal tracking |
| `kquarks://food/history` or `kquarks://nutrition/history` | Scan History | Previous barcode scans |
| `kquarks://water` | Water Tracking | Hydration logger |
| `kquarks://habits` or `kquarks://habit` | Habits | Daily habit streaks |
| `kquarks://hrv` | Heart Rate Variability | HRV trends and recovery |
| `kquarks://body` | Body Metrics | Weight, body composition |
| `kquarks://glucose` | Glucose Dashboard | Blood glucose tracking |
| `kquarks://vitals` | Vitals | Blood pressure, oxygen, temperature |
| `kquarks://social` | Social & Challenges | Challenges and friend activity |
| `kquarks://achievements` | Achievements | Badges and milestones |
| `kquarks://settings` | Settings | App preferences |
| `kquarks://profile` | Profile | User profile |

## Examples

### Navigate to food diary
```
kquarks://food/diary
```

### Open sleep dashboard
```
kquarks://sleep
```

### Start food barcode scanner
```
kquarks://food/scan
```

### View achievements
```
kquarks://achievements
```

## Implementation

Deep links are handled by `DeepLinkHandler.swift` in the iOS app. When a deep link is received:

1. The app validates the URL scheme
2. Extracts the destination and optional path
3. Sets the appropriate navigation state
4. The SwiftUI navigation system routes to the target view

## Shorthand Aliases

Some destinations support multiple aliases for convenience:

- `readiness` → `ready`
- `nutrition` → `food`
- `workout` → `workouts`
- `habit` → `habits`
