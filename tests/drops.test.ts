import { describe, expect, it } from 'vitest';
import { dropState } from '../src/types';

const drop = (starts_at: string, ends_at: string) => ({ starts_at, ends_at });
const now = new Date('2026-09-21T12:00:00Z');

describe('dropState — derived from dates, never hardcoded', () => {
  it('is upcoming before starts_at', () => {
    expect(dropState(drop('2026-10-01T00:00:00Z', '2026-10-31T00:00:00Z'), now)).toBe('upcoming');
  });

  it('is active between starts_at and ends_at (inclusive edges)', () => {
    expect(dropState(drop('2026-09-01T00:00:00Z', '2026-09-30T00:00:00Z'), now)).toBe('active');
    expect(dropState(drop(now.toISOString(), '2026-09-30T00:00:00Z'), now)).toBe('active');
  });

  it('is ended after ends_at', () => {
    expect(dropState(drop('2026-08-01T00:00:00Z', '2026-08-31T00:00:00Z'), now)).toBe('ended');
  });
});
