-- Migration: Performance indexes for high-volume feed, messaging, and admin queries (PERF-01, PERF-04)

-- 1. Optimized feed indexes with status, pinned_at, and category
create index if not exists posts_feed_pinned_idx
  on posts(community_id, status, pinned_at desc nulls last, created_at desc);

create index if not exists posts_category_pinned_idx
  on posts(community_id, category, status, pinned_at desc nulls last, created_at desc);

-- 2. Fast unread messages lookup and thread retrieval
create index if not exists messages_unread_recipient_idx
  on messages(recipient_id)
  where read_at is null;

create index if not exists messages_thread_participants_idx
  on messages(community_id, sender_id, recipient_id, created_at);

-- 3. Fast admin queue lookups
create index if not exists reports_admin_queue_idx
  on reports(community_id, status, created_at desc);

create index if not exists account_deletion_requests_community_status_idx
  on account_deletion_requests(community_id, status, created_at desc);
