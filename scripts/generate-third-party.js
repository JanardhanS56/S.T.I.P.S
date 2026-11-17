import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Generating docs/THIRD_PARTY.md...');
const jsonStr = execSync('npx --yes license-checker --json --production', {
  maxBuffer: 50 * 1024 * 1024,
  cwd: process.cwd()
}).toString();

const data = JSON.parse(jsonStr);

// Collect license types summary
const licenseCounts = {};
const entries = [];

for (const [pkg, info] of Object.entries(data)) {
  if (pkg.startsWith('stips@')) continue; // skip own package
  const lic = info.licenses || 'Unknown';
  licenseCounts[lic] = (licenseCounts[lic] || 0) + 1;
  entries.push({
    name: pkg,
    license: lic,
    repository: info.repository || '',
    publisher: info.publisher || ''
  });
}

entries.sort((a, b) => a.name.localeCompare(b.name));

let md = `# Third-Party Software and Licenses

This page documents the third-party open-source software libraries utilized in the production runtime of **S.T.I.P.S (Student-Teacher Interaction & Polling System)**.

## License Summary

| License Type | Package Count |
| :--- | :--- |
`;

for (const [lic, count] of Object.entries(licenseCounts).sort((a, b) => b[1] - a[1])) {
  md += `| ${lic} | ${count} |\n`;
}

md += `
## Production Dependencies

| Package | License | Repository |
| :--- | :--- | :--- |
`;

for (const e of entries) {
  const repoLink = e.repository ? `[Source](${e.repository})` : '—';
  md += `| \`${e.name}\` | ${e.license} | ${repoLink} |\n`;
}

md += `
---
*Generated with \`license-checker\` for S.T.I.P.S v0.1.0 release compliance.*
`;

const outPath = path.join(process.cwd(), 'docs', 'THIRD_PARTY.md');
fs.writeFileSync(outPath, md, 'utf8');
console.log(`Successfully wrote ${entries.length} packages to ${outPath}`);
