// Run by whoever operates the platform (not through the website):
//   npm run create-admin -- "Institute Name" "Principal Name"
// Creates a community plus its first admin (principal/office) and prints the sign-in details once.
import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import { db } from '../server/db.js';
import { slug } from '../server/lib/slug.js';

const [instituteName, adminName] = process.argv.slice(2);
if (!instituteName || !adminName) {
  console.error('Usage: npm run create-admin -- "Institute Name" "Principal Name"');
  process.exit(1);
}
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const pick = (n) => Array.from({ length: n }, () => CHARS[randomInt(CHARS.length)]).join('');
const code = `${pick(4)}-${pick(4)}`;
const password = pick(12);
const username = slug(adminName) || 'admin';

const { data: community, error: e1 } = await db
  .from('communities')
  .insert({ name: instituteName, code })
  .select()
  .single();
if (e1) throw e1;
const { error: e2 } = await db.from('users').insert({
  community_id: community.id,
  username,
  display_name: adminName,
  role: 'admin',
  password_hash: await bcrypt.hash(password, 10),
  must_change_password: true
});
if (e2) throw e2;
console.log(
  `\nCommunity : ${instituteName}\nCode      : ${code}\nUsername  : ${username}\nPassword  : ${password}\n\nSave these now. The password cannot be shown again.\n`
);
