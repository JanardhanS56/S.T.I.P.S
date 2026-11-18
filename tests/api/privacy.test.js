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
      expect(data.community).toEqual({
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Alpha Institute'
      });
      expect(data.community.code).toBeUndefined();

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

    it('exports posts, post_replies, and pollsCreated for an author', async () => {
      mockDb.post_replies.push({
        id: '00000000-0000-0000-0008-000000000001',
        post_id: '00000000-0000-0000-0003-000000000001',
        parent_id: '00000000-0000-0000-0003-000000000001',
        community_id: '00000000-0000-0000-0000-000000000001',
        author_id: '00000000-0000-0000-0001-000000000002',
        body: 'Reply from teacher',
        status: 'visible',
        created_at: new Date().toISOString()
      });

      const login = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({ username: 'teacher_a1', password: 'TestPassword123!' });
      expect(login.status).toBe(200);
      const cookie = extractCookie(login);

      const res = await request(app).get('/api/me/export').set('Cookie', cookie);
      expect(res.status).toBe(200);
      expect(res.body.posts.length).toBeGreaterThan(0);
      expect(res.body.replies.length).toBe(1);
      expect(res.body.replies[0].body).toBe('Reply from teacher');
      expect(res.body.pollsCreated.length).toBeGreaterThan(0);
    });
  });

  describe('ADM-08 Deletion Request and Anonymization Flow', () => {
    it('allows a member to submit a deletion request and admin to confirm and anonymize', async () => {
      // 1. Login student_a1
      const studentLogin = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({ username: 'student_a1', password: 'TestPassword123!' });
      const studentCookie = extractCookie(studentLogin);

      // 2. Submit deletion request
      const reqRes = await request(app)
        .post('/api/me/delete-request')
        .set('Cookie', studentCookie)
        .set('Content-Type', 'application/json')
        .send({ reason: 'Graduated from campus.' });

      expect(reqRes.status).toBe(201);
      expect(reqRes.body.ok).toBe(true);
      expect(reqRes.body.request.status).toBe('pending');
      const requestId = reqRes.body.request.id;

      // Duplicate request returns existing
      const dupRes = await request(app)
        .post('/api/me/delete-request')
        .set('Cookie', studentCookie)
        .set('Content-Type', 'application/json')
        .send({ reason: 'Duplicate' });
      expect(dupRes.status).toBe(200);
      expect(dupRes.body.request.id).toBe(requestId);

      // 3. Admin logs in and reviews requests
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({ username: 'admin_a', password: 'TestPassword123!' });
      const adminCookie = extractCookie(adminLogin);

      const listRes = await request(app)
        .get('/api/admin/deletion-requests')
        .set('Cookie', adminCookie);
      expect(listRes.status).toBe(200);
      expect(listRes.body.requests.length).toBeGreaterThan(0);
      const found = listRes.body.requests.find((r) => r.id === requestId);
      expect(found).toBeDefined();
      expect(found.user.username).toBe('student_a1');

      // 4. Admin confirms deletion
      const confirmRes = await request(app)
        .post(`/api/admin/deletion-requests/${requestId}/confirm`)
        .set('Cookie', adminCookie)
        .set('Content-Type', 'application/json')
        .send({});
      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.ok).toBe(true);
      expect(confirmRes.body.anonymizedUsername).toMatch(/^deleted-/);

      // 5. Verify target user is anonymized in DB
      const targetUser = mockDb.users.find((u) => u.id === '00000000-0000-0000-0001-000000000004');
      expect(targetUser.username).toMatch(/^deleted-/);
      expect(targetUser.display_name).toBe('Deleted user');
      expect(targetUser.bio).toBe('');
      expect(targetUser.status).toBe('suspended');

      // 6. Student session is revoked
      const afterRes = await request(app).get('/api/auth/me').set('Cookie', studentCookie);
      expect(afterRes.status).toBe(401);

      // 7. Audit log contains entry
      const auditRes = await request(app).get('/api/admin/audit').set('Cookie', adminCookie);
      expect(auditRes.status).toBe(200);
      const auditEntry = auditRes.body.audit.find((e) => e.action === 'account_deletion_confirm');
      expect(auditEntry).toBeDefined();
      expect(auditEntry.meta.previousUsername).toBe('student_a1');
    });
  });
});
