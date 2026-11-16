import { describe, it, expect } from 'vitest';
import { validatePassword } from '../../server/lib/passwordPolicy.js';

describe('Password Policy Unit Tests (AUTH-07, AUTH-08)', () => {
  it('rejects passwords shorter than 10 characters', () => {
    const res = validatePassword('short123', 'student1');
    expect(res.valid).toBe(false);
    expect(res.reason).toBe('Use at least 10 characters.');
  });

  it('rejects passwords longer than 100 characters', () => {
    const longPass = 'a'.repeat(101);
    const res = validatePassword(longPass, 'student1');
    expect(res.valid).toBe(false);
    expect(res.reason).toBe('Password must not exceed 100 characters.');
  });

  it('AUTH-08: rejects passwords identical to the username (case-insensitive)', () => {
    expect(validatePassword('student_a1', 'student_a1').valid).toBe(false);
    expect(validatePassword('STUDENT_A1', 'student_a1').valid).toBe(false);
    expect(validatePassword('admin.principal', 'admin.principal').reason).toBe(
      'Password cannot be identical to your username.'
    );
  });

  it('AUTH-08: rejects passwords found in the top 100 common passwords list', () => {
    expect(validatePassword('1234567890', 'user1').valid).toBe(false);
    expect(validatePassword('password123', 'user1').valid).toBe(false);
    expect(validatePassword('stips12345', 'user1').reason).toBe(
      'Password is too common and easily guessed.'
    );
  });

  it('accepts strong passwords with 10+ characters not in common list and not matching username', () => {
    const res = validatePassword('CampusSecurePass2026!', 'student_a1');
    expect(res.valid).toBe(true);
  });
});
