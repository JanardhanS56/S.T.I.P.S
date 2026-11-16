import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { config } from './config.js';
import { HttpError } from './http.js';

const COOKIE = 'stips_session';
const USER_FIELDS =
  'id,username,display_name,role,community_id,bio,department,status,must_change_password';

export function setSession(res, user) {
  const token = jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: '7d' });
  res.cookie(COOKIE, token, {
    httpOnly: true, // JavaScript in the page cannot read it
    secure: config.isProd, // HTTPS only in production
    sameSite: 'strict', // not sent on cross-site requests (CSRF protection)
    maxAge: 7 * 24 * 3600 * 1000,
    path: '/'
  });
}

export const clearSession = (res) => res.clearCookie(COOKIE, { path: '/' });

export async function requireAuth(req, _res, next) {
  try {
    const token = req.cookies?.[COOKIE];
    if (!token) throw new HttpError(401, 'Please sign in.');
    const { sub } = jwt.verify(token, config.jwtSecret);
    const { data: user } = await db.from('users').select(USER_FIELDS).eq('id', sub).maybeSingle();
    if (!user || user.status === 'suspended') throw new HttpError(401, 'Account unavailable.');
    req.user = user;
    next();
  } catch (e) {
    next(e instanceof HttpError ? e : new HttpError(401, 'Session expired. Please sign in again.'));
  }
}

export const requireCommunity = (req, _res, next) =>
  next(req.user.community_id ? undefined : new HttpError(403, 'Join a community first.'));

export const requireAdmin = (req, _res, next) =>
  next(req.user.role === 'admin' ? undefined : new HttpError(403, 'Office accounts only.'));

// Muted accounts can read but not create anything.
export const requireNotMuted = (req, _res, next) =>
  next(
    req.user.status === 'muted'
      ? new HttpError(403, 'Your account is muted. Contact the office.')
      : undefined
  );

export const publicUser = (u) => ({
  id: u.id,
  username: u.username,
  displayName: u.display_name,
  role: u.role,
  communityId: u.community_id,
  bio: u.bio,
  department: u.department,
  mustChangePassword: u.must_change_password
});
