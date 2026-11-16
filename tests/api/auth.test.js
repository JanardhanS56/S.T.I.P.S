import { vi, describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createMockDb } from '../helpers/mockDb.js';
import { config } from '../../server/config.js';

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

describe('Auth API Integration Tests (AUTH-01..AUTH-06, AUTH-10..AUTH-12)', () => {
  beforeEach(() => {
    mockDb = createMockDb();
  });

  describe('AUTH-01 & AUTH-10: Login success, payload, and cookie security flags', () => {
    it('sets an HttpOnly, SameSite=Strict session cookie and returns public user without password hash', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({ username: 'admin_a', password: 'TestPassword123!' });

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.username).toBe('admin_a');
      expect(res.body.user.displayName).toBe('Principal Alpha');
      expect(res.body.user.role).toBe('admin');
      expect(res.body.user.password_hash).toBeUndefined();
      expect(res.body.user.password).toBeUndefined();

      // AUTH-10: verify cookie flags
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies[0] : cookies;
      expect(cookieStr).toContain('stips_session=');
      expect(cookieStr.toLowerCase()).toContain('httponly');
      expect(cookieStr.toLowerCase()).toContain('samesite=strict');
      expect(cookieStr.toLowerCase()).toContain('path=/');
    });
  });

  describe('AUTH-02: Wrong password and unknown user return identical error', () => {
    it('returns 401 with generic message for non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({ username: 'unknown_user_99', password: 'SomePassword123!' });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Wrong username or password.' });
    });

    it('returns 401 with identical message for wrong password on existing user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({ username: 'admin_a', password: 'IncorrectPassword999!' });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'Wrong username or password.' });
    });
  });

  describe('AUTH-03 & AUTH-04: Account lockout after 5 failures and reset on success', () => {
    it('locks account after 5 failed attempts with 429 and rejects correct password while locked', async () => {
      // 5 wrong attempts
      for (let i = 1; i <= 5; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .set('Content-Type', 'application/json')
          .send({ username: 'teacher_a1', password: `WrongPassword${i}!` });

        expect(res.status).toBe(401);
      }

      // 6th attempt with correct password should be rejected with 429 while locked
      const resLocked = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({ username: 'teacher_a1', password: 'TestPassword123!' });

      expect(resLocked.status).toBe(429);
      expect(resLocked.body.error).toContain('Too many wrong attempts');
    });

    it('allows sign-in after lockout window expires and resets failed_attempts', async () => {
      const teacher = mockDb.users.find((u) => u.username === 'teacher_a1');
      // Set expired lockout
      teacher.failed_attempts = 5;
      teacher.locked_until = new Date(Date.now() - 60000).toISOString();

      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({ username: 'teacher_a1', password: 'TestPassword123!' });

      expect(res.status).toBe(200);
      expect(teacher.failed_attempts).toBe(0);
      expect(teacher.locked_until).toBeNull();
    });
  });

  describe('AUTH-05: Suspended accounts cannot login and existing sessions stop working', () => {
    it('returns 403 when suspended user attempts login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({ username: 'suspended_user', password: 'TestPassword123!' });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('This account is suspended. Contact the office.');
    });

    it('rejects existing session cookie of suspended user with 401', async () => {
      const suspendedUser = mockDb.users.find((u) => u.username === 'suspended_user');
      const token = jwt.sign({ sub: suspendedUser.id }, config.jwtSecret, { expiresIn: '7d' });

      const res = await request(app).get('/api/auth/me').set('Cookie', `stips_session=${token}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Account unavailable.');
    });
  });

  describe('AUTH-06: /api/auth/me validation', () => {
    it('returns 401 when no cookie is provided', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Please sign in.');
    });

    it('returns 401 when a tampered or invalid cookie is provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', 'stips_session=tampered.invalid.jwt.token');

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Session expired');
    });

    it('returns user and community for valid authenticated session', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({ username: 'admin_a', password: 'TestPassword123!' });

      const cookie = extractCookie(loginRes);

      const meRes = await request(app).get('/api/auth/me').set('Cookie', cookie);

      expect(meRes.status).toBe(200);
      expect(meRes.body.user.username).toBe('admin_a');
      expect(meRes.body.community.name).toBe('Alpha Institute');
    });
  });

  describe('AUTH-11: Join community by code', () => {
    it('allows a user without a community to join with valid code', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({ username: 'no_community_user', password: 'TestPassword123!' });

      const cookie = extractCookie(loginRes);

      const joinRes = await request(app)
        .post('/api/auth/join')
        .set('Cookie', cookie)
        .set('Content-Type', 'application/json')
        .send({ code: 'ALPH-0001' });

      expect(joinRes.status).toBe(200);
      expect(joinRes.body.community.name).toBe('Alpha Institute');
    });

    it('rejects invalid community code with 404', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({ username: 'no_community_user', password: 'TestPassword123!' });

      const cookie = extractCookie(loginRes);

      const joinRes = await request(app)
        .post('/api/auth/join')
        .set('Cookie', cookie)
        .set('Content-Type', 'application/json')
        .send({ code: 'NONEXISTENT' });

      expect(joinRes.status).toBe(404);
      expect(joinRes.body.error).toBe('That code is not valid.');
    });

    it('returns 409 if user is already a member of a community', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({ username: 'student_a1', password: 'TestPassword123!' });

      const cookie = extractCookie(loginRes);

      const joinRes = await request(app)
        .post('/api/auth/join')
        .set('Cookie', cookie)
        .set('Content-Type', 'application/json')
        .send({ code: 'BETA-0002' });

      expect(joinRes.status).toBe(409);
      expect(joinRes.body.error).toBe('You are already in a community.');
    });
  });

  describe('AUTH-12: Logout clears the session cookie', () => {
    it('clears session cookie on POST /api/auth/logout', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Content-Type', 'application/json')
        .send({});
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies[0] : cookies;
      expect(cookieStr).toContain('stips_session=');
      // Cookie is cleared with max-age=0 or expires in past or empty value
      const isCleared =
        cookieStr.includes('Expires=Thu, 01 Jan 1970') ||
        cookieStr.includes('Max-Age=0') ||
        cookieStr.startsWith('stips_session=;');
      expect(isCleared).toBe(true);
    });
  });
});
