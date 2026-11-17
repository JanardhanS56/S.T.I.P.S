import pg from 'pg';
import process from 'node:process';

export async function runQueryBenchmark() {
  const connectionString = process.env.SUPABASE_CONNECTION_STRING || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('SUPABASE_CONNECTION_STRING or DATABASE_URL is not set.');
  }

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const queries = [
    {
      name: 'Feed Posts Query (with pinned_at and status)',
      sql: `EXPLAIN (ANALYZE, BUFFERS)
        SELECT id, category, body, created_at, pinned_at, is_official
        FROM posts
        WHERE community_id = '00000000-0000-0000-0000-000000000001'
          AND status = 'visible'
        ORDER BY pinned_at DESC NULLS LAST, created_at DESC
        LIMIT 50;`
    },
    {
      name: 'Category Filtered Feed Query',
      sql: `EXPLAIN (ANALYZE, BUFFERS)
        SELECT id, category, body, created_at, pinned_at, is_official
        FROM posts
        WHERE community_id = '00000000-0000-0000-0000-000000000001'
          AND category = 'Notice'
          AND status = 'visible'
        ORDER BY pinned_at DESC NULLS LAST, created_at DESC
        LIMIT 50;`
    },
    {
      name: 'Unread Messages Query (Partial Index)',
      sql: `EXPLAIN (ANALYZE, BUFFERS)
        SELECT id, sender_id, read_at
        FROM messages
        WHERE recipient_id = '00000000-0000-0000-0001-000000000004'
          AND read_at IS NULL;`
    },
    {
      name: 'Direct Messaging Thread Retrieval',
      sql: `EXPLAIN (ANALYZE, BUFFERS)
        SELECT id, body, created_at, sender_id
        FROM messages
        WHERE community_id = '00000000-0000-0000-0000-000000000001'
          AND ((sender_id = '00000000-0000-0000-0001-000000000002' AND recipient_id = '00000000-0000-0000-0001-000000000004')
            OR (sender_id = '00000000-0000-0000-0001-000000000004' AND recipient_id = '00000000-0000-0000-0001-000000000002'))
        ORDER BY created_at ASC
        LIMIT 200;`
    },
    {
      name: 'Admin Reports Queue Query',
      sql: `EXPLAIN (ANALYZE, BUFFERS)
        SELECT id, reason, status, created_at
        FROM reports
        WHERE community_id = '00000000-0000-0000-0000-000000000001'
          AND status = 'open'
        ORDER BY created_at DESC;`
    }
  ];

  const results = [];
  for (const q of queries) {
    const res = await client.query(q.sql);
    const plan = res.rows.map((r) => r['QUERY PLAN']).join('\n');
    results.push({ name: q.name, plan });
    console.log(`=== ${q.name} ===`);
    console.log(plan);
    console.log('');
  }

  await client.end();
  return results;
}

runQueryBenchmark()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
