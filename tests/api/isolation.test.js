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
});
