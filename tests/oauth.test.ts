import { describe, expect, it } from 'vitest';
import { oauthRedirectTo, safeNextPath } from '../src/lib/oauth';

describe('oauth redirect construction', () => {
  it('passes through legitimate in-app paths', () => {
    expect(safeNextPath('/account')).toBe('/account');
    expect(safeNextPath('/checkout')).toBe('/checkout');
    expect(safeNextPath('/shop?sort=new')).toBe('/shop?sort=new');
  });

  it('collapses hostile or malformed input to the fallback', () => {
    expect(safeNextPath('https://evil.com')).toBe('/account');
    expect(safeNextPath('//evil.com/x')).toBe('/account');
    expect(safeNextPath('/\\evil.com')).toBe('/account');
    expect(safeNextPath('')).toBe('/account');
    expect(safeNextPath(null)).toBe('/account');
    expect(safeNextPath(undefined)).toBe('/account');
    expect(safeNextPath('x'.repeat(500))).toBe('/account');
  });

  it('never lets emails, profiles, or identifiers become a destination', () => {
    expect(oauthRedirectTo('https://dropx.vercel.app', 'someone@gmail.com')).toBe(
      'https://dropx.vercel.app/account'
    );
    expect(oauthRedirectTo('https://dropx.vercel.app', '/account someone@gmail.com')).toBe(
      'https://dropx.vercel.app/account'
    );
    expect(oauthRedirectTo('https://dropx.vercel.app', '/u/someone@gmail.com')).toBe(
      'https://dropx.vercel.app/account'
    );
    const out = oauthRedirectTo('https://dropx.vercel.app', 'someone@gmail.com');
    expect(out).not.toContain('@');
    expect(out).not.toContain('gmail');
  });

  it('faithfully returns to whichever origin started the flow', () => {
    // Documenting intended behavior: preview deployments keep working,
    // and the app never invents a host — it echoes the browser origin.
    expect(oauthRedirectTo('https://dropx-preview-1.vercel.app', '/account')).toBe(
      'https://dropx-preview-1.vercel.app/account'
    );
  });
});
