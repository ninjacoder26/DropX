import { describe, expect, it } from 'vitest';
import {
  alreadyOptimal,
  canOptimize,
  formatBytes,
  optimizeImageFile,
  targetDimensions,
} from '../src/lib/image';
import { cloudinaryThumb } from '../src/lib/shop';

describe('image pipeline', () => {
  it('fits inside maxDim preserving aspect, never upscales', () => {
    expect(targetDimensions(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(targetDimensions(800, 1200, 1600)).toEqual({ width: 800, height: 1200 });
    expect(targetDimensions(1600, 1600, 1600)).toEqual({ width: 1600, height: 1600 });
  });

  it('skips re-encoding for small web-friendly files', () => {
    const small = new File(['x'.repeat(100)], 'a.jpg', { type: 'image/jpeg' });
    Object.defineProperty(small, 'size', { value: 200 * 1024 });
    expect(alreadyOptimal(small, 800, 600, 1600)).toBe(true);
    const bigPng = new File(['x'.repeat(100)], 'b.png', { type: 'image/png' });
    Object.defineProperty(bigPng, 'size', { value: 5 * 1024 * 1024 });
    expect(alreadyOptimal(bigPng, 4000, 3000, 1600)).toBe(false);
  });

  it('falls back to the original when browser APIs are missing', async () => {
    if (canOptimize()) return; // real browser: covered by manual QA
    const file = new File(['hello'], 'photo.png', { type: 'image/png' });
    const out = await optimizeImageFile(file);
    expect(out.optimized).toBe(false);
    expect(out.bytes).toBe(file.size);
  });

  it('formats bytes for admin hints', () => {
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});

describe('delivery transforms', () => {
  const url = 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg';

  it('builds auto transforms by default', () => {
    expect(cloudinaryThumb(url, 800)).toBe(
      'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800/v1/sample.jpg'
    );
  });

  it('builds eco transforms for grids and thumbs', () => {
    expect(cloudinaryThumb(url, 400, 'eco')).toContain('f_auto,q_auto:eco,w_400');
  });

  it('leaves non-Cloudinary URLs untouched', () => {
    expect(cloudinaryThumb('https://example.com/a.jpg', 400, 'eco')).toBe('https://example.com/a.jpg');
  });
});
