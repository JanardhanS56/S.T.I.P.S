-- S.T.I.P.S database schema. Run once in Supabase: SQL Editor > New query > paste > Run.
-- Access model: the browser NEVER talks to Supabase directly. Only the Express API does, using
-- the service role key. Row Level Security is switched on with no policies, so the public anon
-- key can read or write nothing even if it leaks.

create extension if not exists pgcrypto;

create table communities (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  code text not null unique,
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key default gen_random_uuid(),
  community_id uuid references communities(id) on delete cascade,
  username text not null unique check (username = lower(username) and char_length(username) between 3 and 32),
  display_name text not null check (char_length(display_name) between 1 and 60),
  role text not null check (role in ('admin','teacher','student')),
  password_hash text not null,
  must_change_password boolean not null default true,
  bio text not null default '' check (char_length(bio) <= 160),
  department text not null default '' check (char_length(department) <= 60),
  status text not null default 'active' check (status in ('active','muted','suspended')),
  failed_attempts int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);
create index users_community_idx on users(community_id);

create table posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references communities(id) on delete cascade,
  author_id uuid not null references users(id) on delete cascade,
  category text not null check (category in ('Notice','Event','Meme','Moment')),
  body text not null check (char_length(body) between 1 and 280),
  status text not null default 'visible' check (status in ('visible','hidden')),
  created_at timestamptz not null default now()
);
create index posts_feed_idx on posts(community_id, status, created_at desc);

create table polls (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references communities(id) on delete cascade,
  author_id uuid not null references users(id) on delete cascade,
  question text not null check (char_length(question) between 5 and 120),
  closes_at timestamptz not null,
  status text not null default 'visible' check (status in ('visible','hidden')),
  created_at timestamptz not null default now()
);
create index polls_idx on polls(community_id, created_at desc);

create table poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 60)
);

-- One vote per person per poll, enforced by the database itself.
create table poll_votes (
  poll_id uuid not null references polls(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  option_id uuid not null references poll_options(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (poll_id, user_id)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references communities(id) on delete cascade,
  sender_id uuid not null references users(id) on delete cascade,
  recipient_id uuid not null references users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);
create index messages_pair_idx on messages(sender_id, recipient_id, created_at desc);
create index messages_recipient_idx on messages(recipient_id, created_at desc);

create table reports (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references communities(id) on delete cascade,
  reporter_id uuid not null references users(id) on delete cascade,
  target_type text not null check (target_type in ('post','message','poll')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 3 and 200),
  status text not null default 'open' check (status in ('open','actioned','dismissed')),
  created_at timestamptz not null default now()
);

alter table communities  enable row level security;
alter table users        enable row level security;
alter table posts        enable row level security;
alter table polls        enable row level security;
alter table poll_options enable row level security;
alter table poll_votes   enable row level security;
alter table messages     enable row level security;
alter table reports      enable row level security;
