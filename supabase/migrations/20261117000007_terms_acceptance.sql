-- Migration: Add terms acceptance tracking to users
alter table public.users
  add column if not exists accepted_terms_at timestamptz,
  add column if not exists terms_version integer not null default 0;

comment on column public.users.accepted_terms_at is 'Timestamp when the member accepted the latest terms and privacy policy';
comment on column public.users.terms_version is 'Version number of terms accepted by the member';
