export class ApiError extends Error {
  constructor(message, status = 500, retryAfter = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.retryAfter = retryAfter ? parseInt(retryAfter, 10) : null;
  }
}

// Tiny fetch wrapper. Cookies are sent automatically (same origin); we never touch tokens in JS.
async function call(method, path, body) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const retryAfter = res.headers ? res.headers.get('Retry-After') : null;
    throw new ApiError(data.error || 'Something went wrong.', res.status, retryAfter);
  }
  return data;
}
export const api = {
  get: (p) => call('GET', p),
  post: (p, b = {}) => call('POST', p, b),
  patch: (p, b) => call('PATCH', p, b),
  del: (p, b = {}) => call('DELETE', p, b),
  delete: (p, b = {}) => call('DELETE', p, b)
};
