export function normalise(t) {
  if (!t) return '';
  return t
    .toLowerCase()
    .replace(/[@4]/g, 'a')
    .replace(/[1!|]/g, 'i')
    .replace(/0/g, 'o')
    .replace(/\$/g, 's')
    .replace(/[^a-z\s]/g, '');
}
