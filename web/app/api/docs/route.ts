import { NextResponse } from 'next/server'

const API_DOCS = {
  version: '1.0.0',
  title: 'KQuarks Health API',
  description: 'REST API for KQuarks health tracking platform',
  baseUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'https://kquarks.vercel.app',
  authentication: 'Bearer token (Supabase JWT) required for all endpoints',
  endpoints: {
    health: {
      'GET /api/health/summary': 'Get daily health summary with steps, calories, heart rate',
      'GET /api/health/correlations': 'Get Pearson correlation heatmap between health metrics',
      'GET /api/health/anomalies': 'Get detected health anomalies for the last 7 days',
    },
    food: {
      'GET /api/food/scan?barcode=NNN': 'Scan product barcode, returns nutrition + allergen warnings + Yuka-style score',
      'GET /api/food/search?q=query': 'Search food database by name',
      'POST /api/food/log': 'Log food intake for a meal',
    },
    integrations: {
      'GET /api/integrations/fitbit/authorize': 'Start Fitbit OAuth flow',
      'GET /api/integrations/garmin/authorize': 'Start Garmin OAuth flow',
      'GET /api/integrations/google-fit/authorize': 'Start Google Fit OAuth flow',
      'GET /api/integrations/oura/authorize': 'Start Oura Ring OAuth flow',
      'POST /api/integrations/oura/sync': 'Sync latest Oura sleep data',
    },
    insights: {
      'GET /api/insights': 'Get AI-generated health insights',
      'GET /api/injury-risk': 'Get injury risk score based on training load and recovery metrics',
    },
    export: {
      'GET /api/export?format=csv|json&from=YYYY-MM-DD&to=YYYY-MM-DD': 'Export health data (max 10K rows, paginated)',
    }
  }
}

export async function GET() {
  return NextResponse.json(API_DOCS, {
    headers: { 'Cache-Control': 'public, max-age=3600' }
  })
}
