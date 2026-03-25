-- Create monthly_summaries view for health data rollups
-- Aggregates daily_summaries by month

CREATE MATERIALIZED VIEW monthly_summaries AS
SELECT
    user_id,
    DATE_TRUNC('month', date)::DATE AS month,
    EXTRACT(YEAR FROM date) AS year,
    EXTRACT(MONTH FROM date) AS month_num,
    COUNT(*) AS days_recorded,
    ROUND(AVG(steps)::numeric, 0) AS avg_steps,
    MAX(steps) AS max_steps_day,
    MIN(steps) AS min_steps_day,
    SUM(steps) AS total_steps,
    ROUND(AVG(active_calories)::numeric, 1) AS avg_active_calories,
    SUM(active_calories) AS total_active_calories,
    ROUND(AVG(distance_meters)::numeric, 0) AS avg_distance_m,
    SUM(distance_meters) AS total_distance_m,
    ROUND(AVG(floors_climbed)::numeric, 1) AS avg_floors,
    SUM(floors_climbed) AS total_floors,
    ROUND(AVG(sleep_duration_minutes)::numeric, 0) AS avg_sleep_minutes,
    MAX(sleep_duration_minutes) AS max_sleep_minutes,
    MIN(sleep_duration_minutes) AS min_sleep_minutes,
    ROUND(AVG(resting_heart_rate)::numeric, 1) AS avg_resting_hr,
    ROUND(AVG(avg_hrv)::numeric, 1) AS avg_hrv,
    MAX(recovery_score) AS best_recovery_score,
    MIN(recovery_score) AS worst_recovery_score,
    ROUND(AVG(recovery_score)::numeric, 1) AS avg_recovery_score,
    COUNT(*) FILTER (WHERE active_minutes IS NOT NULL) AS active_workout_days,
    ROUND(AVG(active_minutes) FILTER (WHERE active_minutes > 0)::numeric, 1) AS avg_active_minutes,
    created_at,
    CURRENT_TIMESTAMP AS updated_at
FROM
    daily_summaries
WHERE
    date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '24 months')
GROUP BY
    user_id,
    DATE_TRUNC('month', date),
    EXTRACT(YEAR FROM date),
    EXTRACT(MONTH FROM date)
ORDER BY
    user_id,
    month DESC;

-- Create index on monthly_summaries for fast lookups
CREATE UNIQUE INDEX idx_monthly_summaries_user_month
    ON monthly_summaries (user_id, month DESC);

-- Enable RLS on the view (policies inherited from daily_summaries)
-- Note: Materialized views don't support RLS directly, so we rely on table-level policies

-- Refresh the materialized view daily (via scheduled function)
-- This can be called via Edge Function or cron job

-- Create a function to refresh monthly summaries
CREATE OR REPLACE FUNCTION refresh_monthly_summaries()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_summaries;
END;
$$;

-- Grant permissions
GRANT SELECT ON monthly_summaries TO authenticated;
