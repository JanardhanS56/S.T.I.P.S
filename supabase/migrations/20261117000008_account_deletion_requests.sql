-- Migration: Add account deletion requests table
create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  community_id uuid references public.communities(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  reason text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.users(id) on delete set null
);

create index if not exists idx_deletion_requests_user on public.account_deletion_requests(user_id);
create index if not exists idx_deletion_requests_community on public.account_deletion_requests(community_id, status);

alter table public.account_deletion_requests enable row level security;
