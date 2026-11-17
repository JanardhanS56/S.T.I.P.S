import http from 'node:http';
import https from 'node:https';
import process from 'node:process';

export async function runProductionSmoke(targetUrl) {
  const url = targetUrl || process.env.SMOKE_URL || 'http://localhost:3001';
  console.log('='.repeat(55));
  console.log(`  S.T.I.P.S Production Smoke Test`);
  console.log(`  Target: ${url}`);
  console.log('='.repeat(55));

  const checks = [
    {
      name: 'Health check (/api/health)',
      path: '/api/health',
      expectedStatus: 200,
      checkBody: (b) => b.includes('"ok":true') && b.includes('"db":true')
    },
    {
      name: 'Root document (/)',
      path: '/',
      expectedStatus: 200,
      checkBody: (b) => b.includes('S.T.I.P.S')
    },
    {
      name: 'Privacy policy (/privacy)',
      path: '/privacy',
      expectedStatus: 200,
      checkBody: (b) => b.includes('Privacy Policy') || b.includes('S.T.I.P.S')
    },
    {
      name: 'Terms of Use (/terms)',
      path: '/terms',
      expectedStatus: 200,
      checkBody: (b) => b.includes('Terms') || b.includes('S.T.I.P.S')
    },
    {
      name: 'Protected route reject (/api/posts)',
      path: '/api/posts',
      expectedStatus: 401,
      checkBody: (b) =>
        b.includes('sign in') || b.includes('Unauthorized') || b.includes('unauthorized')
    }
  ];

  let passed = 0;
  for (const c of checks) {
    const fullUrl = new URL(c.path, url);
    const client = fullUrl.protocol === 'https:' ? https : http;

    const res = await new Promise((resolve, reject) => {
      const req = client.get(fullUrl, (r) => {
        let body = '';
        r.on('data', (chunk) => (body += chunk));
        r.on('end', () => resolve({ status: r.statusCode, headers: r.headers, body }));
      });
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });
    });

    const statusMatch = res.status === c.expectedStatus;
    const bodyMatch = c.checkBody ? c.checkBody(res.body) : true;

    if (statusMatch && bodyMatch) {
      console.log(`  ✓ ${c.name} (HTTP ${res.status})`);
      passed++;
    } else {
      console.error(`  ✖ ${c.name} FAILED! Status: ${res.status} (expected ${c.expectedStatus})`);
      if (!bodyMatch) {
        console.error(`    Body payload mismatch: ${res.body.slice(0, 200)}`);
      }
    }
  }

  console.log('='.repeat(55));
  console.log(`Smoke test results: ${passed} / ${checks.length} passed.`);
  return passed === checks.length;
}

const isDirect =
  process.argv[1] &&
  (process.argv[1].endsWith('smoke-test.js') || process.argv[1].includes('smoke-test'));
if (isDirect) {
  const target = process.argv[2] || process.env.SMOKE_URL;
  runProductionSmoke(target)
    .then((success) => process.exit(success ? 0 : 1))
    .catch((err) => {
      console.error('Smoke runner failed:', err);
      process.exit(1);
    });
}
