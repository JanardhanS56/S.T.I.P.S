-- Migration: Add read_at column to messages table
alter table messages
  add column if not exists read_at timestamptz default null;

create index if not exists messages_recipient_unread_idx on messages(recipient_id, read_at);
