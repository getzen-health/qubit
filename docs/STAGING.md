# Staging Environment Setup

## Overview
KQuarks uses separate Supabase projects for staging and production.

## Staging Setup
1. Create a new Supabase project at https://supabase.com for staging
2. Run all migrations: `supabase db push --project-ref <staging-ref>`
3. Set Vercel environment variables for Preview deployments:
   - `NEXT_PUBLIC_SUPABASE_URL` → staging Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → staging anon key

## Database Backup Strategy
- Supabase Pro plan includes daily automated backups (7-day retention)
- For additional safety, schedule weekly pg_dump via cron:

```bash
#!/bin/bash
# Run from Supabase CLI
supabase db dump --project-ref <prod-ref> > backups/$(date +%Y%m%d).sql
```

## Environment Promotion
- Feature branches → Vercel Preview (uses staging Supabase)
- `main` → Vercel Production (uses production Supabase)
