import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DISTRICT,
  VALLEY_DISTRICTS,
  districtOfArea,
  isGuidedComplete,
} from '../src/lib/address';

describe('guided Valley addresses', () => {
  it('covers exactly the three Valley districts', () => {
    expect(VALLEY_DISTRICTS.map((d) => d.name)).toEqual(['Kathmandu', 'Lalitpur', 'Bhaktapur']);
    for (const d of VALLEY_DISTRICTS) {
      expect(d.areas.length).toBeGreaterThanOrEqual(10);
    }
    expect(DEFAULT_DISTRICT).toBe('Kathmandu');
  });

  it('keeps area names unique so districts are always recoverable', () => {
    const all = VALLEY_DISTRICTS.flatMap((d) => d.areas.map((a) => a.toLowerCase()));
    expect(new Set(all).size).toBe(all.length);
    expect(districtOfArea('Thamel')).toBe('Kathmandu');
    expect(districtOfArea('Jhamsikhel')).toBe('Lalitpur');
    expect(districtOfArea('Thimi')).toBe('Bhaktapur');
    expect(districtOfArea('Pokhara')).toBeNull();
  });

  it('validates completeness (area + street, nothing more)', () => {
    expect(isGuidedComplete({ district: 'Kathmandu', area: 'Thamel', street: 'House 1, Main Rd', postal_code: '' })).toBe(true);
    expect(isGuidedComplete({ district: 'Kathmandu', area: '', street: 'House 1, Main Rd', postal_code: '' })).toBe(false);
    expect(isGuidedComplete({ district: 'Kathmandu', area: 'Thamel', street: 'ab', postal_code: '' })).toBe(false);
  });
});
