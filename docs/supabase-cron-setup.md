# Supabase Cron Setup for GetZen AI Features

## Morning Briefing (daily 7am UTC)
Run this SQL in Supabase Dashboard → SQL Editor:
```sql
select cron.schedule(
  'morning-briefing',
  '0 7 * * *',
  $$
  select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/morning-briefing',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := (
      select jsonb_agg(jsonb_build_object('user_id', id::text))
      from auth.users
      where last_sign_in_at > now() - interval '30 days'
    )
  )
  $$
);
```

## Anomaly Detector (after each daily_summaries insert)
Create a Postgres trigger:
```sql
create or replace function trigger_anomaly_check()
returns trigger language plpgsql as $$
begin
  perform net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/anomaly-detector',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||current_setting('app.service_role_key')),
    body := jsonb_build_object('user_id', NEW.user_id::text, 'date', NEW.date::text)
  );
  return NEW;
end;
$$;

create trigger on_daily_summary_insert
after insert on daily_summaries
for each row execute function trigger_anomaly_check();
```

## Weekly Predictions (Sunday 10pm UTC)
```sql
select cron.schedule(
  'weekly-predictions',
  '0 22 * * 0',
  $$ -- similar http_post to /functions/v1/predictions for all active users $$
);
```
