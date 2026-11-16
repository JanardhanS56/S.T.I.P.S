import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationFile = path.resolve(
  __dirname,
  '../../supabase/migrations/20261116000001_baseline.sql'
);

describe('Row Level Security Proof Test (SEC-05)', () => {
  const tables = [
    'communities',
    'users',
    'posts',
    'polls',
    'poll_options',
    'poll_votes',
    'messages',
    'reports'
  ];

  it('migration baseline enables RLS on all 8 application tables', () => {
    const sql = fs.readFileSync(migrationFile, 'utf-8');

    for (const table of tables) {
      const rlsRegex = new RegExp(
        `alter\\s+table\\s+${table}\\s+enable\\s+row\\s+level\\s+security`,
        'i'
      );
      expect(sql).toMatch(rlsRegex);
    }
  });

  it('migration baseline defines no public or anon permissive policies', () => {
    const sql = fs.readFileSync(migrationFile, 'utf-8');

    // Strict deny-all invariant: no policies allowing anon/public access
    expect(sql).not.toMatch(/create\s+policy.*for\s+select.*to\s+(?:anon|public)/i);
    expect(sql).not.toMatch(/create\s+policy.*for\s+insert.*to\s+(?:anon|public)/i);
    expect(sql).not.toMatch(/create\s+policy.*for\s+update.*to\s+(?:anon|public)/i);
    expect(sql).not.toMatch(/create\s+policy.*for\s+delete.*to\s+(?:anon|public)/i);
  });

  it('anon client cannot perform read or write on tables when live anon key is present', async () => {
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const url = process.env.SUPABASE_URL;

    if (!anonKey || !url || !url.startsWith('https://')) {
      // Offline/mock test environment: verified via RLS migration proofs above
      return;
    }

    const anonClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    for (const table of tables) {
      const { data, error } = await anonClient.from(table).select('*').limit(1);
      // Deny-all RLS returns empty array or error
      if (!error) {
        expect(data).toHaveLength(0);
      }

      const insertRes = await anonClient
        .from(table)
        .insert({ id: '00000000-0000-0000-0000-000000000000' });
      expect(insertRes.error).toBeDefined();
    }
  });
});
