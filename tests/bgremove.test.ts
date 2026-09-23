import { describe, expect, it } from 'vitest';
import {
  bgWorkSize,
  estimateBackground,
  featherAlpha,
  flattenOnWhite,
  floodBackground,
  removeBackgroundFromPixels,
} from '../src/lib/bgremove';

// solid fill, or fill with a centered rect of another color
function make(
  w: number,
  h: number,
  bg: [number, number, number],
  rect?: { x: number; y: number; w: number; h: number; c: [number, number, number] }
): Uint8ClampedArray {
  const d = new Uint8ClampedArray(w * h * 4);
  for (let p = 0; p < w * h; p++) {
    d[p * 4] = bg[0];
    d[p * 4 + 1] = bg[1];
    d[p * 4 + 2] = bg[2];
    d[p * 4 + 3] = 255;
  }
  if (rect) {
    for (let y = rect.y; y < rect.y + rect.h; y++) {
      for (let x = rect.x; x < rect.x + rect.w; x++) {
        const i = (y * w + x) * 4;
        d[i] = rect.c[0];
        d[i + 1] = rect.c[1];
        d[i + 2] = rect.c[2];
      }
    }
  }
  return d;
}

describe('bg removal core', () => {
  it('clears a white backdrop around a product rect', () => {
    const w = 60;
    const h = 40;
    const d = make(w, h, [255, 255, 255], { x: 8, y: 5, w: 44, h: 30, c: [200, 30, 30] });
    const r = removeBackgroundFromPixels(d, w, h);
    expect(r.removed).toBe(true);
    expect(r.reason).toBe('white backdrop');
    // 1320/2400 kept → ~0.45 removed
    expect(r.removedFraction).toBeGreaterThan(0.35);
    expect(r.removedFraction).toBeLessThan(0.55);
    expect(r.alpha).not.toBeNull();
    const a = r.alpha as Uint8ClampedArray;
    expect(a[0]).toBe(0); // corner = background
    expect(a[(20 * w + 30) | 0]).toBe(255); // deep inside product
  });

  it('clears a solid color backdrop too', () => {
    const w = 50;
    const h = 50;
    const d = make(w, h, [30, 120, 200], { x: 7, y: 7, w: 36, h: 36, c: [220, 180, 40] });
    const r = removeBackgroundFromPixels(d, w, h);
    expect(r.removed).toBe(true);
    expect(r.reason).toBe('solid backdrop');
  });

  it('never removes matching colors inside the product itself', () => {
    const w = 60;
    const h = 60;
    // blue backdrop, green product with a blue stripe fully inside it
    const d = make(w, h, [30, 120, 200], { x: 15, y: 15, w: 30, h: 30, c: [40, 180, 60] });
    for (let x = 20; x < 40; x++) {
      for (let y = 28; y < 32; y++) {
        const i = (y * w + x) * 4;
        d[i] = 30;
        d[i + 1] = 120;
        d[i + 2] = 200;
      }
    }
    const mask = floodBackground(d, w, h, [30, 120, 200], 30);
    // stripe pixel is backdrop-colored but unreachable → kept
    expect(mask[30 * w + 30]).toBe(0);
    // true backdrop pixel is gone
    expect(mask[0]).toBe(1);
  });

  it('bails on busy backgrounds instead of eating the subject', () => {
    const w = 40;
    const h = 40;
    const d = new Uint8ClampedArray(w * h * 4);
    let seed = 7;
    for (let i = 0; i < d.length; i += 4) {
      seed = (seed * 16807) % 2147483647;
      d[i] = seed % 256;
      d[i + 1] = (seed >> 3) % 256;
      d[i + 2] = (seed >> 5) % 256;
      d[i + 3] = 255;
    }
    const est = estimateBackground(d, w, h);
    expect(est.confident).toBe(false);
    expect(removeBackgroundFromPixels(d, w, h).removed).toBe(false);
  });

  it('bails when the subject fills the frame', () => {
    const d = make(40, 40, [200, 30, 30]);
    const r = removeBackgroundFromPixels(d, 40, 40);
    expect(r.removed).toBe(false);
    expect(r.reason).toMatch(/aggressive/);
  });

  it('bails when there is nothing worth removing', () => {
    const d = make(50, 50, [255, 255, 255], { x: 24, y: 24, w: 2, h: 2, c: [0, 0, 0] });
    const r = removeBackgroundFromPixels(d, 50, 50);
    expect(r.removed).toBe(false);
  });

  it('feathers edges and flattens onto white', () => {
    const w = 10;
    const h = 10;
    const mask = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) mask[y * w + x] = x < 5 ? 1 : 0;
    }
    const a = featherAlpha(mask, w, h);
    expect(a[4]).toBeLessThan(255); // boundary softens…
    expect(a[4]).toBeGreaterThan(0); // …but stays partial, not a hard step
    expect(a[0]).toBe(0);
    expect(a[w * h - 1]).toBe(255);
    const src = make(w, h, [200, 30, 30]);
    const flat = flattenOnWhite(src, w, h, a);
    expect(flat[0]).toBe(255); // background → white
    expect(flat[1]).toBe(255);
    // deep-kept pixel untouched
    const k = (w * h - 1) * 4;
    expect(flat[k]).toBe(200);
    expect(flat[k + 1]).toBe(30);
    expect(flat[k + 3]).toBe(255);
  });

  it('caps working size without upscaling', () => {
    expect(bgWorkSize(4000, 3000)).toEqual({ width: 1200, height: 900 });
    expect(bgWorkSize(800, 600)).toEqual({ width: 800, height: 600 });
  });
});
