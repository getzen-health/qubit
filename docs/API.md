# KQuarks API Documentation

## Authentication
All API endpoints require a valid Supabase JWT Bearer token.

## Base URL
`https://kquarks.vercel.app/api`

## Endpoints

### Health
- `GET /health/summary` — Daily health summary
- `GET /health/correlations` — Metric correlation heatmap
- `GET /health/anomalies` — Detected anomalies

### Food
- `GET /food/scan?barcode=NNN` — Scan product by barcode
- `GET /food/search?q=query` — Search food database
- `POST /food/log` — Log food intake

### Integrations
- `GET /integrations/fitbit/authorize` — Connect Fitbit
- `GET /integrations/garmin/authorize` — Connect Garmin
- `GET /integrations/google-fit/authorize` — Connect Google Fit
- `GET /integrations/oura/authorize` — Connect Oura Ring
- `POST /integrations/oura/sync` — Sync Oura data

### Insights
- `GET /insights` — AI health insights
- `GET /injury-risk` — Injury risk score

### Export
- `GET /export?format=csv&from=...&to=...` — Export data
