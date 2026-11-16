import { config } from '../config.js';

export function checkRepetition(text, limits = config.spam) {
  if (!text) return { ok: true };
  const maxChars = limits?.maxRepeatedChars ?? 6;
  const charRegex = new RegExp(`(.)\\1{${maxChars - 1},}`);
  if (charRegex.test(text)) {
    return { ok: false, reason: 'Please avoid excessive repetitive characters.' };
  }

  const maxWords = limits?.maxRepeatedWords ?? 4;
  const wordRegex = new RegExp(`\\b(\\w+)(?:\\s+\\1){${maxWords - 1},}\\b`, 'i');
  if (wordRegex.test(text)) {
    return { ok: false, reason: 'Please avoid repetitive words.' };
  }

  return { ok: true };
}

export function checkAllCaps(text, limits = config.spam) {
  if (!text) return { ok: true };
  const minLength = limits?.allCapsMinLength ?? 10;
  const maxRatio = limits?.allCapsRatio ?? 0.7;

  const alpha = text.replace(/[^a-zA-Z]/g, '');
  if (alpha.length >= minLength) {
    const uppercase = text.replace(/[^A-Z]/g, '');
    if (uppercase.length / alpha.length >= maxRatio) {
      return { ok: false, reason: 'Please avoid excessive ALL CAPS text.' };
    }
  }

  return { ok: true };
}

export function checkLinks(text, limits = config.spam) {
  if (!text) return { ok: true };
  if (limits?.allowLinks) return { ok: true };

  const LINK_REGEX =
    /(?:https?:\/\/|www\.)\S+|(?:bit\.ly|t\.co|tinyurl\.com|goo\.gl|ow\.ly|is\.gd|buff\.ly|rebrand\.ly)\/\S+/i;

  if (LINK_REGEX.test(text)) {
    return { ok: false, reason: 'Links and URLs are not permitted in v1.' };
  }

  return { ok: true };
}

export function checkSpam(text, limits = config.spam) {
  const rep = checkRepetition(text, limits);
  if (!rep.ok) return rep;
  const caps = checkAllCaps(text, limits);
  if (!caps.ok) return caps;
  const links = checkLinks(text, limits);
  if (!links.ok) return links;
  return { ok: true };
}
