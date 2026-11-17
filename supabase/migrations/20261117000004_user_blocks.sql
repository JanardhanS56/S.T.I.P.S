-- Migration: Add user_blocks table
create table if not exists user_blocks (
  blocker_id uuid not null references users(id) on delete cascade,
  blocked_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create index if not exists user_blocks_blocker_idx on user_blocks(blocker_id);
create index if not exists user_blocks_blocked_idx on user_blocks(blocked_id);

-- Enable RLS
alter table user_blocks enable row level security;
