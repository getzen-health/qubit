create index if not exists idx_rate_limit_events_created_at on rate_limit_events(created_at);
create index if not exists idx_api_metrics_created_at on api_metrics(created_at);
create index if not exists idx_crash_reports_created_at on crash_reports(created_at);
