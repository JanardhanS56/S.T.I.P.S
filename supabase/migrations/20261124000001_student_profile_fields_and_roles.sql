-- Migration: Add student profile fields (roll_number, section) and allow expanded/custom roles
-- Run in Supabase SQL Editor:
-- Dashboard > SQL Editor > New query > Paste & Run

-- 1. Add roll_number and section columns to users table
alter table users add column if not exists roll_number text not null default '' check (char_length(roll_number) <= 40);
alter table users add column if not exists section text not null default '' check (char_length(section) <= 40);

-- 2. Expand role check constraint to support student, teacher, non_staff, external_guide, and custom roles
alter table users drop constraint if exists users_role_check;
alter table users add constraint users_role_check check (char_length(role) between 1 and 40);
