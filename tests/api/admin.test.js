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

describe('Admin and Reporting API (ADM-01..ADM-07)', () => {
  const studentA1Id = '00000000-0000-0000-0001-000000000004';
  const postA1Id = '00000000-0000-0000-0003-000000000001';
  const reportA1Id = '00000000-0000-0000-0007-000000000001';

  beforeEach(() => {
    mockDb = createMockDb();
  });

  describe('ADM-01..ADM-03: Reporting and Queue Resolution', () => {
    it('ADM-01: any member can report content up to 20 times per day', async () => {
      const studentCookie = await loginAs('student_a1');

      // Valid report
      const res = await request(app).post('/api/reports').set('Cookie', studentCookie).send({
        targetType: 'post',
        targetId: postA1Id,
        reason: 'Harassment and inappropriate language'
      });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);

      // Verify created in DB
      const rep = mockDb.reports.find(
        (r) => r.reporter_id === studentA1Id && r.reason.includes('Harassment')
      );
      expect(rep).toBeDefined();
      expect(rep.target_id).toBe(postA1Id);

      // Seed 20 reports for studentA1 to hit limit
      const now = new Date().toISOString();
      for (let i = 0; i < 20; i++) {
        mockDb.reports.push({
          id: `00000000-0000-0000-0007-${String(i + 10).padStart(12, '0')}`,
          community_id: '00000000-0000-0000-0000-000000000001',
          reporter_id: studentA1Id,
          target_type: 'post',
          target_id: postA1Id,
          reason: `Auto report ${i}`,
          status: 'open',
          created_at: now
        });
      }

      // 21st report rejected with 429
      const capped = await request(app).post('/api/reports').set('Cookie', studentCookie).send({
        targetType: 'post',
        targetId: postA1Id,
        reason: 'Excessive report'
      });

      expect(capped.status).toBe(429);
      expect(capped.body.error).toContain('Report limit reached for today');
    });

    it('ADM-02: admin sees open reports for own community only', async () => {
      const adminCookie = await loginAs('admin_a');
      const res = await request(app).get('/api/admin/reports').set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.reports)).toBe(true);
      expect(res.body.reports.length).toBeGreaterThan(0);
      expect(res.body.reports.some((r) => r.id === reportA1Id)).toBe(true);
      // Foreign report excluded
      expect(res.body.reports.some((r) => r.id === '00000000-0000-0000-0007-000000000002')).toBe(
        false
      );
    });

    it('ADM-03: resolve with hide hides target post and marks actioned', async () => {
      const adminCookie = await loginAs('admin_a');

      const resolveRes = await request(app)
        .post(`/api/admin/reports/${reportA1Id}/resolve`)
        .set('Cookie', adminCookie)
        .send({ action: 'hide' });

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.ok).toBe(true);

      // Post status is hidden
      const post = mockDb.posts.find((p) => p.id === postA1Id);
      expect(post.status).toBe('hidden');

      // Report status is actioned
      const rep = mockDb.reports.find((r) => r.id === reportA1Id);
      expect(rep.status).toBe('actioned');
    });

    it('ADM-03: resolve with dismiss leaves target post visible and marks dismissed', async () => {
      const adminCookie = await loginAs('admin_a');

      const resolveRes = await request(app)
        .post(`/api/admin/reports/${reportA1Id}/resolve`)
        .set('Cookie', adminCookie)
        .send({ action: 'dismiss' });

      expect(resolveRes.status).toBe(200);

      // Post is still visible
      const post = mockDb.posts.find((p) => p.id === postA1Id);
      expect(post.status).toBe('visible');

      // Report status is dismissed
      const rep = mockDb.reports.find((r) => r.id === reportA1Id);
      expect(rep.status).toBe('dismissed');
    });
  });

  describe('ADM-04..ADM-06: Member Management and Status Controls', () => {
    it('ADM-04: bulk member creation generates credentials and enforces 200 member cap', async () => {
      const adminCookie = await loginAs('admin_a');

      const res = await request(app)
        .post('/api/admin/members')
        .set('Cookie', adminCookie)
        .send({
          members: [
            { name: 'Kavita Nair', role: 'student', department: 'CS' },
            { name: 'Dr. Ramesh Kumar', role: 'teacher', department: 'Physics' }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.created).toHaveLength(2);
      expect(res.body.created[0]).toHaveProperty('username');
      expect(res.body.created[0]).toHaveProperty('password');
      expect(res.body.created[0].password).toHaveLength(12);

      // Passwords are not plaintext in DB
      const user = mockDb.users.find((u) => u.username === res.body.created[0].username);
      expect(user).toBeDefined();
      expect(user.password_hash).not.toBe(res.body.created[0].password);
      expect(user.must_change_password).toBe(true);

      // Exceeding 200 cap rejected with 400
      const tooMany = Array.from({ length: 201 }, (_, i) => ({
        name: `User ${i}`,
        role: 'student'
      }));
      const rejectCap = await request(app)
        .post('/api/admin/members')
        .set('Cookie', adminCookie)
        .send({ members: tooMany });
      expect(rejectCap.status).toBe(400);
    });

    it('ADM-05: password reset returns new one-time password and increments token_version', async () => {
      const adminCookie = await loginAs('admin_a');
      const student = mockDb.users.find((u) => u.id === studentA1Id);
      const prevVersion = student.token_version ?? 0;

      const res = await request(app)
        .post(`/api/admin/users/${studentA1Id}/reset-password`)
        .set('Cookie', adminCookie)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.password).toBeDefined();
      expect(res.body.password).toHaveLength(12);

      expect(student.token_version).toBe(prevVersion + 1);
      expect(student.must_change_password).toBe(true);
      expect(student.failed_attempts).toBe(0);
      expect(student.locked_until).toBeNull();
    });

    it('ADM-06: status changes (muted, suspended, active) apply immediately', async () => {
      const adminCookie = await loginAs('admin_a');
      const student = mockDb.users.find((u) => u.id === studentA1Id);

      // Mute
      const muteRes = await request(app)
        .post(`/api/admin/users/${studentA1Id}/status`)
        .set('Cookie', adminCookie)
        .send({ status: 'muted' });
      expect(muteRes.status).toBe(200);
      expect(student.status).toBe('muted');

      // Suspend
      const suspendRes = await request(app)
        .post(`/api/admin/users/${studentA1Id}/status`)
        .set('Cookie', adminCookie)
        .send({ status: 'suspended' });
      expect(suspendRes.status).toBe(200);
      expect(student.status).toBe('suspended');

      // Reactivate
      const reactivateRes = await request(app)
        .post(`/api/admin/users/${studentA1Id}/status`)
        .set('Cookie', adminCookie)
        .send({ status: 'active' });
      expect(reactivateRes.status).toBe(200);
      expect(student.status).toBe('active');
    });

    it('GET /api/admin/members returns list of community members', async () => {
      const adminCookie = await loginAs('admin_a');
      const res = await request(app).get('/api/admin/members').set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.members)).toBe(true);
      expect(res.body.members.length).toBeGreaterThan(0);
      // Never exposes password hashes
      expect(res.body.members[0]).not.toHaveProperty('password_hash');
    });
  });

  describe('ADM-07: Audit Logging for All Administrative Actions', () => {
    it('ADM-07: logs audit entries for member creation, status updates, resets, and reports', async () => {
      const adminCookie = await loginAs('admin_a');

      // 1. Status update
      await request(app)
        .post(`/api/admin/users/${studentA1Id}/status`)
        .set('Cookie', adminCookie)
        .send({ status: 'muted' });

      // 2. Password reset
      await request(app)
        .post(`/api/admin/users/${studentA1Id}/reset-password`)
        .set('Cookie', adminCookie)
        .send({});

      // 3. Pin post (while visible)
      await request(app)
        .post(`/api/admin/posts/${postA1Id}/pin`)
        .set('Cookie', adminCookie)
        .send({ pinned: true });

      // 4. Official post (while visible)
      await request(app)
        .post(`/api/admin/posts/${postA1Id}/official`)
        .set('Cookie', adminCookie)
        .send({ official: true });

      // 5. Resolve report (hides post)
      await request(app)
        .post(`/api/admin/reports/${reportA1Id}/resolve`)
        .set('Cookie', adminCookie)
        .send({ action: 'hide' });

      // Check GET /api/admin/audit
      const auditRes = await request(app).get('/api/admin/audit').set('Cookie', adminCookie);

      expect(auditRes.status).toBe(200);
      expect(Array.isArray(auditRes.body.audit)).toBe(true);

      const actions = auditRes.body.audit.map((a) => a.action);
      expect(actions).toContain('user_status_change');
      expect(actions).toContain('user_password_reset');
      expect(actions).toContain('post_pin');
      expect(actions).toContain('post_official');
      expect(actions).toContain('report_hide');

      // Verify structure of an entry
      const statusEntry = auditRes.body.audit.find((a) => a.action === 'user_status_change');
      expect(statusEntry).toHaveProperty('actor');
      expect(statusEntry.actor.username).toBe('admin_a');
      expect(statusEntry.target_type).toBe('user');
      expect(statusEntry.target_id).toBe(studentA1Id);
      expect(statusEntry.meta).toMatchObject({ status: 'muted' });
    });
  });
});
