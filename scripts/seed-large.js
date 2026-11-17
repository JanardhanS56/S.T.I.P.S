import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { db } from '../server/db.js';
import { env } from '../server/env.js';
import { guardAgainstProduction } from '../tests/helpers/prodGuard.js';

export async function runLargeSeed(options = {}) {
  guardAgainstProduction(env.SUPABASE_URL, env.NODE_ENV);

  const postsTarget = options.posts || Number(process.env.SEED_POSTS || 1000);
  const pollsTarget = options.polls || Number(process.env.SEED_POLLS || 100);
  const messagesTarget = options.messages || Number(process.env.SEED_MESSAGES || 2500);

  console.log(`Starting large performance seed:`);
  console.log(`• Posts:    ${postsTarget}`);
  console.log(`• Polls:    ${pollsTarget}`);
  console.log(`• Messages: ${messagesTarget}`);

  // Community A ID and Authors
  const communityId = '00000000-0000-0000-0000-000000000001';
  const authorIds = [
    '00000000-0000-0000-0001-000000000001', // admin_a
    '00000000-0000-0000-0001-000000000002', // teacher_a1
    '00000000-0000-0000-0001-000000000003', // teacher_a2
    '00000000-0000-0000-0001-000000000004', // student_a1
    '00000000-0000-0000-0001-000000000005' // student_a2
  ];
  const categories = ['Notice', 'Event', 'Meme', 'Moment'];

  // 1. Seed Posts in batches of 200
  console.log('Seeding posts...');
  const batchSize = 200;
  const now = Date.now();
  const createdPostIds = [];

  for (let i = 0; i < postsTarget; i += batchSize) {
    const batch = [];
    const count = Math.min(batchSize, postsTarget - i);
    for (let j = 0; j < count; j++) {
      const idx = i + j;
      const id = randomUUID();
      createdPostIds.push(id);
      const daysAgo = Math.floor(Math.random() * 30);
      const minutesAgo = Math.floor(Math.random() * 1440);
      const createdAt = new Date(now - (daysAgo * 86400000 + minutesAgo * 60000)).toISOString();
      batch.push({
        id,
        community_id: communityId,
        author_id: authorIds[idx % authorIds.length],
        category: categories[idx % categories.length],
        body: `Performance benchmark simulated post #${idx + 1}. Discussing campus updates and research experiments.`,
        status: 'visible',
        created_at: createdAt
      });
    }
    const { error } = await db.from('posts').insert(batch);
    if (error) throw new Error(`Failed to insert posts batch: ${error.message}`);
    process.stdout.write(`\r  ✓ ${Math.min(i + batchSize, postsTarget)} / ${postsTarget} posts`);
  }
  console.log('');

  // 2. Seed Polls in batches
  console.log('Seeding polls...');
  for (let i = 0; i < pollsTarget; i += 50) {
    const batch = [];
    const count = Math.min(50, pollsTarget - i);
    for (let j = 0; j < count; j++) {
      const idx = i + j;
      const pollId = randomUUID();
      const createdAt = new Date(now - idx * 3600000).toISOString();
      const closesAt = new Date(now + 86400000 * 3).toISOString();
      batch.push({
        id: pollId,
        community_id: communityId,
        author_id: authorIds[idx % authorIds.length],
        question: `Performance poll question #${idx + 1}: Preferred study schedule?`,
        closes_at: closesAt,
        status: 'visible',
        created_at: createdAt
      });
    }
    const { error } = await db.from('polls').insert(batch);
    if (error) throw new Error(`Failed to insert polls batch: ${error.message}`);
    process.stdout.write(`\r  ✓ ${Math.min(i + 50, pollsTarget)} / ${pollsTarget} polls`);
  }
  console.log('');

  // 3. Seed Messages in batches of 250
  console.log('Seeding messages...');
  for (let i = 0; i < messagesTarget; i += 250) {
    const batch = [];
    const count = Math.min(250, messagesTarget - i);
    for (let j = 0; j < count; j++) {
      const idx = i + j;
      const sender = authorIds[idx % 2 === 0 ? 1 : 3]; // teacher_a1 or student_a1
      const recipient = authorIds[idx % 2 === 0 ? 3 : 1];
      const createdAt = new Date(now - (messagesTarget - idx) * 30000).toISOString();
      const isRead = idx < messagesTarget - 10;
      batch.push({
        id: randomUUID(),
        community_id: communityId,
        sender_id: sender,
        recipient_id: recipient,
        body: `Bench message #${idx + 1}: Following up on the assignment feedback.`,
        created_at: createdAt,
        read_at: isRead ? createdAt : null
      });
    }
    const { error } = await db.from('messages').insert(batch);
    if (error) throw new Error(`Failed to insert messages batch: ${error.message}`);
    process.stdout.write(`\r  ✓ ${Math.min(i + 250, messagesTarget)} / ${messagesTarget} messages`);
  }
  console.log('\nLarge seed completed successfully.');
}

const isDirectRun =
  process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  runLargeSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
