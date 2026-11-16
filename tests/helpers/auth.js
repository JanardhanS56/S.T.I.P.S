import request from 'supertest';
import jwt from 'jsonwebtoken';
import { config } from '../../server/config.js';

export function extractCookie(res, cookieName = 'stips_session') {
  const cookies = res.headers['set-cookie'];
  if (!cookies) return null;
  const cookieList = Array.isArray(cookies) ? cookies : [cookies];
  for (const c of cookieList) {
    if (c.startsWith(`${cookieName}=`)) {
      return c.split(';')[0];
    }
  }
  return null;
}

export async function loginUser(app, username, password) {
  const res = await request(app)
    .post('/api/auth/login')
    .set('Content-Type', 'application/json')
    .send({ username, password });

  const cookie = extractCookie(res);
  return { res, cookie, user: res.body?.user };
}

export function createTestToken(payload, secret = config.jwtSecret, options = { expiresIn: '7d' }) {
  return jwt.sign(payload, secret, options);
}
