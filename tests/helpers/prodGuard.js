import process from 'node:process';

// Invariant: Tests and test seeds refuse to run against production database
export function guardAgainstProduction(supabaseUrl, nodeEnv = process.env.NODE_ENV) {
  if (nodeEnv === 'production') {
    throw new Error('FATAL: Operation cannot run in production mode (NODE_ENV=production).');
  }

  const approvedTarget = process.env.APPROVED_TEST_SUPABASE_URL;
  if (!supabaseUrl || !approvedTarget) {
    throw new Error(
      'FATAL: SUPABASE_URL and APPROVED_TEST_SUPABASE_URL are required to verify a test database.'
    );
  }

  let targetUrl;
  let approvedUrl;
  try {
    targetUrl = new URL(supabaseUrl);
    approvedUrl = new URL(approvedTarget);
  } catch {
    throw new Error('FATAL: SUPABASE_URL or APPROVED_TEST_SUPABASE_URL is invalid.');
  }

  const isAllowedUrl = (url) =>
    (url.protocol === 'https:' && url.hostname.endsWith('.supabase.co')) ||
    (url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname));
  if (!isAllowedUrl(targetUrl) || !isAllowedUrl(approvedUrl)) {
    throw new Error(
      'FATAL: Test database URLs must be Supabase HTTPS URLs or local development URLs.'
    );
  }

  if (targetUrl.origin !== approvedUrl.origin) {
    throw new Error('FATAL: SUPABASE_URL does not match the explicitly approved test database.');
  }

  if (process.env.PROD_SUPABASE_URL) {
    let prodUrl;
    try {
      prodUrl = new URL(process.env.PROD_SUPABASE_URL);
    } catch {
      throw new Error('FATAL: PROD_SUPABASE_URL is invalid.');
    }
    if (targetUrl.origin === prodUrl.origin) {
      throw new Error('FATAL: SUPABASE_URL matches PROD_SUPABASE_URL. Operation aborted.');
    }
  }
}
