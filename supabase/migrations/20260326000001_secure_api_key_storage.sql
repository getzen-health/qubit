-- Enable pgcrypto extension for symmetric encryption primitives
create extension if not exists pgcrypto;

-- Add a generated column to user_ai_settings so callers can check whether a
-- custom key exists without needing to touch the encrypted value.
alter table public.user_ai_settings
  add column if not exists has_custom_key boolean
    generated always as (api_key_encrypted is not null) stored;
