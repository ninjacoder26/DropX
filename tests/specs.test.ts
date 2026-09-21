import { describe, expect, it } from 'vitest';
import { specLabel } from '../src/components/product';

describe('spec labels', () => {
  it('humanizes snake_case keys', () => {
    expect(specLabel('brand')).toBe('Brand');
    expect(specLabel('water_resistance')).toBe('Water Resistance');
    expect(specLabel('print_width')).toBe('Print Width');
  });
});
