import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..');

/** Layout invariants: the full-screen phantom-gap class of bug stays dead. */
describe('layout invariants', () => {
  it('no global CSS rule repositions arbitrary children (breaks absolute elements)', () => {
    const css = readFileSync(join(root, 'src/index.css'), 'utf8');
    // A rule like `.x > * { position: ... }` overrides Tailwind's `absolute`
    // (same specificity, source order wins) and injects phantom layout space.
    const hits = [...css.matchAll(/>\s*\*\s*\{([^}]*)\}/g)];
    for (const [, body] of hits) {
      expect(body).not.toMatch(/position\s*:/);
    }
  });

  it('browsing surfaces are full-bleed, not centered narrow columns', () => {
    const fullBleed = ['src/pages/HomePage.tsx', 'src/pages/ShopPage.tsx', 'src/components/layout.tsx'];
    for (const f of fullBleed) {
      const src = readFileSync(join(root, f), 'utf8');
      expect(src).toContain('dx-full');
    }
    const shop = readFileSync(join(root, 'src/pages/ShopPage.tsx'), 'utf8');
    expect(shop).not.toContain('max-w-7xl');
  });
});
