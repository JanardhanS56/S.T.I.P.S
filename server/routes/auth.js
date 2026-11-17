import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db.js';
import { config } from '../config.js';
import { h, parse, HttpError } from '../http.js';
import { setSession, clearSession, requireAuth, publicUser, requireNotMuted } from '../session.js';
import { screen } from '../moderation.js';
import { validatePassword } from '../lib/passwordPolicy.js';
import { loginRateLimiter } from '../rateLimit.js';

const r = Router();
const FIELDS =
  'id,username,display_name,role,community_id,bio,department,status,must_change_password,password_hash,failed_attempts,locked_until,token_version,accepted_terms_at,terms_version';

r.post(
  '/login',
  loginRateLimiter,
  h(async (req, res) => {
    const { username, password } = parse(
      z.object({ username: z.string().min(1).max(32), password: z.string().min(1).max(100) }),
      req.body
    );
    const { data: u } = await db
      .from('users')
      .select(FIELDS)
      .eq('username', username.trim().toLowerCase())
      .maybeSingle();
    const generic = new HttpError(401, 'Wrong username or password.'); // same message either way: no username probing

    if (!u) {
      await bcrypt.compare(
        password,
        '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin'
      );
      throw generic;
    }
    if (u.locked_until && new Date(u.locked_until) > new Date())
      throw new HttpError(429, 'Too many wrong attempts. Try again in a few minutes.');
    if (u.status === 'suspended')
      throw new HttpError(403, 'This account is suspended. Contact the office.');

    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) {
      const failed = u.failed_attempts + 1;
      const lock = failed >= config.limits.loginFailuresBeforeLock;
      await db
        .from('users')
        .update({
          failed_attempts: lock ? 0 : failed,
          locked_until: lock
            ? new Date(Date.now() + config.limits.lockMinutes * 60000).toISOString()
            : null
        })
        .eq('id', u.id);
      throw generic;
    }
    await db.from('users').update({ failed_attempts: 0, locked_until: null }).eq('id', u.id);
    setSession(res, u);
    res.json({ user: publicUser(u) });
  })
);

r.post('/logout', (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

r.post(
  '/logout-all',
  requireAuth,
  h(async (req, res) => {
    const newVersion = (req.user.token_version ?? 0) + 1;
    await db.from('users').update({ token_version: newVersion }).eq('id', req.user.id);
    clearSession(res);
    res.json({ ok: true });
  })
);

r.get(
  '/me',
  requireAuth,
  h(async (req, res) => {
    let community = null;
    if (req.user.community_id) {
      const { data } = await db
        .from('communities')
        .select('id,name')
        .eq('id', req.user.community_id)
        .single();
      community = data;
    }
    res.json({ user: publicUser(req.user), community });
  })
);

// Join by code: for accounts the office issued without a community attached.
r.post(
  '/join',
  requireAuth,
  h(async (req, res) => {
    const { code } = parse(z.object({ code: z.string().min(4).max(20) }), req.body);
    if (req.user.community_id) throw new HttpError(409, 'You are already in a community.');
    const { data: c } = await db
      .from('communities')
      .select('id,name')
      .eq('code', code.trim().toUpperCase())
      .maybeSingle();
    if (!c) throw new HttpError(404, 'That code is not valid.');
    await db.from('users').update({ community_id: c.id }).eq('id', req.user.id);
    res.json({ community: c });
  })
);

r.post(
  '/change-password',
  requireAuth,
  h(async (req, res) => {
    const { current, next } = parse(
      z.object({
        current: z.string().max(100),
        next: z.string().max(100)
      }),
      req.body
    );
    const policy = validatePassword(next, req.user.username);
    if (!policy.valid) throw new HttpError(400, policy.reason);

    const { data: u } = await db
      .from('users')
      .select('password_hash')
      .eq('id', req.user.id)
      .single();
    if (!(await bcrypt.compare(current, u.password_hash)))
      throw new HttpError(400, 'Current password is wrong.');
    const newVersion = (req.user.token_version ?? 0) + 1;
    await db
      .from('users')
      .update({
        password_hash: await bcrypt.hash(next, 10),
        must_change_password: false,
        token_version: newVersion
      })
      .eq('id', req.user.id);
    setSession(res, { ...req.user, token_version: newVersion });
    res.json({ ok: true });
  })
);

r.patch(
  '/profile',
  requireAuth,
  requireNotMuted,
  h(async (req, res) => {
    const { displayName, bio } = parse(
      z.object({ displayName: z.string().trim().min(1).max(60), bio: z.string().trim().max(160) }),
      req.body
    );
    const check = await screen(`${displayName}\n${bio}`);
    if (!check.ok) throw new HttpError(422, check.reason);
    const { data } = await db
      .from('users')
      .update({ display_name: displayName, bio })
      .eq('id', req.user.id)
      .select()
      .single();
    res.json({ user: publicUser(data) });
  })
);

r.post(
  '/consent',
  requireAuth,
  h(async (req, res) => {
    const CURRENT_TERMS_VERSION = 1;
    const now = new Date().toISOString();
    const { data: updated, error } = await db
      .from('users')
      .update({
        accepted_terms_at: now,
        terms_version: CURRENT_TERMS_VERSION
      })
      .eq('id', req.user.id)
      .select(FIELDS)
      .single();
    if (error || !updated) throw new HttpError(500, 'Could not save terms consent.');
    res.json({ ok: true, user: publicUser(updated) });
  })
);

export default r;
