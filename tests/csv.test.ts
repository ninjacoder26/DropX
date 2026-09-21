import { describe, expect, it } from 'vitest';
import { parseCSV, slugify, toCSV, validateProductRows } from '../src/lib/csv';

describe('CSV import/export', () => {
  it('parses quoted fields with commas and newlines', () => {
    const rows = parseCSV('name,description\n"Hoodie, Ember","Line one\nLine two"\nTee,Simple\n');
    expect(rows).toEqual([
      ['name', 'description'],
      ['Hoodie, Ember', 'Line one\nLine two'],
      ['Tee', 'Simple'],
    ]);
  });

  it('round-trips through toCSV', () => {
    const rows = [['a', 'b,c'], ['d"e', 'f']];
    expect(parseCSV(toCSV(rows))).toEqual(rows);
  });

  it('validates product rows and reports bad lines', () => {
    const { valid, errors } = validateProductRows([
      ['name', 'slug', 'base_price'],
      ['Hoodie', '', '3499'],
      ['', '', '100'],
      ['Tee', '', '-5'],
    ]);
    expect(valid).toHaveLength(1);
    expect(valid[0].slug).toBe('hoodie');
    expect(errors).toHaveLength(2);
  });

  it('rejects a bad header', () => {
    const { valid, errors } = validateProductRows([['nope', 'nah']]);
    expect(valid).toHaveLength(0);
    expect(errors[0]).toMatch(/Bad header/);
  });

  it('slugifies names', () => {
    expect(slugify('Himalayan Heavyweight Hoodie!')).toBe('himalayan-heavyweight-hoodie');
  });
});
