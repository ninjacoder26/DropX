import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { appOrigin, canonicalRedirectFor, oauthRedirectTo, safeNextPath } from '../src/lib/oauth';

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

describe('hardcoded production origin', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('always points at production, except localhost dev', () => {
    vi.stubGlobal('window', { location: { origin: 'https://dropx-ninjacoder26.vercel.app' } });
    expect(appOrigin()).toBe('https://dropxnepal.vercel.app');
    vi.stubGlobal('window', { location: { origin: 'https://dropxnepal.vercel.app' } });
    expect(appOrigin()).toBe('https://dropxnepal.vercel.app');
    vi.stubGlobal('window', { location: { origin: 'http://localhost:5173' } });
    expect(appOrigin()).toBe('http://localhost:5173');
    vi.stubGlobal('window', { location: { origin: 'http://127.0.0.1:4177' } });
    expect(appOrigin()).toBe('http://127.0.0.1:4177');
  });
});

describe('canonical host enforcement', () => {
  it('bounces only retired hosts to dropxnepal', () => {
    expect(canonicalRedirectFor('dropx-ninjacoder26.vercel.app')).toBe('dropxnepal.vercel.app');
    expect(canonicalRedirectFor('DROPX-NINJACODER26.VERCEL.APP')).toBe('dropxnepal.vercel.app');
  });

  it('leaves everything else alone', () => {
    expect(canonicalRedirectFor('dropxnepal.vercel.app')).toBeNull();
    expect(canonicalRedirectFor('localhost')).toBeNull();
    expect(canonicalRedirectFor('127.0.0.1')).toBeNull();
    expect(canonicalRedirectFor('dropx-git-main-ninjacoder26.vercel.app')).toBeNull();
    expect(canonicalRedirectFor('evil-dropx-ninjacoder26.vercel.app.evil.com')).toBeNull();
    expect(canonicalRedirectFor('')).toBeNull();
  });
});
