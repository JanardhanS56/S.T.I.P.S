import { vi, describe, it, expect, beforeEach } from 'vitest';
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

describe('Privacy and Data Protection API (ADM-08)', () => {
  beforeEach(() => {
    mockDb = createMockDb();
  });

  describe('ADM-08 Export My Data: GET /api/me/export', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/me/export');
      expect(res.status).toBe(401);
    });

    it('returns only the requester personal data, posts, votes, and direct messages', async () => {
      // Login student_a1
      const login = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({ username: 'student_a1', password: 'TestPassword123!' });
      expect(login.status).toBe(200);
      const cookie = extractCookie(login);

      const res = await request(app).get('/api/me/export').set('Cookie', cookie);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/json');
      expect(res.headers['content-disposition']).toContain(
        'attachment; filename="stips-export-student_a1-'
      );

      const data = res.body;
      expect(data.exportMetadata).toBeDefined();
      expect(data.exportMetadata.platform).toBe('S.T.I.P.S');

      // Profile verification
      expect(data.profile.username).toBe('student_a1');
      expect(data.profile.displayName).toBe('Student A One');
      expect(data.profile.password_hash).toBeUndefined();
      expect(data.profile.password).toBeUndefined();

      // Posts verification: all posts must belong to student_a1
      for (const p of data.posts) {
        expect(p.author_id).toBe('00000000-0000-0000-0001-000000000004');
      }

      // Messages verification: messages must only include conversations involving student_a1
      const studentId = '00000000-0000-0000-0001-000000000004';
      for (const m of data.messages.sent) {
        expect(m.sender_id).toBe(studentId);
      }
      for (const m of data.messages.received) {
        expect(m.recipient_id).toBe(studentId);
      }

      // Poll votes verification
      for (const v of data.pollVotes) {
        expect(v.user_id).toBe(studentId);
      }
    });
  });
});
