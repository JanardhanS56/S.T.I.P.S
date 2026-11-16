import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createMockDb } from '../helpers/mockDb.js';

let mockDb;
vi.mock('../../server/db.js', () => ({
  db: {
    from: (table) => mockDb.from(table)
  }
}));

const { default: app } = await import('../../server/app.js');

function extractCookie(res) {
  const cookies = res.headers['set-cookie'];
  if (!cookies) return null;
  const list = Array.isArray(cookies) ? cookies : [cookies];
  for (const c of list) {
    if (c.startsWith('stips_session=')) {
      return c.split(';')[0];
    }
  }
  return null;
}

async function loginAs(username, password = 'TestPassword123!') {
  const res = await request(app).post('/api/auth/login').send({ username, password });
  if (res.status !== 200) {
    throw new Error(
      `Login failed for ${username} with status ${res.status}: ${JSON.stringify(res.body)}`
    );
  }
  return extractCookie(res);
}

describe('Polls API (POLL-01..POLL-09)', () => {
  beforeEach(() => {
    mockDb = createMockDb();
  });

  describe('POLL-01..POLL-03: Creation, Validation, and Rate Limits', () => {
    it('POLL-01: creates poll with 2 to 6 options and 1 to 7 days', async () => {
      const cookie = await loginAs('teacher_a1');
      const res = await request(app)
        .post('/api/polls')
        .set('Cookie', cookie)
        .send({
          question: 'Which chapter should we review next week?',
          options: ['Chapter 1: Limits', 'Chapter 2: Derivatives', 'Chapter 3: Integrals'],
          days: 3
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();

      const listRes = await request(app).get('/api/polls').set('Cookie', cookie);
      expect(listRes.status).toBe(200);
      const created = listRes.body.polls.find((p) => p.id === res.body.id);
      expect(created).toBeDefined();
      expect(created.question).toBe('Which chapter should we review next week?');
      expect(created.options).toHaveLength(3);
      expect(created.closed).toBe(false);
    });

    it('POLL-02: rejects 1 option, 7 options, 0 days, 8 days, and short questions with 400', async () => {
      const cookie = await loginAs('teacher_a1');

      // 1 option (minimum is 2)
      const oneOpt = await request(app)
        .post('/api/polls')
        .set('Cookie', cookie)
        .send({
          question: 'Valid question here?',
          options: ['Just one option'],
          days: 3
        });
      expect(oneOpt.status).toBe(400);

      // 7 options (maximum is 6)
      const sevenOpts = await request(app)
        .post('/api/polls')
        .set('Cookie', cookie)
        .send({
          question: 'Valid question here?',
          options: ['Opt 1', 'Opt 2', 'Opt 3', 'Opt 4', 'Opt 5', 'Opt 6', 'Opt 7'],
          days: 3
        });
      expect(sevenOpts.status).toBe(400);

      // 0 days (minimum is 1)
      const zeroDays = await request(app)
        .post('/api/polls')
        .set('Cookie', cookie)
        .send({
          question: 'Valid question here?',
          options: ['Option 1', 'Option 2'],
          days: 0
        });
      expect(zeroDays.status).toBe(400);

      // 8 days (maximum is 7)
      const eightDays = await request(app)
        .post('/api/polls')
        .set('Cookie', cookie)
        .send({
          question: 'Valid question here?',
          options: ['Option 1', 'Option 2'],
          days: 8
        });
      expect(eightDays.status).toBe(400);

      // short question (< 5 chars)
      const shortQ = await request(app)
        .post('/api/polls')
        .set('Cookie', cookie)
        .send({
          question: 'Hey?',
          options: ['Option 1', 'Option 2'],
          days: 3
        });
      expect(shortQ.status).toBe(400);
    });

    it('POLL-03: 6th poll in 24h by same user returns 429', async () => {
      const cookie = await loginAs('teacher_a1');
      const teacherId = '00000000-0000-0000-0001-000000000002';

      // Seed 5 polls created within the last 24 hours by teacher_a1
      const recentPolls = Array.from({ length: 5 }, (_, i) => ({
        id: `00000000-0000-0000-0004-00000000001${i}`,
        community_id: '00000000-0000-0000-0000-000000000001',
        author_id: teacherId,
        question: `Historical poll ${i + 1} for testing limit?`,
        status: 'visible',
        closes_at: new Date(Date.now() + 86400000).toISOString(),
        created_at: new Date(Date.now() - (i + 1) * 3600000).toISOString()
      }));

      mockDb.polls.splice(0, mockDb.polls.length, ...recentPolls);

      // 6th attempt should be blocked with 429
      const sixth = await request(app)
        .post('/api/polls')
        .set('Cookie', cookie)
        .send({
          question: 'Should this sixth poll be blocked?',
          options: ['Yes', 'No'],
          days: 2
        });

      expect(sixth.status).toBe(429);
      expect(sixth.body.error).toContain('You can start 5 polls a day');
    });
  });

  describe('POLL-04: Single Vote and Concurrency', () => {
    const pollId = '00000000-0000-0000-0004-000000000001';
    const optId1 = '00000000-0000-0000-0005-000000000001';
    const optId2 = '00000000-0000-0000-0005-000000000002';
    const student1Id = '00000000-0000-0000-0001-000000000004';

    it('POLL-04: vote succeeds once and second vote returns 409', async () => {
      const cookie = await loginAs('student_a1');

      // First vote
      const vote1 = await request(app)
        .post(`/api/polls/${pollId}/vote`)
        .set('Cookie', cookie)
        .send({ optionId: optId1 });

      expect(vote1.status).toBe(201);
      expect(vote1.body).toEqual({ ok: true });

      // Second vote attempt
      const vote2 = await request(app)
        .post(`/api/polls/${pollId}/vote`)
        .set('Cookie', cookie)
        .send({ optionId: optId2 });

      expect(vote2.status).toBe(409);
      expect(vote2.body.error).toContain('You already voted in this poll');
    });

    it('POLL-04: concurrent double-submit yields exactly one vote in database', async () => {
      const cookie = await loginAs('student_a1');

      // Fire parallel requests
      const [res1, res2] = await Promise.all([
        request(app)
          .post(`/api/polls/${pollId}/vote`)
          .set('Cookie', cookie)
          .send({ optionId: optId1 }),
        request(app)
          .post(`/api/polls/${pollId}/vote`)
          .set('Cookie', cookie)
          .send({ optionId: optId2 })
      ]);

      const statuses = [res1.status, res2.status].sort();
      expect(statuses).toEqual([201, 409]);

      // Exactly one vote record in database for this user
      const userVotes = mockDb.poll_votes.filter(
        (v) => v.poll_id === pollId && v.user_id === student1Id
      );
      expect(userVotes).toHaveLength(1);
    });
  });
});
