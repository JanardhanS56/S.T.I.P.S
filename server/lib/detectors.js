const PHONE = /(?:\+?\d[\s().-]*){8,}/;
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;

export function hasContactInfo(text) {
  if (!text) return false;
  return PHONE.test(text) || EMAIL.test(text);
}
