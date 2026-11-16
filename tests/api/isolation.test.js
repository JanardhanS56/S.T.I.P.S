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

describe('Authorization and Community Isolation (ISO-01..ISO-09)', () => {
  beforeEach(() => {
    mockDb = createMockDb();
  });

  describe('ISO-01 & ISO-02: Admin route access by role', () => {
    const adminRoutes = [
      { method: 'get', path: '/api/admin/community', body: undefined },
      { method: 'get', path: '/api/admin/reports', body: undefined },
      {
        method: 'post',
        path: '/api/admin/members',
        body: { members: [{ name: 'Test Student', role: 'student' }] }
      },
      {
        method: 'post',
        path: '/api/admin/reports/00000000-0000-0000-0007-000000000001/resolve',
        body: { action: 'dismiss' }
      },
      {
        method: 'post',
        path: '/api/admin/users/00000000-0000-0000-0001-000000000004/status',
        body: { status: 'muted' }
      },
      {
        method: 'post',
        path: '/api/admin/users/00000000-0000-0000-0001-000000000004/reset-password',
        body: {}
      }
    ];

    it('ISO-01: student calling any /api/admin/* endpoint receives 403', async () => {
      const studentCookie = await loginAs('student_a1');
      for (const endpoint of adminRoutes) {
        const req = request(app)[endpoint.method](endpoint.path).set('Cookie', studentCookie);
        const res = endpoint.body ? await req.send(endpoint.body) : await req;
        expect(
          res.status,
          `Expected 403 for student on ${endpoint.method.toUpperCase()} ${endpoint.path}`
        ).toBe(403);
        expect(res.body.error).toBe('Office accounts only.');
      }
    });

    it('ISO-02: teacher calling any /api/admin/* endpoint receives 403', async () => {
      const teacherCookie = await loginAs('teacher_a1');
      for (const endpoint of adminRoutes) {
        const req = request(app)[endpoint.method](endpoint.path).set('Cookie', teacherCookie);
        const res = endpoint.body ? await req.send(endpoint.body) : await req;
        expect(
          res.status,
          `Expected 403 for teacher on ${endpoint.method.toUpperCase()} ${endpoint.path}`
        ).toBe(403);
        expect(res.body.error).toBe('Office accounts only.');
      }
    });
  });

  describe('ISO-03: Cross-community list reads are isolated', () => {
    it('community A user cannot read community B posts, and vice versa', async () => {
      const cookieA = await loginAs('student_a1');
      const resA = await request(app).get('/api/posts').set('Cookie', cookieA);
      expect(resA.status).toBe(200);
      expect(resA.body.posts.length).toBeGreaterThan(0);
      const postIdsA = resA.body.posts.map((p) => p.id);
      expect(postIdsA).toContain('00000000-0000-0000-0003-000000000001');
      expect(postIdsA).not.toContain('00000000-0000-0000-0003-000000000002');

      const cookieB = await loginAs('student_b1');
      const resB = await request(app).get('/api/posts').set('Cookie', cookieB);
      expect(resB.status).toBe(200);
      const postIdsB = resB.body.posts.map((p) => p.id);
      expect(postIdsB).toContain('00000000-0000-0000-0003-000000000002');
      expect(postIdsB).not.toContain('00000000-0000-0000-0003-000000000001');
    });

    it('community A user cannot read community B polls, and vice versa', async () => {
      const cookieA = await loginAs('student_a1');
      const resA = await request(app).get('/api/polls').set('Cookie', cookieA);
      expect(resA.status).toBe(200);
      const pollIdsA = resA.body.polls.map((p) => p.id);
      expect(pollIdsA).toContain('00000000-0000-0000-0004-000000000001');
      expect(pollIdsA).not.toContain('00000000-0000-0000-0004-000000000002');

      const cookieB = await loginAs('student_b1');
      const resB = await request(app).get('/api/polls').set('Cookie', cookieB);
      expect(resB.status).toBe(200);
      const pollIdsB = resB.body.polls.map((p) => p.id);
      expect(pollIdsB).toContain('00000000-0000-0000-0004-000000000002');
      expect(pollIdsB).not.toContain('00000000-0000-0000-0004-000000000001');
    });

    it('community A user cannot read community B message threads or members', async () => {
      const cookieA = await loginAs('student_a1');
      const threadsRes = await request(app).get('/api/messages/threads').set('Cookie', cookieA);
      expect(threadsRes.status).toBe(200);
      for (const thread of threadsRes.body.threads) {
        expect(thread.with.username).not.toContain('_b');
      }

      const peopleRes = await request(app).get('/api/messages/people').set('Cookie', cookieA);
      expect(peopleRes.status).toBe(200);
      for (const person of peopleRes.body.people) {
        expect(person.username).not.toContain('_b');
      }
    });
  });

  describe('ISO-04 & ISO-05: Foreign object IDs return 404', () => {
    const foreignPostId = '00000000-0000-0000-0003-000000000002';
    const foreignPollId = '00000000-0000-0000-0004-000000000002';
    const foreignUserId = '00000000-0000-0000-0002-000000000003';
    const foreignMessageId = '00000000-0000-0000-0006-000000000002';
    const foreignReportId = '00000000-0000-0000-0007-000000000002';

    it('deleting a foreign post returns 404 (not 403)', async () => {
      const cookieA = await loginAs('student_a1');
      const res = await request(app)
        .delete(`/api/posts/${foreignPostId}`)
        .set('Cookie', cookieA)
        .send({});
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Post not found.');
    });

    it('voting in a foreign poll returns 404', async () => {
      const cookieA = await loginAs('student_a1');
      const res = await request(app)
        .post(`/api/polls/${foreignPollId}/vote`)
        .set('Cookie', cookieA)
        .send({ optionId: '00000000-0000-0000-0005-000000000003' });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Poll not found.');
    });

    it('messaging a user in a foreign community returns 404', async () => {
      const cookieA = await loginAs('teacher_a1');
      const res = await request(app)
        .post('/api/messages')
        .set('Cookie', cookieA)
        .send({ toUserId: foreignUserId, body: 'Hello foreign user' });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Person not found.');
    });

    it('fetching message thread with a foreign user returns 404', async () => {
      const cookieA = await loginAs('student_a1');
      const res = await request(app)
        .get(`/api/messages/with/${foreignUserId}`)
        .set('Cookie', cookieA);
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Person not found.');
    });

    it('reporting a foreign post, poll, or message returns 404', async () => {
      const cookieA = await loginAs('student_a1');

      const repPost = await request(app)
        .post('/api/reports')
        .set('Cookie', cookieA)
        .send({ targetType: 'post', targetId: foreignPostId, reason: 'Foreign post spam' });
      expect(repPost.status).toBe(404);
      expect(repPost.body.error).toBe('Target not found.');

      const repPoll = await request(app)
        .post('/api/reports')
        .set('Cookie', cookieA)
        .send({ targetType: 'poll', targetId: foreignPollId, reason: 'Foreign poll spam' });
      expect(repPoll.status).toBe(404);
      expect(repPoll.body.error).toBe('Target not found.');

      const repMsg = await request(app).post('/api/reports').set('Cookie', cookieA).send({
        targetType: 'message',
        targetId: foreignMessageId,
        reason: 'Foreign message spam'
      });
      expect(repMsg.status).toBe(404);
      expect(repMsg.body.error).toBe('Target not found.');
    });

    it('admin resolving a foreign report returns 404', async () => {
      const adminCookieA = await loginAs('admin_a');
      const res = await request(app)
        .post(`/api/admin/reports/${foreignReportId}/resolve`)
        .set('Cookie', adminCookieA)
        .send({ action: 'dismiss' });
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Report not found.');
    });
  });

  describe('ISO-06: Client-supplied IDs in request body are ignored', () => {
    it('ignores client-supplied community_id and author_id on POST /api/posts', async () => {
      const cookieA = await loginAs('student_a1');
      const forgedCommunity = '00000000-0000-0000-0000-000000000002';
      const forgedAuthor = '00000000-0000-0000-0002-000000000002';

      const res = await request(app).post('/api/posts').set('Cookie', cookieA).send({
        body: 'Testing client supplied ids ignored',
        category: 'Notice',
        community_id: forgedCommunity,
        author_id: forgedAuthor
      });

      expect(res.status).toBe(201);
      const postId = res.body.id;
      const createdPost = mockDb.posts.find((p) => p.id === postId);
      expect(createdPost.community_id).toBe('00000000-0000-0000-0000-000000000001');
      expect(createdPost.author_id).toBe('00000000-0000-0000-0001-000000000004');
    });

    it('ignores client-supplied community_id and author_id on POST /api/polls', async () => {
      const cookieA = await loginAs('student_a1');
      const forgedCommunity = '00000000-0000-0000-0000-000000000002';
      const forgedAuthor = '00000000-0000-0000-0002-000000000002';

      const res = await request(app)
        .post('/api/polls')
        .set('Cookie', cookieA)
        .send({
          question: 'Are client ids ignored?',
          options: ['Yes indeed', 'Absolutely'],
          days: 3,
          community_id: forgedCommunity,
          author_id: forgedAuthor
        });

      expect(res.status).toBe(201);
      const pollId = res.body.id;
      const createdPoll = mockDb.polls.find((p) => p.id === pollId);
      expect(createdPoll.community_id).toBe('00000000-0000-0000-0000-000000000001');
      expect(createdPoll.author_id).toBe('00000000-0000-0000-0001-000000000004');
    });

    it('ignores client-supplied community_id and sender_id on POST /api/messages', async () => {
      const cookieA = await loginAs('teacher_a1');
      const targetUser = '00000000-0000-0000-0001-000000000004';
      const forgedCommunity = '00000000-0000-0000-0000-000000000002';
      const forgedSender = '00000000-0000-0000-0002-000000000002';

      const res = await request(app).post('/api/messages').set('Cookie', cookieA).send({
        toUserId: targetUser,
        body: 'Hello message with forged body fields',
        community_id: forgedCommunity,
        sender_id: forgedSender
      });

      expect(res.status).toBe(201);
      const createdMsg = mockDb.messages[mockDb.messages.length - 1];
      expect(createdMsg.community_id).toBe('00000000-0000-0000-0000-000000000001');
      expect(createdMsg.sender_id).toBe('00000000-0000-0000-0001-000000000002');
    });
  });
});
