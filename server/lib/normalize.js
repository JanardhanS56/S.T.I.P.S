const ZERO_WIDTH_REGEX = /[\u200B-\u200F\u202A-\u202E\u2060\uFEFF\u00AD]/g;

export function stripZeroWidth(text) {
  if (!text) return '';
  return text.replace(ZERO_WIDTH_REGEX, '');
}

const HOMOGLYPHS = {
  // Cyrillic lookalikes
  '\u0430': 'a',
  '\u0410': 'a',
  '\u0435': 'e',
  '\u0415': 'e',
  '\u043E': 'o',
  '\u041E': 'o',
  '\u0440': 'p',
  '\u0420': 'p',
  '\u0441': 'c',
  '\u0421': 'c',
  '\u0443': 'y',
  '\u0423': 'y',
  '\u0445': 'x',
  '\u0425': 'x',
  '\u0456': 'i',
  '\u0406': 'i',
  // Common symbols and leetspeak
  '@': 'a',
  4: 'a',
  8: 'b',
  '(': 'c',
  3: 'e',
  '€': 'e',
  1: 'i',
  '!': 'i',
  '|': 'i',
  '¡': 'i',
  0: 'o',
  $: 's',
  5: 's',
  7: 't',
  '+': 't'
};

export function replaceHomoglyphs(text) {
  if (!text) return '';
  const normalized = text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  let out = '';
  for (const ch of normalized) {
    out += HOMOGLYPHS[ch] || ch;
  }
  return out;
}

export function collapseRepeats(word) {
  if (!word) return '';
  return word.replace(/(.)\1+/gu, '$1');
}

export function despaceRuns(text) {
  if (!text) return '';
  return text.replace(/\b([a-z])(?:\s+([a-z]))+\b/gi, (match) => {
    const letters = match.split(/\s+/);
    if (letters.length >= 2) {
      if ((letters[0] === 'a' || letters[0] === 'i') && letters.length >= 4) {
        return letters[0] + ' ' + letters.slice(1).join('');
      }
      return letters.join('');
    }
    return match;
  });
}

export function normalise(text) {
  if (!text) return '';
  const cleaned = stripZeroWidth(text);
  const unhomoglyph = replaceHomoglyphs(cleaned).toLowerCase();
  return unhomoglyph.replace(/[^a-z\s]/g, ' ');
}
