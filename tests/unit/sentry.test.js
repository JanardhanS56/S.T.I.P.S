import { describe, it, expect } from 'vitest';
import { scrubSentryEvent } from '../../server/lib/sentry.js';

describe('Sentry PII Scrubbing Tests (D4-09)', () => {
  it('scrubs authorization headers, cookies, and body data from request object', () => {
    const rawEvent = {
      request: {
        url: 'https://stips.campus/api/posts',
        method: 'POST',
        headers: {
          authorization: 'Bearer super-secret-token',
          cookie: 'stips_session=secret-jwt-cookie',
          'x-auth-token': 'token123',
          'content-type': 'application/json'
        },
        data: {
          username: 'student_a1',
          password: 'TestPassword123!',
          body: 'Hello world'
        },
        cookies: {
          stips_session: 'jwt-token-string'
        }
      }
    };

    const scrubbed = scrubSentryEvent(rawEvent);

    expect(scrubbed.request.headers.cookie).toBeUndefined();
    expect(scrubbed.request.headers.authorization).toBeUndefined();
    expect(scrubbed.request.headers['x-auth-token']).toBeUndefined();
    expect(scrubbed.request.headers['content-type']).toBe('application/json');
    expect(scrubbed.request.data).toBe('[REDACTED]');
    expect(scrubbed.request.cookies).toBe('[REDACTED]');
  });

  it('scrubs username, email, display_name, and ip_address from user object', () => {
    const rawEvent = {
      user: {
        id: '00000000-0000-0000-0001-000000000001',
        username: 'student_a1',
        email: 'student@campus.ac.in',
        display_name: 'Student One',
        ip_address: '192.168.1.100',
        role: 'student'
      }
    };

    const scrubbed = scrubSentryEvent(rawEvent);

    expect(scrubbed.user.username).toBeUndefined();
    expect(scrubbed.user.email).toBeUndefined();
    expect(scrubbed.user.display_name).toBeUndefined();
    expect(scrubbed.user.ip_address).toBeUndefined();
    expect(scrubbed.user.id).toBe('00000000-0000-0000-0001-000000000001');
    expect(scrubbed.user.role).toBe('student');
  });

  it('scrubs query strings from breadcrumb URLs to prevent token leakage', () => {
    const rawEvent = {
      breadcrumbs: [
        {
          category: 'navigation',
          data: { url: 'https://stips.campus/app/feed?token=sensitive-invite-code' }
        },
        {
          category: 'xhr',
          data: { url: '/api/posts?before=2026-11-17T00:00:00Z&key=secret' }
        }
      ]
    };

    const scrubbed = scrubSentryEvent(rawEvent);

    expect(scrubbed.breadcrumbs[0].data.url).toBe('/app/feed');
    expect(scrubbed.breadcrumbs[1].data.url).toBe('/api/posts');
  });
});
