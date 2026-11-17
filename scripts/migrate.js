import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const migrationsDir = path.join(rootDir, 'supabase', 'migrations');

async function run() {
  const connectionString = process.env.SUPABASE_CONNECTION_STRING;
  if (!connectionString) {
    console.error('SUPABASE_CONNECTION_STRING is not set.');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase Postgres database.');

    // Create migrations table if not exists
    await client.query(`
      create table if not exists _schema_migrations (
        version text primary key,
        applied_at timestamptz not null default now()
      );
    `);

    // If communities table exists, baseline was already applied
    const { rows: tableCheck } = await client.query(`
      select 1 from information_schema.tables where table_name = 'communities'
    `);
    if (tableCheck.length > 0) {
      await client.query(`
        insert into _schema_migrations (version) values ('20261116000001_baseline.sql') on conflict do nothing;
        insert into _schema_migrations (version) values ('20261116000002_users_token_version.sql') on conflict do nothing;
      `);
    }

    const { rows: appliedRows } = await client.query('select version from _schema_migrations');
    const applied = new Set(appliedRows.map((r) => r.version));

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`[skip] ${file} (already applied)`);
        continue;
      }

      console.log(`[applying] ${file}…`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('insert into _schema_migrations (version) values ($1)', [file]);
        await client.query('COMMIT');
        console.log(`[ok] ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[error] Failed to apply ${file}:`, err.message);
        process.exit(1);
      }
    }

    // Refresh PostgREST schema cache
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log('PostgREST schema cache reload signal sent.');
    console.log('All migrations applied successfully!');
  } finally {
    await client.end();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
