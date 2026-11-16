import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../helpers/app.js';

describe('Test Harness Smoke Test', () => {
  it('runs vitest assertions cleanly', () => {
    expect(1 + 1).toBe(2);
  });

  it('GET /api/health responds with 200 { ok: true }', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
