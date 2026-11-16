import { describe, it, expect } from 'vitest';
import { localCheck, hasContactInfo } from '../../server/moderation.js';

describe('Moderation Unit Tests (MOD-01, MOD-02, MOD-03)', () => {
  describe('MOD-01: Word filter blocks plain, leetspeak, spaced and mixed-case variants', () => {
    it('blocks plain word from blocklist', () => {
      const res = localCheck('You are an idiot');
      expect(res.ok).toBe(false);
      expect(res.reason).toBe('Please keep it respectful and family-friendly.');
    });

    it('blocks uppercase and mixed-case variants', () => {
      expect(localCheck('Totally STUPID idea').ok).toBe(false);
      expect(localCheck('what a LoSeR').ok).toBe(false);
    });

    it('blocks leetspeak substitutions (1d10t, $tupid)', () => {
      expect(localCheck('You are a 1d10t').ok).toBe(false);
      expect(localCheck('Stop being $tupid').ok).toBe(false);
    });

    it('blocks spaced letters intended to evade detection', () => {
      expect(localCheck('what a l o s e r').ok).toBe(false);
    });
  });

  describe('MOD-02: Word filter allows innocent words (Scunthorpe check)', () => {
    it('allows clean family-friendly messages', () => {
      expect(localCheck('Hello everyone, welcome to the new semester!').ok).toBe(true);
      expect(localCheck('The campus library closes at 8 PM today.').ok).toBe(true);
    });

    it('allows words containing substrings of blocked words (e.g. skill contains kill)', () => {
      expect(localCheck('Developing your coding skill is rewarding').ok).toBe(true);
      expect(localCheck('He showed great skillet work').ok).toBe(true);
    });
  });

  describe('MOD-03: Contact info detector', () => {
    it('detects 10-digit Indian and generic phone numbers', () => {
      expect(hasContactInfo('Call me at 9876543210')).toBe(true);
    });

    it('detects international phone format with country code (+91)', () => {
      expect(hasContactInfo('Reach out at +91 98765 43210')).toBe(true);
      expect(hasContactInfo('+1 (555) 234-5678')).toBe(true);
    });

    it('detects spaced digits intended to evade filter', () => {
      expect(hasContactInfo('my number is 9 8 7 6 5 4 3 2 1 0')).toBe(true);
    });

    it('detects standard email addresses', () => {
      expect(hasContactInfo('email me at student@university.edu')).toBe(true);
      expect(hasContactInfo('contact: test.user@gmail.com')).toBe(true);
    });

    it('allows normal text without contact info', () => {
      expect(hasContactInfo('Join us in hall 4 at 3 PM for the tech talk')).toBe(false);
      expect(hasContactInfo('Assignment 1 is due on Friday')).toBe(false);
    });
  });
});
