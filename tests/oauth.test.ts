import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { canonicalRedirectFor, consumeLoginOrigin, oauthRedirectTo, rememberLoginOrigin, safeNextPath } from '../src/lib/oauth';

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

describe('login origin self-heal', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('sessionStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, String(v));
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    });
    vi.stubGlobal('window', { location: { origin: 'https://dropxnepal.vercel.app' } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('remembers and consumes the origin exactly once', () => {
    rememberLoginOrigin();
    expect(consumeLoginOrigin()).toBe('https://dropxnepal.vercel.app');
    expect(consumeLoginOrigin()).toBeNull();
  });

  it('never throws when storage is blocked', () => {
    vi.stubGlobal('sessionStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    });
    expect(() => rememberLoginOrigin()).not.toThrow();
    expect(consumeLoginOrigin()).toBeNull();
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
