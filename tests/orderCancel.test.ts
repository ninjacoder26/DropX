import { describe, expect, it } from 'vitest';
import {
  ADMIN_CANCEL_REASONS,
  CUSTOMER_CANCEL_REASONS,
  MAX_CANCEL_REASON,
  buildCancelReason,
} from '../src/lib/orderCancel';

describe('cancel reasons', () => {
  it('returns presets directly', () => {
    expect(buildCancelReason('Changed my mind', '')).toBe('Changed my mind');
    expect(buildCancelReason(ADMIN_CANCEL_REASONS[0], 'ignored')).toBe(ADMIN_CANCEL_REASONS[0]);
  });

  it('requires custom text for Other', () => {
    expect(buildCancelReason('Other', '')).toBeNull();
    expect(buildCancelReason('Other', '  courier lost it  ')).toBe('courier lost it');
  });

  it('requires a preset at all', () => {
    expect(buildCancelReason('', 'whatever')).toBeNull();
    expect(buildCancelReason('   ', '')).toBeNull();
  });

  it('caps length at the server limit', () => {
    const long = 'x'.repeat(MAX_CANCEL_REASON + 50);
    expect(buildCancelReason('Other', long)?.length).toBe(MAX_CANCEL_REASON);
  });

  it('ships sensible preset lists', () => {
    expect(CUSTOMER_CANCEL_REASONS).toContain('Other');
    expect(ADMIN_CANCEL_REASONS).toContain('Other');
    expect(CUSTOMER_CANCEL_REASONS.length).toBeGreaterThanOrEqual(3);
  });
});
