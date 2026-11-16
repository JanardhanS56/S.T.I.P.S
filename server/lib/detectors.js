const PHONE = /(?:\+?\d[\s().-]*){8,}/;
const STANDARD_EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const SPELLED_EMAIL =
  /[a-z0-9._%+-]+\s*(?:@|\[at\]|\(at\)|\bat\b)\s*[a-z0-9.-]+\s*(?:\.|\(dot\)|\[dot\]|\bdot\b)\s*(?:com|org|edu|gov|net|co|io|in|info|me)\b/i;
const SOCIAL_HANDLE =
  /\b(?:ig|insta|instagram|snap|snapchat|telegram|tg|wa|whatsapp|discord)\s*(?:[:@-]\s*|\s+)@?[a-z0-9._]{3,}\b|\b(?:dm|message|ping|text|reach)\s+(?:me\s+)?(?:on|at)\s+@?[a-z0-9._]{3,}\b/i;

export function hasContactInfo(text) {
  if (!text) return false;
  return (
    PHONE.test(text) ||
    STANDARD_EMAIL.test(text) ||
    SPELLED_EMAIL.test(text) ||
    SOCIAL_HANDLE.test(text)
  );
}
