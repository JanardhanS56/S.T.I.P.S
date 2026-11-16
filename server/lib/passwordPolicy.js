import { COMMON_PASSWORDS } from './commonPasswords.js';

export function validatePassword(password, username = '') {
  if (typeof password !== 'string' || password.length < 10) {
    return { valid: false, reason: 'Use at least 10 characters.' };
  }
  if (password.length > 100) {
    return { valid: false, reason: 'Password must not exceed 100 characters.' };
  }
  const cleanPass = password.trim().toLowerCase();
  const cleanUser = (username || '').trim().toLowerCase();

  if (cleanUser && cleanPass === cleanUser) {
    return { valid: false, reason: 'Password cannot be identical to your username.' };
  }

  if (COMMON_PASSWORDS.has(cleanPass)) {
    return { valid: false, reason: 'Password is too common and easily guessed.' };
  }

  return { valid: true };
}
