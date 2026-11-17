-- Migration: Add pinned_at and is_official columns to posts
alter table posts
  add column if not exists pinned_at timestamptz default null,
  add column if not exists is_official boolean not null default false;

create index if not exists posts_community_pinned_idx on posts(community_id, pinned_at desc nulls last, created_at desc);
