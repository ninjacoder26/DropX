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

  it('admin dark mode covers every token used in the dashboard', () => {
    const css = readFileSync(join(root, 'src/index.css'), 'utf8');
    for (const token of [
      '.admin-dark .bg-white',
      '.admin-dark .bg-paper',
      '.admin-dark .bg-ink',
      '.admin-dark .bg-ink\\/5',
      '.admin-dark .bg-ink\\/15',
      '.admin-dark .bg-paper\\/90',
      '.admin-dark .text-ink',
      '.admin-dark .text-ink\\/70',
      '.admin-dark .text-ink\\/30',
      '.admin-dark .border-ink',
      '.admin-dark .border-ink\\/40',
      '.admin-dark .border-ink\\/5',
      '.admin-dark .ring-ink\\/30',
    ]) {
      expect(css, token).toContain(token);
    }
  });

  it('admin shell never renders storefront chrome (single navigation)', () => {
    const app = readFileSync(join(root, 'src/App.tsx'), 'utf8');
    expect(app).toMatch(/!isAdminRoute && <Navbar \/>/);
    expect(app).toMatch(/!isAdminRoute && <Footer \/>/);
    expect(app.match(/<Navbar \/>/g)?.length).toBe(1);
  });
});
