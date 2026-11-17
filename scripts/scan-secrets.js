import { execSync } from 'child_process';

console.log('Running secret scan on git history...');
const log = execSync('git log -p', { maxBuffer: 100 * 1024 * 1024, cwd: process.cwd() }).toString();

const patterns = [
  {
    name: 'JWT / Service Role Key',
    regex: /eyJhbGciOi[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g
  },
  { name: 'Private Key', regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  {
    name: 'Supabase Key Assignment',
    regex: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"]?[a-zA-Z0-9_.-]{20,}['"]?/g
  },
  {
    name: 'Upstash Token Assignment',
    regex: /UPSTASH_REDIS_REST_TOKEN\s*=\s*['"]?[a-zA-Z0-9_.-]{20,}['"]?/g
  },
  { name: 'Sentry DSN Assignment', regex: /https:\/\/[a-f0-9]+@[a-z0-9.-]+\/[0-9]+/g }
];

let totalFindings = 0;
for (const p of patterns) {
  const matches = log.match(p.regex) || [];
  // Filter out any false positives or test mocks if needed
  const validMatches = matches.filter((m) => {
    // ignore example or placeholder strings
    if (
      m.includes('YOUR-PROJECT') ||
      m.includes('your-supabase-service-role-key') ||
      m.includes('placeholder') ||
      m.includes('undefined') ||
      m.includes('test-service-role-key')
    )
      return false;
    return true;
  });
  console.log(`- ${p.name}: ${validMatches.length} matches`);
  if (validMatches.length > 0) {
    totalFindings += validMatches.length;
    console.log(`  Found:`, validMatches.slice(0, 3));
  }
}

if (totalFindings === 0) {
  console.log('✅ Clean: No secrets detected in git history.');
  process.exit(0);
} else {
  console.error(`❌ Warning: ${totalFindings} potential secrets detected in git history.`);
  process.exit(1);
}
