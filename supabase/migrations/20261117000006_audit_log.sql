-- Migration: Add audit_log table
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references communities(id) on delete cascade,
  actor_id uuid not null references users(id) on delete cascade,
  action text not null,
  target_type text not null,
  target_id uuid,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_community_created_idx on audit_log(community_id, created_at desc);

-- Enable RLS
alter table audit_log enable row level security;
