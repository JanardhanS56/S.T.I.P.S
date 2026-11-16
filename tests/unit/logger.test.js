import { describe, it, expect, vi } from 'vitest';
import { Writable } from 'node:stream';
import { createLogger, createHttpLogger } from '../../server/logger.js';
import { errorHandler, HttpError } from '../../server/http.js';

class MemoryStream extends Writable {
  constructor() {
    super();
    this.lines = [];
  }

  _write(chunk, _encoding, callback) {
    this.lines.push(chunk.toString());
    callback();
  }

  getLastJson() {
    if (!this.lines.length) return null;
    return JSON.parse(this.lines[this.lines.length - 1]);
  }
}

describe('Structured logging and redaction (D1-12)', () => {
  it('redacts sensitive headers, body, and passwords from logs', () => {
    const stream = new MemoryStream();
    const testLogger = createLogger({ level: 'info' }, stream);

    testLogger.info({
      req: {
        headers: {
          authorization: 'Bearer secret-jwt-token',
          cookie: 'stips_session=session.cookie.here',
          host: 'localhost:3001'
        },
        body: {
          password: 'plain-password-123',
          current: 'current-secret',
          next: 'next-secret'
        }
      },
      res: {
        headers: {
          'set-cookie': 'stips_session=new-cookie-val'
        }
      },
      token: 'raw-token-123'
    });

    const parsed = stream.getLastJson();
    expect(parsed.req.headers.authorization).toBe('[REDACTED]');
    expect(parsed.req.headers.cookie).toBe('[REDACTED]');
    expect(parsed.res.headers['set-cookie']).toBe('[REDACTED]');
    expect(parsed.req.body).toBe('[REDACTED]');
    expect(parsed.token).toBe('[REDACTED]');
    expect(parsed.req.headers.host).toBe('localhost:3001');
  });

  it('generates a request id when x-request-id is missing and sets response header', () => {
    const headersSet = {};
    const req = {
      headers: {},
      method: 'GET',
      url: '/api/health'
    };
    const res = {
      setHeader(name, val) {
        headersSet[name] = val;
      },
      on: vi.fn()
    };

    const middleware = createHttpLogger();
    let nextCalled = false;
    middleware(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(req.id).toBeDefined();
    expect(typeof req.id).toBe('string');
    expect(headersSet['X-Request-Id']).toBe(req.id);
  });

  it('preserves client-supplied x-request-id', () => {
    const customId = 'client-req-id-12345';
    const headersSet = {};
    const req = {
      headers: { 'x-request-id': customId },
      method: 'GET',
      url: '/api/posts'
    };
    const res = {
      setHeader(name, val) {
        headersSet[name] = val;
      },
      on: vi.fn()
    };

    const middleware = createHttpLogger();
    middleware(req, res, () => {});

    expect(req.id).toBe(customId);
    expect(headersSet['X-Request-Id']).toBe(customId);
  });

  it('errorHandler logs error server-side with request id and returns clean 500 without internals', () => {
    const stream = new MemoryStream();
    const testLogger = createLogger({ level: 'info' }, stream);

    let responseStatus = 0;
    let responseBody = null;
    const res = {
      status(s) {
        responseStatus = s;
        return this;
      },
      json(data) {
        responseBody = data;
        return this;
      }
    };

    const req = {
      id: 'req-err-456',
      log: testLogger
    };

    const internalError = new Error('Database connection failed on secret host db.internal:5432');
    errorHandler(internalError, req, res);

    expect(responseStatus).toBe(500);
    expect(responseBody).toEqual({ error: 'Something went wrong. Please try again.' });
    expect(responseBody.error).not.toContain('Database connection failed');

    const logEntry = stream.getLastJson();
    expect(logEntry.reqId).toBe('req-err-456');
    expect(logEntry.msg).toBe('Unhandled server error');
    expect(logEntry.err.message).toBe('Database connection failed on secret host db.internal:5432');
  });

  it('errorHandler returns status and message for HttpError without logging as unhandled 500', () => {
    let responseStatus = 0;
    let responseBody = null;
    const res = {
      status(s) {
        responseStatus = s;
        return this;
      },
      json(data) {
        responseBody = data;
        return this;
      }
    };

    const httpErr = new HttpError(404, 'Post not found.');
    errorHandler(httpErr, {}, res);

    expect(responseStatus).toBe(404);
    expect(responseBody).toEqual({ error: 'Post not found.' });
  });
});
