import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { config } from '../../server/config.js';
import { createMockDb } from '../helpers/mockDb.js';

let mockDb;
vi.mock('../../server/db.js', () => ({
  db: {
    from: (table) => mockDb.from(table)
  }
}));

const { default: app } = await import('../../server/app.js');

describe('Security Headers and Payload API Tests (SEC-01, SEC-02, SEC-09)', () => {
  const originalIsProd = config.isProd;

  beforeEach(() => {
    mockDb = createMockDb();
    config.isProd = false;
  });

  afterEach(() => {
    config.isProd = originalIsProd;
    vi.restoreAllMocks();
  });

  describe('SEC-01: Security headers present', () => {
    it('sets CSP, nosniff, frame-ancestors none, referrer policy, and permissions policy', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);

      const csp = res.headers['content-security-policy'];
      expect(csp).toBeDefined();
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain('https://fonts.googleapis.com');
      expect(csp).toContain('https://fonts.gstatic.com');
      expect(csp).toContain("script-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("base-uri 'self'");
      expect(csp).toContain("form-action 'self'");

      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['referrer-policy']).toBe('no-referrer');
      expect(res.headers['permissions-policy']).toBeDefined();
    });

    it('sets Strict-Transport-Security in production mode', async () => {
      config.isProd = true;
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.headers['strict-transport-security']).toBeDefined();
      expect(res.headers['strict-transport-security']).toContain('max-age=31536000');
      expect(res.headers['strict-transport-security']).toContain('includeSubDomains');
    });
  });

  describe('SEC-02: Content-Type enforcement and size limits', () => {
    it('returns 415 for non-JSON write requests', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'text/plain')
        .send('username=admin&password=secret');

      expect(res.status).toBe(415);
      expect(res.body.error).toBe('JSON only.');
    });

    it('returns 415 for form-urlencoded write requests', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('body=test');

      expect(res.status).toBe(415);
      expect(res.body.error).toBe('JSON only.');
    });

    it('returns 413 when JSON body exceeds 10kb', async () => {
      // 10kb is 10240 bytes. Send ~12kb payload.
      const bigString = 'A'.repeat(12 * 1024);
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ username: 'test', password: bigString }));

      expect(res.status).toBe(413);
      expect(res.body.error).toBe('Payload too large.');
    });
  });

  describe('SEC-09: Oversized and malformed JSON payloads rejected safely', () => {
    it('rejects malformed JSON payload with 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"username": "broken", invalid_json}');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid JSON payload.');
    });

    it('rejects massive JSON structure over 10kb quickly', async () => {
      const nested = { data: 'x'.repeat(15000) };
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify(nested));

      expect(res.status).toBe(413);
    });
  });
});
