import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createMockDb } from '../helpers/mockDb.js';

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

async function loginAs(username, password = 'TestPassword123!') {
  const res = await request(app).post('/api/auth/login').send({ username, password });
  if (res.status !== 200) {
    throw new Error(
      `Login failed for ${username} with status ${res.status}: ${JSON.stringify(res.body)}`
    );
  }
  return extractCookie(res);
}

describe('Posts API (POST-01..POST-09)', () => {
  beforeEach(() => {
    mockDb = createMockDb();
  });

  describe('POST-01..POST-04: Creation and Rate Limits', () => {
    it('POST-01: creates post with valid body and category, appears in feed', async () => {
      const cookie = await loginAs('student_a1');
      const res = await request(app)
        .post('/api/posts')
        .set('Cookie', cookie)
        .send({ body: 'A brand new valid post for testing', category: 'Notice' });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();

      const feedRes = await request(app).get('/api/posts').set('Cookie', cookie);
      expect(feedRes.status).toBe(200);
      const found = feedRes.body.posts.find((p) => p.id === res.body.id);
      expect(found).toBeDefined();
      expect(found.body).toBe('A brand new valid post for testing');
      expect(found.category).toBe('Notice');
    });

    it('POST-02: rejects 281 characters, empty, and whitespace-only body with 400', async () => {
      const cookie = await loginAs('student_a1');

      // 281 chars
      const longBody = 'a'.repeat(281);
      const resLong = await request(app)
        .post('/api/posts')
        .set('Cookie', cookie)
        .send({ body: longBody, category: 'Notice' });
      expect(resLong.status).toBe(400);

      // Empty
      const resEmpty = await request(app)
        .post('/api/posts')
        .set('Cookie', cookie)
        .send({ body: '', category: 'Notice' });
      expect(resEmpty.status).toBe(400);

      // Whitespace-only
      const resWhitespace = await request(app)
        .post('/api/posts')
        .set('Cookie', cookie)
        .send({ body: '    \n  \t  ', category: 'Notice' });
      expect(resWhitespace.status).toBe(400);
    });

    it('POST-03: rejects invalid category with 400', async () => {
      const cookie = await loginAs('student_a1');
      const res = await request(app)
        .post('/api/posts')
        .set('Cookie', cookie)
        .send({ body: 'Valid body text', category: 'InvalidCategory' });

      expect(res.status).toBe(400);
    });

    it('POST-04: enforces 3s min gap and 10 posts per hour limit with 429 and Retry-After', async () => {
      const cookie = await loginAs('student_a1');

      // 1st post succeeds
      const res1 = await request(app)
        .post('/api/posts')
        .set('Cookie', cookie)
        .send({ body: 'First post in burst', category: 'Notice' });
      expect(res1.status).toBe(201);

      // Immediate 2nd post fails min 3s gap
      const res2 = await request(app)
        .post('/api/posts')
        .set('Cookie', cookie)
        .send({ body: 'Second post immediately after', category: 'Notice' });
      expect(res2.status).toBe(429);
      expect(res2.headers['retry-after']).toBeDefined();
      expect(res2.body.error).toContain('Please wait a few seconds');

      // Now simulate 10 posts already created within the hour (spaced out by 5s each, all > 5s ago)
      for (let i = mockDb.posts.length - 1; i >= 0; i--) {
        if (mockDb.posts[i].author_id === '00000000-0000-0000-0001-000000000004') {
          mockDb.posts.splice(i, 1);
        }
      }
      const now = Date.now();
      for (let i = 0; i < 10; i++) {
        mockDb.posts.push({
          id: `00000000-0000-0000-0003-00000000009${i}`,
          community_id: '00000000-0000-0000-0000-000000000001',
          author_id: '00000000-0000-0000-0001-000000000004',
          category: 'Notice',
          body: `Hourly post number ${i}`,
          status: 'visible',
          created_at: new Date(now - 100000 - i * 5000).toISOString()
        });
      }

      // 11th post returns 429 with Retry-After header
      const res11 = await request(app)
        .post('/api/posts')
        .set('Cookie', cookie)
        .send({ body: 'Eleventh post in an hour', category: 'Notice' });

      expect(res11.status).toBe(429);
      expect(res11.headers['retry-after']).toBe('3600');
      expect(res11.body.error).toContain('10 times an hour');
    });

    it('POST-05: rejects duplicate text within 10 minutes by same author with 409', async () => {
      const cookie = await loginAs('student_a1');
      const uniqueText = 'Unique duplicate test text';

      // Seed an existing post by student_a1 created 2 minutes ago
      mockDb.posts.push({
        id: '00000000-0000-0000-0003-000000000088',
        community_id: '00000000-0000-0000-0000-000000000001',
        author_id: '00000000-0000-0000-0001-000000000004',
        category: 'Notice',
        body: uniqueText,
        status: 'visible',
        created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString()
      });

      const resDup = await request(app)
        .post('/api/posts')
        .set('Cookie', cookie)
        .send({ body: uniqueText, category: 'Notice' });

      expect(resDup.status).toBe(409);
      expect(resDup.body.error).toBe('You already posted that recently.');
    });
  });

  describe('POST-06 & POST-07: Moderation and Deletion Rules', () => {
    it('POST-06: rejects blocked words and contact information with 422', async () => {
      const cookie = await loginAs('student_a1');

      // Blocked word (from blocklist)
      const resBlocked = await request(app)
        .post('/api/posts')
        .set('Cookie', cookie)
        .send({ body: 'You are an idiot person', category: 'Notice' });
      expect(resBlocked.status).toBe(422);
      expect(resBlocked.body.error).toBeDefined();

      // Phone number
      const resPhone = await request(app)
        .post('/api/posts')
        .set('Cookie', cookie)
        .send({ body: 'Call me on 9876543210 tonight', category: 'Notice' });
      expect(resPhone.status).toBe(422);
      expect(resPhone.body.error).toContain('Phone numbers and email addresses');

      // Email address
      const resEmail = await request(app)
        .post('/api/posts')
        .set('Cookie', cookie)
        .send({ body: 'Reach me at student@example.com for answers', category: 'Notice' });
      expect(resEmail.status).toBe(422);
      expect(resEmail.body.error).toContain('Phone numbers and email addresses');
    });

    it('POST-07: only author or admin can delete; deleted post disappears from feed', async () => {
      const studentCookie = await loginAs('student_a1');
      const teacherCookie = await loginAs('teacher_a1');
      const adminCookie = await loginAs('admin_a');

      // Student creates a post
      const createRes = await request(app)
        .post('/api/posts')
        .set('Cookie', studentCookie)
        .send({ body: 'Post to be deleted by author', category: 'Moment' });
      expect(createRes.status).toBe(201);
      const postId = createRes.body.id;

      // Teacher tries to delete student post -> 403
      const delTeacher = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Cookie', teacherCookie)
        .send({});
      expect(delTeacher.status).toBe(403);
      expect(delTeacher.body.error).toBe('Not allowed.');

      // Author deletes own post -> 200
      const delAuthor = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Cookie', studentCookie)
        .send({});
      expect(delAuthor.status).toBe(200);
      expect(delAuthor.body.ok).toBe(true);

      // Verify post disappeared from feed
      const feedRes1 = await request(app).get('/api/posts').set('Cookie', studentCookie);
      const foundInFeed = feedRes1.body.posts.find((p) => p.id === postId);
      expect(foundInFeed).toBeUndefined();

      // Student creates another post for admin deletion test
      // Wait or advance timer/splice to avoid min 3s gap
      for (let i = mockDb.posts.length - 1; i >= 0; i--) {
        if (mockDb.posts[i].author_id === '00000000-0000-0000-0001-000000000004') {
          mockDb.posts.splice(i, 1);
        }
      }
      const createRes2 = await request(app)
        .post('/api/posts')
        .set('Cookie', studentCookie)
        .send({ body: 'Post to be deleted by admin', category: 'Notice' });
      expect(createRes2.status).toBe(201);
      const post2Id = createRes2.body.id;

      // Admin deletes student post -> 200
      const delAdmin = await request(app)
        .delete(`/api/posts/${post2Id}`)
        .set('Cookie', adminCookie)
        .send({});
      expect(delAdmin.status).toBe(200);
      expect(delAdmin.body.ok).toBe(true);

      // Verify post disappeared from feed
      const feedRes2 = await request(app).get('/api/posts').set('Cookie', studentCookie);
      expect(feedRes2.body.posts.find((p) => p.id === post2Id)).toBeUndefined();
    });
  });

  describe('POST-08: XSS Payload Storage', () => {
    it('POST-08: stores XSS payloads as raw text and returns them unchanged', async () => {
      const cookie = await loginAs('student_a1');
      const xssPayload = '<script>alert("xss")</script><img src="x" onerror="alert(1)">';

      // Clear existing posts by this author to avoid burst limit
      for (let i = mockDb.posts.length - 1; i >= 0; i--) {
        if (mockDb.posts[i].author_id === '00000000-0000-0000-0001-000000000004') {
          mockDb.posts.splice(i, 1);
        }
      }

      const res = await request(app)
        .post('/api/posts')
        .set('Cookie', cookie)
        .send({ body: xssPayload, category: 'Notice' });

      expect(res.status).toBe(201);
      const postId = res.body.id;

      const feedRes = await request(app).get('/api/posts').set('Cookie', cookie);
      expect(feedRes.status).toBe(200);
      const post = feedRes.body.posts.find((p) => p.id === postId);
      expect(post).toBeDefined();
      expect(post.body).toBe(xssPayload);
    });
  });

  describe('POST-09: Cursor Pagination', () => {
    it('POST-09: paginates stably through posts with before and limit', async () => {
      const cookie = await loginAs('student_a1');

      // Clear existing posts in community A to have a deterministic set
      for (let i = mockDb.posts.length - 1; i >= 0; i--) {
        if (mockDb.posts[i].community_id === '00000000-0000-0000-0000-000000000001') {
          mockDb.posts.splice(i, 1);
        }
      }

      // Seed 5 posts with distinct ascending timestamps (so newest is P5)
      const baseTime = 1700000000000;
      for (let i = 1; i <= 5; i++) {
        mockDb.posts.push({
          id: `00000000-0000-0000-0003-00000000000${i}`,
          community_id: '00000000-0000-0000-0000-000000000001',
          author_id: '00000000-0000-0000-0001-000000000004',
          category: 'Notice',
          body: `Paginated post ${i}`,
          status: 'visible',
          created_at: new Date(baseTime + i * 10000).toISOString()
        });
      }

      // Page 1: limit 2 -> returns post 5 and post 4
      const page1 = await request(app).get('/api/posts?limit=2').set('Cookie', cookie);
      expect(page1.status).toBe(200);
      expect(page1.body.posts).toHaveLength(2);
      expect(page1.body.posts[0].body).toBe('Paginated post 5');
      expect(page1.body.posts[1].body).toBe('Paginated post 4');
      expect(page1.body.nextCursor).toBe(page1.body.posts[1].created_at);

      // Page 2: limit 2 & before=nextCursor -> returns post 3 and post 2
      const page2 = await request(app)
        .get(`/api/posts?limit=2&before=${encodeURIComponent(page1.body.nextCursor)}`)
        .set('Cookie', cookie);
      expect(page2.status).toBe(200);
      expect(page2.body.posts).toHaveLength(2);
      expect(page2.body.posts[0].body).toBe('Paginated post 3');
      expect(page2.body.posts[1].body).toBe('Paginated post 2');
      expect(page2.body.nextCursor).toBe(page2.body.posts[1].created_at);

      // Page 3: limit 2 & before=nextCursor -> returns post 1, nextCursor is null
      const page3 = await request(app)
        .get(`/api/posts?limit=2&before=${encodeURIComponent(page2.body.nextCursor)}`)
        .set('Cookie', cookie);
      expect(page3.status).toBe(200);
      expect(page3.body.posts).toHaveLength(1);
      expect(page3.body.posts[0].body).toBe('Paginated post 1');
      expect(page3.body.nextCursor).toBeNull();
    });

    it('POST-09: validates limit parameter boundary (1..50)', async () => {
      const cookie = await loginAs('student_a1');

      // limit > 50 -> 400
      const resHigh = await request(app).get('/api/posts?limit=51').set('Cookie', cookie);
      expect(resHigh.status).toBe(400);

      // limit < 1 -> 400
      const resLow = await request(app).get('/api/posts?limit=0').set('Cookie', cookie);
      expect(resLow.status).toBe(400);
    });
  });
});
