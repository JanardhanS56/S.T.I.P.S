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
      const s2t = await request(app).post('/api/messages').set('Cookie', studentCookie).send({
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

  describe('MSG-03..MSG-06: Content Screening, Length Limits, and Target Constraints', () => {
    it('MSG-03: rejects phone numbers, emails, and spaced digits with 422', async () => {
      const studentCookie = await loginAs('student_a1');

      // 10-digit phone number
      const phoneRes = await request(app)
        .post('/api/messages')
        .set('Cookie', studentCookie)
        .send({ toUserId: teacherA1Id, body: 'Call me on 9876543210 anytime.' });
      expect(phoneRes.status).toBe(422);
      expect(phoneRes.body.error).toContain('Phone numbers and email addresses');

      // Email address
      const emailRes = await request(app)
        .post('/api/messages')
        .set('Cookie', studentCookie)
        .send({ toUserId: teacherA1Id, body: 'Please write to student@external.com for files.' });
      expect(emailRes.status).toBe(422);
      expect(emailRes.body.error).toContain('Phone numbers and email addresses');

      // Spaced digits
      const spacedRes = await request(app)
        .post('/api/messages')
        .set('Cookie', studentCookie)
        .send({ toUserId: teacherA1Id, body: 'My number is 9 8 7 6 5 4 3 2 1 0.' });
      expect(spacedRes.status).toBe(422);
      expect(spacedRes.body.error).toContain('Phone numbers and email addresses');
    });

    it('MSG-04: rejects body over 500 characters, empty body, or whitespace with 400', async () => {
      const studentCookie = await loginAs('student_a1');

      // 501 characters
      const longBody = 'A'.repeat(501);
      const longRes = await request(app)
        .post('/api/messages')
        .set('Cookie', studentCookie)
        .send({ toUserId: teacherA1Id, body: longBody });
      expect(longRes.status).toBe(400);

      // Empty string
      const emptyRes = await request(app)
        .post('/api/messages')
        .set('Cookie', studentCookie)
        .send({ toUserId: teacherA1Id, body: '' });
      expect(emptyRes.status).toBe(400);

      // Whitespace only
      const wsRes = await request(app)
        .post('/api/messages')
        .set('Cookie', studentCookie)
        .send({ toUserId: teacherA1Id, body: '    ' });
      expect(wsRes.status).toBe(400);
    });

    it('MSG-05: 61st message in an hour returns 429', async () => {
      const studentCookie = await loginAs('student_a1');

      // Seed 60 messages sent within the past hour by studentA1
      const recentMessages = Array.from({ length: 60 }, (_, i) => ({
        id: `00000000-0000-0000-0006-0000000001${String(i).padStart(2, '0')}`,
        community_id: '00000000-0000-0000-0000-000000000001',
        sender_id: studentA1Id,
        recipient_id: teacherA1Id,
        body: `Historical message ${i + 1}`,
        created_at: new Date(Date.now() - (i + 1) * 30000).toISOString()
      }));

      mockDb.messages.splice(0, mockDb.messages.length, ...recentMessages);

      // 61st attempt returns 429
      const res61 = await request(app)
        .post('/api/messages')
        .set('Cookie', studentCookie)
        .send({ toUserId: teacherA1Id, body: 'This should exceed hourly limit.' });

      expect(res61.status).toBe(429);
      expect(res61.body.error).toContain('Message limit reached for this hour');
    });

    it('MSG-06: cannot message self, suspended user, or foreign community user', async () => {
      const teacherCookie = await loginAs('teacher_a1');
      const suspendedUserId = '00000000-0000-0000-0001-000000000006';
      const foreignUserId = '00000000-0000-0000-0002-000000000002'; // Teacher in community B

      // Cannot message self (400)
      const selfRes = await request(app)
        .post('/api/messages')
        .set('Cookie', teacherCookie)
        .send({ toUserId: teacherA1Id, body: 'Note to self.' });
      expect(selfRes.status).toBe(400);
      expect(selfRes.body.error).toContain('Cannot message yourself');

      // Cannot message suspended user (404)
      const suspendedRes = await request(app)
        .post('/api/messages')
        .set('Cookie', teacherCookie)
        .send({ toUserId: suspendedUserId, body: 'Hello suspended student.' });
      expect(suspendedRes.status).toBe(404);
      expect(suspendedRes.body.error).toContain('not found');

      // Cannot message foreign community user (404)
      const foreignRes = await request(app)
        .post('/api/messages')
        .set('Cookie', teacherCookie)
        .send({ toUserId: foreignUserId, body: 'Hello teacher in Beta college.' });
      expect(foreignRes.status).toBe(404);
      expect(foreignRes.body.error).toContain('not found');
    });
  });
});
