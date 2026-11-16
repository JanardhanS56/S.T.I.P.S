import { describe, it, expect } from 'vitest';
import { slug } from '../../server/lib/slug.js';

describe('Username Slug Unit Tests', () => {
  it('converts names with spaces into dot-separated lowercase usernames', () => {
    expect(slug('John Doe')).toBe('john.doe');
    expect(slug('Alice Bob Charlie')).toBe('alice.bob.charlie');
  });

  it('collapses multiple spaces and dots into single dots', () => {
    expect(slug('Jane   Ann   Smith')).toBe('jane.ann.smith');
    expect(slug('Prof..Robert...Miller')).toBe('prof.robert.miller');
  });

  it('strips leading and trailing dots or whitespace', () => {
    expect(slug(' .Alice. ')).toBe('alice');
    expect(slug('...principal...')).toBe('principal');
  });

  it('removes non-alphanumeric characters except dots', () => {
    expect(slug("Dr. O'Connor-Smith")).toBe('dr.oconnor-smith'.replace(/[^a-z0-9.]/g, ''));
    expect(slug('Student #42 (Section A)')).toBe('student.42.section.a');
  });

  it('truncates to a maximum length of 26 characters', () => {
    const longName = 'Alexander Bartholomew Montgomery III';
    const result = slug(longName);
    expect(result.length).toBeLessThanOrEqual(26);
    expect(result).toBe('alexander.bartholomew.mont');
  });

  it('handles empty, null, and non-string inputs safely without throwing', () => {
    expect(slug('')).toBe('');
    expect(slug(null)).toBe('');
    expect(slug(undefined)).toBe('');
    expect(slug(123)).toBe('');
  });
});
