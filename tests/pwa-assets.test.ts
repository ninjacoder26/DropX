import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(__dirname, '..');

describe('pwa assets', () => {
  it('ships a valid web manifest pointing at real icons', () => {
    const raw = readFileSync(join(root, 'public/manifest.webmanifest'), 'utf8');
    const manifest = JSON.parse(raw) as {
      name: string; start_url: string; display: string;
      icons: { src: string; sizes: string }[];
    };
    expect(manifest.name).toMatch(/DropX/);
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
    for (const icon of manifest.icons) {
      expect(existsSync(join(root, 'public', icon.src))).toBe(true);
    }
  });

  it('ships apple touch icon, favicon.ico and service worker', () => {
    for (const f of ['public/icons/apple-touch-icon.png', 'public/favicon.ico', 'public/sw.js']) {
      expect(existsSync(join(root, f))).toBe(true);
    }
    const sw = readFileSync(join(root, 'public/sw.js'), 'utf8');
    expect(sw).toContain('dropx-v1');
    expect(sw).toContain('/index.html');
  });

  it('registers the service worker only on real hosts', () => {
    const main = readFileSync(join(root, 'src/main.tsx'), 'utf8');
    expect(main).toContain("register('/sw.js')");
    expect(main).toContain('localhost');
  });
});
