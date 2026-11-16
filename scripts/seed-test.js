import bcrypt from 'bcryptjs';
import { db } from '../server/db.js';
import { env } from '../server/env.js';

// Production safety guard (Invariant: Never seed production with test users)
function guardAgainstProduction() {
  if (env.NODE_ENV === 'production') {
    throw new Error('FATAL: seed-test.js cannot run in production mode (NODE_ENV=production).');
  }

  const prodKeywords = ['production', 'prod-'];
  const urlLower = env.SUPABASE_URL.toLowerCase();
  for (const kw of prodKeywords) {
    if (urlLower.includes(kw)) {
      throw new Error(
        `FATAL: SUPABASE_URL (${env.SUPABASE_URL}) appears to be a production database.`
      );
    }
  }

  // Refuse if explicit PROD_SUPABASE_URL environment variable matches current SUPABASE_URL
  if (process.env.PROD_SUPABASE_URL && process.env.PROD_SUPABASE_URL === env.SUPABASE_URL) {
    throw new Error('FATAL: SUPABASE_URL matches PROD_SUPABASE_URL. Seeding aborted.');
  }
}

export async function runSeed() {
  guardAgainstProduction();

  const testPassword = 'TestPassword123!';
  const passwordHash = await bcrypt.hash(testPassword, 10);

  // 1. Communities
  const communities = [
    { id: '00000000-0000-0000-0000-000000000001', name: 'Alpha Institute', code: 'ALPH-0001' },
    { id: '00000000-0000-0000-0000-000000000002', name: 'Beta College', code: 'BETA-0002' }
  ];

  for (const c of communities) {
    const { error } = await db.from('communities').upsert(c, { onConflict: 'id' });
    if (error) throw new Error(`Failed to seed community ${c.name}: ${error.message}`);
  }

  // 2. Users (Admin, 2 Teachers, 4 Students per community)
  const users = [
    // Community A
    {
      id: '00000000-0000-0000-0001-000000000001',
      community_id: communities[0].id,
      username: 'admin_a',
      display_name: 'Principal Alpha',
      role: 'admin',
      password_hash: passwordHash,
      must_change_password: false,
      token_version: 0
    },
    {
      id: '00000000-0000-0000-0001-000000000002',
      community_id: communities[0].id,
      username: 'teacher_a1',
      display_name: 'Prof. Alice A',
      role: 'teacher',
      password_hash: passwordHash,
      must_change_password: false,
      token_version: 0
    },
    {
      id: '00000000-0000-0000-0001-000000000003',
      community_id: communities[0].id,
      username: 'teacher_a2',
      display_name: 'Prof. Alan A',
      role: 'teacher',
      password_hash: passwordHash,
      must_change_password: false,
      token_version: 0
    },
    {
      id: '00000000-0000-0000-0001-000000000004',
      community_id: communities[0].id,
      username: 'student_a1',
      display_name: 'Student A One',
      role: 'student',
      password_hash: passwordHash,
      must_change_password: false,
      token_version: 0
    },
    {
      id: '00000000-0000-0000-0001-000000000005',
      community_id: communities[0].id,
      username: 'student_a2',
      display_name: 'Student A Two',
      role: 'student',
      password_hash: passwordHash,
      must_change_password: false,
      token_version: 0
    },
    {
      id: '00000000-0000-0000-0001-000000000006',
      community_id: communities[0].id,
      username: 'student_a3',
      display_name: 'Student A Three',
      role: 'student',
      password_hash: passwordHash,
      must_change_password: false,
      token_version: 0
    },
    {
      id: '00000000-0000-0000-0001-000000000007',
      community_id: communities[0].id,
      username: 'student_a4',
      display_name: 'Student A Four',
      role: 'student',
      password_hash: passwordHash,
      must_change_password: false,
      token_version: 0
    },
    // Community B
    {
      id: '00000000-0000-0000-0002-000000000001',
      community_id: communities[1].id,
      username: 'admin_b',
      display_name: 'Principal Beta',
      role: 'admin',
      password_hash: passwordHash,
      must_change_password: false,
      token_version: 0
    },
    {
      id: '00000000-0000-0000-0002-000000000002',
      community_id: communities[1].id,
      username: 'teacher_b1',
      display_name: 'Prof. Bob B',
      role: 'teacher',
      password_hash: passwordHash,
      must_change_password: false,
      token_version: 0
    },
    {
      id: '00000000-0000-0000-0002-000000000003',
      community_id: communities[1].id,
      username: 'teacher_b2',
      display_name: 'Prof. Beth B',
      role: 'teacher',
      password_hash: passwordHash,
      must_change_password: false,
      token_version: 0
    },
    {
      id: '00000000-0000-0000-0002-000000000004',
      community_id: communities[1].id,
      username: 'student_b1',
      display_name: 'Student B One',
      role: 'student',
      password_hash: passwordHash,
      must_change_password: false,
      token_version: 0
    },
    {
      id: '00000000-0000-0000-0002-000000000005',
      community_id: communities[1].id,
      username: 'student_b2',
      display_name: 'Student B Two',
      role: 'student',
      password_hash: passwordHash,
      must_change_password: false,
      token_version: 0
    },
    {
      id: '00000000-0000-0000-0002-000000000006',
      community_id: communities[1].id,
      username: 'student_b3',
      display_name: 'Student B Three',
      role: 'student',
      password_hash: passwordHash,
      must_change_password: false,
      token_version: 0
    },
    {
      id: '00000000-0000-0000-0002-000000000007',
      community_id: communities[1].id,
      username: 'student_b4',
      display_name: 'Student B Four',
      role: 'student',
      password_hash: passwordHash,
      must_change_password: false,
      token_version: 0
    }
  ];

  for (const u of users) {
    const { error } = await db.from('users').upsert(u, { onConflict: 'id' });
    if (error) throw new Error(`Failed to seed user ${u.username}: ${error.message}`);
  }

  // 3. Sample Posts
  const posts = [
    {
      id: '00000000-0000-0000-0003-000000000001',
      community_id: communities[0].id,
      author_id: users[1].id,
      category: 'Notice',
      body: 'Welcome to the semester at Alpha Institute!'
    },
    {
      id: '00000000-0000-0000-0003-000000000002',
      community_id: communities[1].id,
      author_id: users[8].id,
      category: 'Notice',
      body: 'Welcome to Beta College community.'
    }
  ];

  for (const p of posts) {
    const { error } = await db.from('posts').upsert(p, { onConflict: 'id' });
    if (error) throw new Error(`Failed to seed post: ${error.message}`);
  }

  // 4. Sample Poll
  const poll = {
    id: '00000000-0000-0004-0000-000000000001',
    community_id: communities[0].id,
    author_id: users[1].id,
    question: 'Preferred time for office hours?',
    closes_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
  };
  const { error: pollErr } = await db.from('polls').upsert(poll, { onConflict: 'id' });
  if (pollErr) throw new Error(`Failed to seed poll: ${pollErr.message}`);

  const options = [
    { id: '00000000-0000-0005-0000-000000000001', poll_id: poll.id, label: 'Morning (10:00 AM)' },
    { id: '00000000-0000-0005-0000-000000000002', poll_id: poll.id, label: 'Afternoon (2:00 PM)' },
    { id: '00000000-0000-0005-0000-000000000003', poll_id: poll.id, label: 'Evening (4:00 PM)' }
  ];
  for (const opt of options) {
    const { error } = await db.from('poll_options').upsert(opt, { onConflict: 'id' });
    if (error) throw new Error(`Failed to seed poll option: ${error.message}`);
  }

  return { communitiesCount: communities.length, usersCount: users.length };
}

// Run directly from CLI: node --env-file=.env scripts/seed-test.js
if (
  import.meta.url.startsWith('file:') &&
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))
) {
  runSeed()
    .then((res) => {
      console.log(
        `Seed completed successfully: ${res.communitiesCount} communities, ${res.usersCount} users.`
      );
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed:', err.message);
      process.exit(1);
    });
}
