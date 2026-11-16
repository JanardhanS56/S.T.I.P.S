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

  describe('POLL-05: Closed and Foreign Polls', () => {
    const pollAId = '00000000-0000-0000-0004-000000000001';
    const optA1Id = '00000000-0000-0000-0005-000000000001';
    const pollBId = '00000000-0000-0000-0004-000000000002';
    const optB1Id = '00000000-0000-0000-0005-000000000003';

    it('POLL-05: rejects vote on expired poll with 409', async () => {
      const cookie = await loginAs('student_a1');
      // Set closes_at to past
      const target = mockDb.polls.find((p) => p.id === pollAId);
      target.closes_at = new Date(Date.now() - 60000).toISOString();

      const res = await request(app)
        .post(`/api/polls/${pollAId}/vote`)
        .set('Cookie', cookie)
        .send({ optionId: optA1Id });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('This poll has closed');
    });

    it('POLL-05: early close by author or admin succeeds, then blocks voting with 409', async () => {
      const teacherCookie = await loginAs('teacher_a1'); // Author
      const studentCookie = await loginAs('student_a1');

      // Unauthorized student close attempt fails with 403
      const unauthClose = await request(app)
        .post(`/api/polls/${pollAId}/close`)
        .set('Cookie', studentCookie)
        .send({});
      expect(unauthClose.status).toBe(403);

      // Author closes poll early
      const closeRes = await request(app)
        .post(`/api/polls/${pollAId}/close`)
        .set('Cookie', teacherCookie)
        .send({});
      expect(closeRes.status).toBe(200);
      expect(closeRes.body.ok).toBe(true);

      // Subsequent vote attempt returns 409
      const voteRes = await request(app)
        .post(`/api/polls/${pollAId}/vote`)
        .set('Cookie', studentCookie)
        .send({ optionId: optA1Id });
      expect(voteRes.status).toBe(409);
      expect(voteRes.body.error).toContain('This poll has closed');
    });

    it('POLL-05: rejects option belonging to a different poll with 400', async () => {
      const cookie = await loginAs('student_a1');

      // Option optB1Id belongs to pollB, but attempting to vote on pollA
      const res = await request(app)
        .post(`/api/polls/${pollAId}/vote`)
        .set('Cookie', cookie)
        .send({ optionId: optB1Id });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid option');
    });

    it('POLL-05: rejects vote on foreign community poll with 404', async () => {
      const cookie = await loginAs('student_a1'); // In Community A

      // pollBId is in Community B
      const res = await request(app)
        .post(`/api/polls/${pollBId}/vote`)
        .set('Cookie', cookie)
        .send({ optionId: optB1Id });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });
  });

  describe('POLL-06 & POLL-07: Results Visibility and Anonymity Guarantee', () => {
    const pollId = '00000000-0000-0000-0004-000000000001';
    const opt1Id = '00000000-0000-0000-0005-000000000001';

    it('POLL-06: hides results before voting and exposes them after voting, after close, or to admin', async () => {
      const student1Cookie = await loginAs('student_a1');
      const student2Cookie = await loginAs('student_a2');
      const adminCookie = await loginAs('admin_a');

      // 1. Student 1 has not voted yet on open poll -> counts/total must be null
      const resBefore = await request(app).get('/api/polls').set('Cookie', student1Cookie);
      const pollBefore = resBefore.body.polls.find((p) => p.id === pollId);
      expect(pollBefore.myVote).toBeNull();
      expect(pollBefore.total).toBeNull();
      expect(pollBefore.options[0].count).toBeNull();
      expect(pollBefore.options[0].percent).toBeNull();

      // 2. Admin can see results even before voting
      const resAdmin = await request(app).get('/api/polls').set('Cookie', adminCookie);
      const pollAdmin = resAdmin.body.polls.find((p) => p.id === pollId);
      expect(pollAdmin.total).toBe(0);
      expect(pollAdmin.options[0].count).toBe(0);
      expect(pollAdmin.options[0].percent).toBe(0);

      // 3. Student 1 votes -> now Student 1 sees results
      await request(app)
        .post(`/api/polls/${pollId}/vote`)
        .set('Cookie', student1Cookie)
        .send({ optionId: opt1Id });

      const resAfterVote = await request(app).get('/api/polls').set('Cookie', student1Cookie);
      const pollAfterVote = resAfterVote.body.polls.find((p) => p.id === pollId);
      expect(pollAfterVote.myVote).toBe(opt1Id);
      expect(pollAfterVote.total).toBe(1);
      expect(pollAfterVote.options[0].count).toBe(1);
      expect(pollAfterVote.options[0].percent).toBe(100);

      // 4. Student 2 has still not voted -> results still hidden for Student 2
      const resStudent2 = await request(app).get('/api/polls').set('Cookie', student2Cookie);
      const pollStudent2 = resStudent2.body.polls.find((p) => p.id === pollId);
      expect(pollStudent2.total).toBeNull();
      expect(pollStudent2.options[0].count).toBeNull();

      // 5. Close poll -> Student 2 can now see results without voting
      const pollRecord = mockDb.polls.find((p) => p.id === pollId);
      pollRecord.closes_at = new Date(Date.now() - 1000).toISOString();

      const resClosed = await request(app).get('/api/polls').set('Cookie', student2Cookie);
      const pollClosed = resClosed.body.polls.find((p) => p.id === pollId);
      expect(pollClosed.closed).toBe(true);
      expect(pollClosed.total).toBe(1);
      expect(pollClosed.options[0].count).toBe(1);
    });

    it('POLL-07: voter identities are never present in any response', async () => {
      const studentCookie = await loginAs('student_a1');
      const adminCookie = await loginAs('admin_a');

      // Cast a vote
      await request(app)
        .post(`/api/polls/${pollId}/vote`)
        .set('Cookie', studentCookie)
        .send({ optionId: opt1Id });

      // Check student list response
      const studentRes = await request(app).get('/api/polls').set('Cookie', studentCookie);
      const serializedStudent = JSON.stringify(studentRes.body);
      expect(serializedStudent).not.toContain('voter');
      expect(serializedStudent).not.toContain('user_id');
      expect(serializedStudent).not.toContain('poll_votes');

      // Check admin list response
      const adminRes = await request(app).get('/api/polls').set('Cookie', adminCookie);
      const serializedAdmin = JSON.stringify(adminRes.body);
      expect(serializedAdmin).not.toContain('voter');
      expect(serializedAdmin).not.toContain('user_id');
      expect(serializedAdmin).not.toContain('poll_votes');
    });
  });

  describe('POLL-08 & POLL-09: Hidden Polls and Math Edge Cases', () => {
    const pollId = '00000000-0000-0000-0004-000000000001';
    const opt1Id = '00000000-0000-0000-0005-000000000001';
    const opt2Id = '00000000-0000-0000-0005-000000000002';

    it('POLL-08: hidden poll is excluded from list and rejects voting with 404', async () => {
      const cookie = await loginAs('student_a1');
      const target = mockDb.polls.find((p) => p.id === pollId);
      target.status = 'hidden';

      // Not listed in GET /api/polls
      const listRes = await request(app).get('/api/polls').set('Cookie', cookie);
      expect(listRes.body.polls.some((p) => p.id === pollId)).toBe(false);

      // Voting returns 404
      const voteRes = await request(app)
        .post(`/api/polls/${pollId}/vote`)
        .set('Cookie', cookie)
        .send({ optionId: opt1Id });
      expect(voteRes.status).toBe(404);
      expect(voteRes.body.error).toContain('not found');
    });

    it('POLL-09: zero-vote poll shows 0 without dividing by zero, and non-zero percentages sum accurately', async () => {
      const student1Cookie = await loginAs('student_a1');
      const student2Cookie = await loginAs('student_a2');
      const adminCookie = await loginAs('admin_a');

      // 1. Zero-vote poll viewed by admin -> percent is 0 (not NaN)
      const resZero = await request(app).get('/api/polls').set('Cookie', adminCookie);
      const pollZero = resZero.body.polls.find((p) => p.id === pollId);
      expect(pollZero.total).toBe(0);
      expect(pollZero.options[0].percent).toBe(0);
      expect(pollZero.options[1].percent).toBe(0);
      expect(Number.isNaN(pollZero.options[0].percent)).toBe(false);

      // 2. Two votes cast: 1 for opt1, 1 for opt2 -> 50% and 50%
      await request(app)
        .post(`/api/polls/${pollId}/vote`)
        .set('Cookie', student1Cookie)
        .send({ optionId: opt1Id });

      await request(app)
        .post(`/api/polls/${pollId}/vote`)
        .set('Cookie', student2Cookie)
        .send({ optionId: opt2Id });

      const resVoted = await request(app).get('/api/polls').set('Cookie', student1Cookie);
      const pollVoted = resVoted.body.polls.find((p) => p.id === pollId);
      expect(pollVoted.total).toBe(2);
      expect(pollVoted.options[0].count).toBe(1);
      expect(pollVoted.options[0].percent).toBe(50);
      expect(pollVoted.options[1].count).toBe(1);
      expect(pollVoted.options[1].percent).toBe(50);
      expect(pollVoted.options[0].percent + pollVoted.options[1].percent).toBe(100);
    });
  });
});
