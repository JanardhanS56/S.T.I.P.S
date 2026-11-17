-- Migration: Add post_reactions table
create table if not exists post_reactions (
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  community_id uuid not null references communities(id) on delete cascade,
  kind text not null check (kind in ('like', 'thanks', 'laugh')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists post_reactions_post_idx on post_reactions(post_id);
create index if not exists post_reactions_user_created_idx on post_reactions(user_id, created_at);
create index if not exists post_reactions_community_idx on post_reactions(community_id);

-- Enable RLS
alter table post_reactions enable row level security;
