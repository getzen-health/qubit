-- Migration 006: Daily AI Insights Cron Setup
-- Adds scheduling infrastructure for automatic daily health insights generation.

-- Add insight_type index for filtering cron vs manual insights
CREATE INDEX IF NOT EXISTS idx_health_insights_type
    ON health_insights(user_id, insight_type, created_at DESC);

-- ============================================
-- CRON JOB SETUP (pg_cron + pg_net)
-- ============================================
-- Prerequisites: Enable these extensions in Supabase Dashboard
--   Dashboard → Database → Extensions → Enable: pg_cron, pg_net
--
-- After enabling extensions, run the following in Supabase SQL Editor
-- (replace placeholders with your actual values):
--
--   SELECT cron.schedule(
--     'daily-health-insights',        -- job name
--     '0 6 * * *',                    -- 6:00 AM UTC daily
--     $$
--     SELECT net.http_post(
--       url         := 'https://<PROJECT_REF>.supabase.co/functions/v1/daily-insights-cron',
--       headers     := jsonb_build_object(
--                        'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
--                        'Content-Type', 'application/json'
--                      ),
--       body        := '{}'::jsonb,
--       timeout_milliseconds := 300000  -- 5 minute timeout
--     ) AS request_id;
--     $$
--   );
--
-- To verify the cron job is registered:
--   SELECT * FROM cron.job WHERE jobname = 'daily-health-insights';
--
-- To view execution history:
--   SELECT * FROM cron.job_run_details
--   WHERE jobname = 'daily-health-insights'
--   ORDER BY start_time DESC LIMIT 20;
--
-- To remove the job:
--   SELECT cron.unschedule('daily-health-insights');

-- ============================================
-- DAILY INSIGHTS STATS VIEW
-- ============================================
-- Optional: A view to monitor daily cron activity.

CREATE OR REPLACE VIEW daily_insights_summary AS
SELECT
    date,
    COUNT(*)                                            AS total_insights,
    COUNT(DISTINCT user_id)                             AS users_with_insights,
    COUNT(*) FILTER (WHERE insight_type = 'daily_cron') AS cron_insights,
    COUNT(*) FILTER (WHERE insight_type = 'manual')     AS manual_insights,
    COUNT(*) FILTER (WHERE priority = 'high')           AS high_priority,
    COUNT(*) FILTER (WHERE read_at IS NOT NULL)         AS read_count
FROM health_insights
GROUP BY date
ORDER BY date DESC;
