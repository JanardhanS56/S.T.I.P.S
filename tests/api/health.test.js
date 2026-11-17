import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

let mockDbHandler = {
  error: null,
  shouldThrow: false
};

vi.mock('../../server/db.js', () => ({
  db: {
    from: () => ({
      select: () => ({
        limit: () => {
          if (mockDbHandler.shouldThrow) {
            throw new Error('Connection timed out');
          }
          if (mockDbHandler.error) {
            return Promise.resolve({ data: null, error: mockDbHandler.error });
          }
          return Promise.resolve({
            data: [{ id: '00000000-0000-0000-0000-000000000001' }],
            error: null
          });
        }
      })
    })
  }
}));

const { default: app } = await import('../../server/app.js');

describe('Health API Integration Tests (D1-15)', () => {
  it('returns 200 and { ok: true, db: true } when DB ping succeeds', async () => {
    mockDbHandler.error = null;
    mockDbHandler.shouldThrow = false;

    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, db: true });
  });

  it('returns 503 and { ok: false, db: false } when DB query returns an error', async () => {
    mockDbHandler.error = new Error('Database relation does not exist');
    mockDbHandler.shouldThrow = false;

    const res = await request(app).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      ok: false,
      db: false,
      error: 'Database unavailable.'
    });
  });

  it('returns 503 and { ok: false, db: false } when DB query throws an unhandled exception', async () => {
    mockDbHandler.error = null;
    mockDbHandler.shouldThrow = true;

    const res = await request(app).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({
      ok: false,
      db: false,
      error: 'Database unavailable.'
    });
  });

  it('PERF-03: handles total database outage gracefully with 503 and preserves security headers', async () => {
    mockDbHandler.error = new Error('ETIMEDOUT: Connection to database terminated');
    mockDbHandler.shouldThrow = false;

    const res = await request(app).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body.ok).toBe(false);
    expect(res.body.db).toBe(false);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toBeDefined();
  });
});
