import { describe, it, expect } from 'vitest';
import { localCheck, hasContactInfo, checkSpam } from '../../server/moderation.js';
import { checkRepetition, checkAllCaps, checkLinks } from '../../server/lib/spam.js';

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
      expect(localCheck('what a s.t.u.p.i.d idea').ok).toBe(false);
    });

    it('blocks zero-width character evasion (zero-width space, soft hyphen)', () => {
      expect(localCheck('You are an id\u200biot').ok).toBe(false);
      expect(localCheck('You are an id\u00ADiot').ok).toBe(false);
    });

    it('blocks Cyrillic and homoglyph substitutions', () => {
      expect(localCheck('You are an \u0456d\u0456ot').ok).toBe(false);
      expect(localCheck('\u0455tupid nonsense').ok).toBe(false);
    });

    it('blocks collapsed repeats evasion (idddiot, stuuuupid)', () => {
      expect(localCheck('You are an idddddiooooot').ok).toBe(false);
      expect(localCheck('That is stuuuupid').ok).toBe(false);
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
      expect(localCheck('The shuttle bus arrives at noon').ok).toBe(true);
      expect(localCheck('Please close the shutter behind you').ok).toBe(true);
      expect(localCheck('Come closer to the front stage').ok).toBe(true);
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

    it('detects spelled-out email addresses (at / dot variants)', () => {
      expect(hasContactInfo('reach me at student [at] campus [dot] edu')).toBe(true);
      expect(hasContactInfo('send notes to student at gmail dot com')).toBe(true);
      expect(hasContactInfo('contact me: user(at)domain(dot)org')).toBe(true);
    });

    it('detects social media handle sharing patterns (ig, snap, telegram, dm me)', () => {
      expect(hasContactInfo('Follow my photography on ig: @campus_snaps')).toBe(true);
      expect(hasContactInfo('Hit me up on snap: partyguy99')).toBe(true);
      expect(hasContactInfo('Reach me on telegram: @sameer')).toBe(true);
      expect(hasContactInfo('dm me on @cool_student')).toBe(true);
    });

    it('allows normal text without contact info', () => {
      expect(hasContactInfo('Join us in hall 4 at 3 PM for the tech talk')).toBe(false);
      expect(hasContactInfo('Assignment 1 is due on Friday')).toBe(false);
      expect(hasContactInfo('Testing client supplied ids ignored')).toBe(false);
      expect(hasContactInfo('Are client ids ignored?')).toBe(false);
      expect(hasContactInfo('Instant coffee in the canteen')).toBe(false);
    });
  });

  describe('Spam Heuristics Unit Tests (Repetition, ALL CAPS, Link count)', () => {
    describe('checkRepetition', () => {
      it('rejects 6 or more identical consecutive characters', () => {
        expect(checkRepetition('Hellooooooo everyone').ok).toBe(false);
        expect(checkRepetition('No way!!!!!!!!').ok).toBe(false);
        expect(checkRepetition('Why??????').ok).toBe(false);
      });

      it('rejects 4 or more identical consecutive words', () => {
        expect(checkRepetition('free free free free stuff').ok).toBe(false);
        expect(checkRepetition('spam spam spam spam').ok).toBe(false);
      });

      it('allows acceptable repetitions', () => {
        expect(checkRepetition('Good book and cool food').ok).toBe(true);
        expect(checkRepetition('ha ha ha').ok).toBe(true);
      });
    });

    describe('checkAllCaps', () => {
      it('rejects text with >= 70% uppercase when length >= 10', () => {
        expect(checkAllCaps('THIS IS AN URGENT NOTICE EVERYONE MUST READ').ok).toBe(false);
        expect(checkAllCaps('WHY ARE WE SHOUTING HERE').ok).toBe(false);
      });

      it('allows normal casing and mixed case', () => {
        expect(checkAllCaps('Welcome to the Annual Science Exhibition 2026').ok).toBe(true);
        expect(checkAllCaps('Library closes at 8 PM sharp today!').ok).toBe(true);
      });

      it('allows short acronyms and abbreviations under length threshold', () => {
        expect(checkAllCaps('OMG YES!').ok).toBe(true);
        expect(checkAllCaps('NASA / ISRO').ok).toBe(true);
      });
    });

    describe('checkLinks', () => {
      it('rejects http and https URLs in v1', () => {
        expect(checkLinks('Visit https://example.com for more info').ok).toBe(false);
        expect(checkLinks('Click here http://sketchy.site/deal').ok).toBe(false);
      });

      it('rejects www URLs and common URL shorteners', () => {
        expect(checkLinks('Check out www.campus-portal.org').ok).toBe(false);
        expect(checkLinks('Join bit.ly/3xyz for notes').ok).toBe(false);
        expect(checkLinks('Check tinyurl.com/meeting123').ok).toBe(false);
      });

      it('allows regular text containing periods without valid URLs', () => {
        expect(checkLinks('Meeting starts at 4 p.m. in room 302. Bring your notes.').ok).toBe(true);
      });
    });

    describe('checkSpam pipeline', () => {
      it('rejects spam across any triggered heuristic', () => {
        expect(checkSpam('FREE FREE FREE FREE OFFERS').ok).toBe(false);
        expect(checkSpam('CHECK OUT https://spam.org NOW').ok).toBe(false);
        expect(checkSpam('NOOOOOOO WAY').ok).toBe(false);
      });

      it('allows clean messages', () => {
        expect(checkSpam('Looking for study group partners for Physics 101').ok).toBe(true);
      });
    });
  });
});
