import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { config } from './config.js';
import { logger } from './logger.js';
import { HttpError } from './http.js';

const COOKIE = 'stips_session';
const USER_FIELDS =
  'id,username,display_name,role,community_id,bio,department,roll_number,section,status,must_change_password,token_version,accepted_terms_at,terms_version';

export function setSession(res, user) {
  const token = jwt.sign({ sub: user.id, tv: user.token_version ?? 0 }, config.jwtSecret, {
    expiresIn: '7d'
  });
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
    const { sub, tv } = jwt.verify(token, config.jwtSecret);
    const { data: user, error } = await db
      .from('users')
      .select(USER_FIELDS)
      .eq('id', sub)
      .maybeSingle();
    if (error) {
      (req.log || logger).error({ err: error }, 'Database error during session lookup');
      throw new HttpError(503, 'Service temporarily unavailable. Please try again.');
    }
    if (!user || user.status === 'suspended') throw new HttpError(401, 'Account unavailable.');
    const currentVersion = user.token_version ?? 0;
    if ((tv ?? 0) !== currentVersion) {
      throw new HttpError(401, 'Session revoked. Please sign in again.');
    }
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

export const requireTerms = (req, _res, next) => {
  const currentTermsVersion = 1;
  const userVersion = req.user.terms_version ?? 0;
  if (!userVersion || userVersion < currentTermsVersion) {
    return next(
      new HttpError(403, 'Please accept the updated terms and privacy policy to continue.')
    );
  }
  next();
};

export const publicUser = (u) => ({
  id: u.id,
  username: u.username,
  displayName: u.display_name,
  role: u.role,
  communityId: u.community_id,
  bio: u.bio,
  department: u.department ?? '',
  rollNumber: u.roll_number ?? '',
  section: u.section ?? '',
  mustChangePassword: u.must_change_password,
  acceptedTermsAt: u.accepted_terms_at,
  termsVersion: u.terms_version ?? 0
});
