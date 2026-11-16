import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { createMockDb } from '../helpers/mockDb.js';

let mockDb;
vi.mock('../../server/db.js', () => ({
  db: {
    from: (table) => mockDb.from(table)
  }
}));

const { default: app } = await import('../../server/app.js');

describe('Maintenance Mode API Tests (SEC-10)', () => {
  const originalMaintenanceMode = process.env.MAINTENANCE_MODE;

  beforeEach(() => {
    mockDb = createMockDb();
    delete process.env.MAINTENANCE_MODE;
  });

  afterEach(() => {
    if (originalMaintenanceMode !== undefined) {
      process.env.MAINTENANCE_MODE = originalMaintenanceMode;
    } else {
      delete process.env.MAINTENANCE_MODE;
    }
    vi.restoreAllMocks();
  });

  it('blocks writes with 503 when MAINTENANCE_MODE=1', async () => {
    process.env.MAINTENANCE_MODE = '1';

    const postRes = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({ username: 'admin_a', password: 'TestPassword123!' });

    expect(postRes.status).toBe(503);
    expect(postRes.body.error).toContain('maintenance mode');

    const deleteRes = await request(app)
      .delete('/api/posts/00000000-0000-0000-0000-000000000001')
      .set('Content-Type', 'application/json');

    expect(deleteRes.status).toBe(503);
  });

  it('allows read endpoints like /api/health with 200 when MAINTENANCE_MODE=1', async () => {
    process.env.MAINTENANCE_MODE = '1';

    const healthRes = await request(app).get('/api/health');
    expect(healthRes.status).toBe(200);
    expect(healthRes.body.ok).toBe(true);
  });

  it('allows normal writes when MAINTENANCE_MODE is 0 or unset', async () => {
    process.env.MAINTENANCE_MODE = '0';

    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({ username: 'admin_a', password: 'TestPassword123!' });

    expect(res.status).toBe(200);
  });
});
