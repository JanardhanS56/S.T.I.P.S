-- Migration: Add token_version to users for session revocation and 'sign out everywhere'
alter table users
  add column if not exists token_version int not null default 0;
