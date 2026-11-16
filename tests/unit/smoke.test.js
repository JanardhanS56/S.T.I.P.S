import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createMockDb } from '../helpers/mockDb.js';

let mockDb = createMockDb();
vi.mock('../../server/db.js', () => ({
  db: {
    from: (table) => mockDb.from(table)
  }
}));

const { default: app } = await import('../../server/app.js');

describe('Test Harness Smoke Test', () => {
  it('runs vitest assertions cleanly', () => {
    expect(1 + 1).toBe(2);
  });

  it('GET /api/health responds with 200 { ok: true, db: true }', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, db: true });
  });
});
