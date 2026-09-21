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

  it('accepts pipe-separated tags from the fixed vocabulary', () => {
    const { valid, errors } = validateProductRows([
      ['name', 'base_price', 'tags'],
      ['Hoodie', '1000', 'apparel|winter|accessories'],
    ]);
    expect(errors).toEqual([]);
    expect(valid[0].tags).toEqual(['apparel', 'winter', 'accessories']);
  });

  it('rejects unknown tags and more than 3 tags', () => {
    const bad = validateProductRows([
      ['name', 'base_price', 'tags'],
      ['Weird', '100', 'apparel|nonsense'],
    ]);
    expect(bad.valid).toHaveLength(0);
    expect(bad.errors[0]).toMatch(/unknown tags/);

    const many = validateProductRows([
      ['name', 'base_price', 'tags'],
      ['Crowded', '100', 'apparel|winter|accessories|travel'],
    ]);
    expect(many.valid).toHaveLength(0);
    expect(many.errors[0]).toMatch(/at most 3 tags/);
  });

  it('works without a tags column (backwards compatible)', () => {
    const { valid, errors } = validateProductRows([['name', 'base_price'], ['Plain', '500']]);
    expect(errors).toEqual([]);
    expect(valid[0].tags).toEqual([]);
  });

  it('parses an optional cost_price column', () => {
    const { valid, errors } = validateProductRows([
      ['name', 'base_price', 'cost_price'],
      ['Hoodie', '1620', '1350'],
      ['Bad', '100', '-5'],
    ]);
    expect(errors).toHaveLength(1);
    expect(valid[0].cost_price).toBe(1350);
    const nocost = validateProductRows([['name', 'base_price'], ['Plain', '500']]);
    expect(nocost.valid[0].cost_price).toBeNull();
  });

  it('parses an optional brand column (blank = unbranded)', () => {
    const { valid, errors } = validateProductRows([
      ['name', 'base_price', 'brand'],
      ['Buds', '2000', 'Anker'],
      ['Mystery', '500', ''],
    ]);
    expect(errors).toEqual([]);
    expect(valid[0].brand).toBe('Anker');
    expect(valid[1].brand).toBe('');
    const nobrand = validateProductRows([['name', 'base_price'], ['Plain', '500']]);
    expect(nobrand.valid[0].brand).toBe('');
  });
});
