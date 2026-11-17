// Family-friendly screening. Three layers:
//  1. A word filter (server/blocklist.txt) - instant, free, always on.
//  2. Contact-info blocking - phone numbers and emails never travel through the platform.
//  3. Optional AI check through any OpenAI-compatible API (Groq, OpenRouter, NVIDIA).
// Everything is also reportable by users and reviewable by the office.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normalise, collapseRepeats, despaceRuns } from './lib/normalize.js';
import { hasContactInfo } from './lib/detectors.js';
import { checkSpam } from './lib/spam.js';
import { checkLlm } from './lib/llm.js';
import {
  recordRejection,
  getRejectionCount,
  clearRejections,
  handleRejection
} from './lib/rejections.js';

export {
  hasContactInfo,
  checkSpam,
  checkLlm,
  recordRejection,
  getRejectionCount,
  clearRejections,
  handleRejection
};

const listPath = fileURLToPath(new URL('./blocklist.txt', import.meta.url));
const BLOCKED = readFileSync(listPath, 'utf8')
  .split('\n')
  .map((w) => w.trim().toLowerCase())
  .filter((w) => w && !w.startsWith('#'));

export function localCheck(text) {
  if (!text) return { ok: true };
  const rawWords = normalise(text).split(/\s+/).filter(Boolean);
  const despacedText = despaceRuns(normalise(text));
  const despacedWords = despacedText.split(/\s+/).filter(Boolean);
  const allWords = new Set([...rawWords, ...despacedWords]);

  const hit = BLOCKED.some((b) => {
    const collapsedB = collapseRepeats(b);
    for (const w of allWords) {
      if (w === b || collapseRepeats(w) === collapsedB) return true;
    }
    return false;
  });
  return hit
    ? { ok: false, reason: 'Please keep it respectful and family-friendly.' }
    : { ok: true };
}

export async function screen(text, { allowContact = false } = {}) {
  const local = localCheck(text);
  if (!local.ok) return local;
  const spam = checkSpam(text);
  if (!spam.ok) return spam;
  if (!allowContact && hasContactInfo(text)) {
    return { ok: false, reason: 'Phone numbers and email addresses are not allowed here.' };
  }
  return checkLlm(text);
}
