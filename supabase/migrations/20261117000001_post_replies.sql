-- Migration: Add post_replies table for single-depth post replies
create table if not exists post_replies (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references posts(id) on delete cascade,
  post_id uuid not null references posts(id) on delete cascade,
  community_id uuid not null references communities(id) on delete cascade,
  author_id uuid not null references users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 280),
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  created_at timestamptz not null default now()
);

create index if not exists post_replies_parent_created_idx on post_replies(parent_id, created_at);
create index if not exists post_replies_post_created_idx on post_replies(post_id, created_at);
create index if not exists post_replies_author_created_idx on post_replies(author_id, created_at);
create index if not exists post_replies_community_status_idx on post_replies(community_id, status);

-- Enable RLS
alter table post_replies enable row level security;
