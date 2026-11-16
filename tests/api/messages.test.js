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

describe('Messages API (MSG-01..MSG-10)', () => {
  const teacherA1Id = '00000000-0000-0000-0001-000000000002';
  const studentA1Id = '00000000-0000-0000-0001-000000000004';
  const studentA2Id = '00000000-0000-0000-0001-000000000008';
  const adminAId = '00000000-0000-0000-0001-000000000001';

  beforeEach(() => {
    mockDb = createMockDb();
  });

  describe('MSG-01 & MSG-02: Role Rules for Direct Messaging', () => {
    it('MSG-01: teacher to student and student to teacher/admin succeed', async () => {
      const teacherCookie = await loginAs('teacher_a1');
      const studentCookie = await loginAs('student_a1');

      // 1. Teacher to student
      const t2s = await request(app)
        .post('/api/messages')
        .set('Cookie', teacherCookie)
        .send({ toUserId: studentA1Id, body: 'Hello Student A1, remember the assignment.' });
      expect(t2s.status).toBe(201);
      expect(t2s.body.ok).toBe(true);

      // 2. Student to teacher
      const s2t = await request(app)
        .post('/api/messages')
        .set('Cookie', studentCookie)
        .send({
          toUserId: teacherA1Id,
          body: 'Thank you Professor, I have a question on Chapter 2.'
        });
      expect(s2t.status).toBe(201);
      expect(s2t.body.ok).toBe(true);

      // 3. Student to admin
      const s2a = await request(app)
        .post('/api/messages')
        .set('Cookie', studentCookie)
        .send({ toUserId: adminAId, body: 'Office inquiry regarding library hours.' });
      expect(s2a.status).toBe(201);
      expect(s2a.body.ok).toBe(true);
    });

    it('MSG-02: student to student direct message is rejected with 403', async () => {
      const studentCookie = await loginAs('student_a1');

      const s2s = await request(app)
        .post('/api/messages')
        .set('Cookie', studentCookie)
        .send({ toUserId: studentA2Id, body: 'Hey fellow student, do you have notes?' });

      expect(s2s.status).toBe(403);
      expect(s2s.body.error).toContain('Students can message teachers and the office');
    });
  });
});
