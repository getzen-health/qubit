-- Add Pro subscription columns to user_profiles
-- These are set server-side after RevenueCat webhook confirms purchase.

alter table user_profiles add column if not exists is_pro boolean not null default false;
alter table user_profiles add column if not exists pro_expires_at timestamptz;
