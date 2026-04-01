# GetZen Deep Links

GetZen supports deep linking to navigate directly to specific features within the app. Deep links use the `getzen://` URL scheme and can be invoked from external sources like websites, push notifications, or other apps.

## URL Format

```
getzen://<destination>[/<sub-path>]
```

## Supported Destinations

| URL | Destination | Notes |
|-----|-------------|-------|
| `getzen://ready` or `getzen://readiness` | Readiness Score | Daily readiness dashboard |
| `getzen://sleep` | Sleep Dashboard | Sleep tracking and analysis |
| `getzen://workouts` or `getzen://workout` | Workouts | Workout history and logging |
| `getzen://food/scan` | Food Barcode Scanner | Scan product barcodes |
| `getzen://food/diary` or `getzen://nutrition/diary` | Food Diary | Daily meal tracking |
| `getzen://food/history` or `getzen://nutrition/history` | Scan History | Previous barcode scans |
| `getzen://water` | Water Tracking | Hydration logger |
| `getzen://habits` or `getzen://habit` | Habits | Daily habit streaks |
| `getzen://hrv` | Heart Rate Variability | HRV trends and recovery |
| `getzen://body` | Body Metrics | Weight, body composition |
| `getzen://glucose` | Glucose Dashboard | Blood glucose tracking |
| `getzen://vitals` | Vitals | Blood pressure, oxygen, temperature |
| `getzen://social` | Social & Challenges | Challenges and friend activity |
| `getzen://achievements` | Achievements | Badges and milestones |
| `getzen://settings` | Settings | App preferences |
| `getzen://profile` | Profile | User profile |

## Examples

### Navigate to food diary
```
getzen://food/diary
```

### Open sleep dashboard
```
getzen://sleep
```

### Start food barcode scanner
```
getzen://food/scan
```

### View achievements
```
getzen://achievements
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
