/**
 * Local background removal — no AI, no network, no new dependencies.
 * Classic recipe: estimate the background color from the border, flood fill
 * connected near-background pixels, feather the edge, flatten onto white.
 * Conservative on purpose: uncertain or busy backgrounds bail out and the
 * caller keeps the original file untouched.
 */

export interface BgEstimate {
  color: [number, number, number];
  /** Mean per-pixel distance from the median border color. */
  spread: number;
  isWhite: boolean;
  confident: boolean;
}

export interface BgRemovalResult {
  /** Soft alpha (0 = background, 255 = product). Null when bailing. */
  alpha: Uint8ClampedArray | null;
  width: number;
  height: number;
  removed: boolean;
  removedFraction: number;
  reason: string;
}

const SPREAD_GATE = 26;
const WHITE_TOLERANCE = 46;
const COLOR_TOLERANCE = 30;
const MIN_FRACTION = 0.03;
const MAX_FRACTION = 0.55;

/** Median border color + spread. A calm border means a simple backdrop. */
export function estimateBackground(data: Uint8ClampedArray, width: number, height: number): BgEstimate {
  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];
  const step = 2;
  for (let x = 0; x < width; x += step) {
    for (const y of [0, height - 1]) {
      const i = (y * width + x) * 4;
      rs.push(data[i]);
      gs.push(data[i + 1]);
      bs.push(data[i + 2]);
    }
  }
  for (let y = 0; y < height; y += step) {
    for (const x of [0, width - 1]) {
      const i = (y * width + x) * 4;
      rs.push(data[i]);
      gs.push(data[i + 1]);
      bs.push(data[i + 2]);
    }
  }
  const median = (a: number[]): number => {
    const s = [...a].sort((p, q) => p - q);
    return s[Math.floor(s.length / 2)] ?? 0;
  };
  const mr = median(rs);
  const mg = median(gs);
  const mb = median(bs);
  let spread = 0;
  for (let k = 0; k < rs.length; k++) {
    spread += Math.abs(rs[k] - mr) + Math.abs(gs[k] - mg) + Math.abs(bs[k] - mb);
  }
  spread /= Math.max(1, rs.length * 3);
  const lum = 0.2126 * mr + 0.7152 * mg + 0.0722 * mb;
  const sat = Math.max(mr, mg, mb) - Math.min(mr, mg, mb);
  const isWhite = lum > 205 && sat < 28;
  return { color: [mr, mg, mb], spread, isWhite, confident: spread <= SPREAD_GATE };
}

function dist2(
  data: Uint8ClampedArray,
  i: number,
  color: [number, number, number]
): number {
  const dr = data[i] - color[0];
  const dg = data[i + 1] - color[1];
  const db = data[i + 2] - color[2];
  return dr * dr + dg * dg + db * db;
}

/**
 * Flood fill from the frame inward through near-background pixels only.
 * Connected-regions rule: a matching color in the middle of the product is
 * never touched, because the fill can't reach it through product pixels.
 */
export function floodBackground(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  bg: [number, number, number],
  tolerance: number
): Uint8Array {
  const mask = new Uint8Array(width * height);
  const tol2 = tolerance * tolerance;
  const stack: number[] = [];
  const push = (x: number, y: number) => {
    const p = y * width + x;
    if (mask[p]) return;
    const i = p * 4;
    if (data[i + 3] < 128 || dist2(data, i, bg) <= tol2) {
      mask[p] = 1;
      stack.push(p);
    }
  };
  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }
  while (stack.length > 0) {
    const p = stack.pop() as number;
    const x = p % width;
    const y = (p - x) / width;
    if (x > 0) push(x - 1, y);
    if (x < width - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < height - 1) push(x, y + 1);
  }
  return mask;
}

/** One 3x3 blur pass over the keep-mask → soft edge, no jagged steps. */
export function featherAlpha(mask: Uint8Array, width: number, height: number): Uint8ClampedArray {
  const alpha = new Uint8ClampedArray(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let keep = 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          keep += 1 - mask[ny * width + nx];
          n++;
        }
      }
      alpha[y * width + x] = Math.round((keep / n) * 255);
    }
  }
  return alpha;
}

/** Composite source over solid white using the soft alpha. */
export function flattenOnWhite(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  alpha: Uint8ClampedArray
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data.length);
  for (let p = 0; p < width * height; p++) {
    const i = p * 4;
    const a = alpha[p] / 255;
    out[i] = Math.round(data[i] * a + 255 * (1 - a));
    out[i + 1] = Math.round(data[i + 1] * a + 255 * (1 - a));
    out[i + 2] = Math.round(data[i + 2] * a + 255 * (1 - a));
    out[i + 3] = 255;
  }
  return out;
}

/** Full pipeline on raw pixels. Never throws — bails with removed:false. */
export function removeBackgroundFromPixels(
  data: Uint8ClampedArray,
  width: number,
  height: number
): BgRemovalResult {
  const fail = (reason: string, removedFraction = 0): BgRemovalResult => ({
    alpha: null,
    width,
    height,
    removed: false,
    removedFraction,
    reason,
  });
  if (width < 8 || height < 8) return fail('image too small');
  const est = estimateBackground(data, width, height);
  if (!est.confident) return fail('busy background — kept original');
  const mask = floodBackground(data, width, height, est.color, est.isWhite ? WHITE_TOLERANCE : COLOR_TOLERANCE);
  let bgCount = 0;
  for (let p = 0; p < mask.length; p++) bgCount += mask[p];
  const fraction = bgCount / mask.length;
  if (fraction < MIN_FRACTION) return fail('no background found', fraction);
  if (fraction > MAX_FRACTION) return fail('too aggressive — kept original', fraction);
  return {
    alpha: featherAlpha(mask, width, height),
    width,
    height,
    removed: true,
    removedFraction: fraction,
    reason: est.isWhite ? 'white backdrop' : 'solid backdrop',
  };
}

/* ── Browser file wrapper (canvas I/O; pure core above stays testable) ── */

export interface ProcessedBgImage {
  /** White-flattened PNG blob, or null when bailing (use the original). */
  blob: Blob | null;
  width: number;
  height: number;
  removed: boolean;
  removedFraction: number;
  reason: string;
}

export function canRemoveBackground(): boolean {
  return (
    typeof createImageBitmap === 'function' &&
    typeof document !== 'undefined' &&
    !!document.createElement('canvas').getContext
  );
}

/** Cap working size so a phone photo processes in well under a second. */
export function bgWorkSize(naturalWidth: number, naturalHeight: number, maxDim = 1200): { width: number; height: number } {
  const longest = Math.max(naturalWidth, naturalHeight);
  if (longest <= maxDim || longest <= 0) return { width: naturalWidth, height: naturalHeight };
  const scale = maxDim / longest;
  return { width: Math.round(naturalWidth * scale), height: Math.round(naturalHeight * scale) };
}

export async function processImageBackground(file: File): Promise<ProcessedBgImage> {
  const bail = (reason: string): ProcessedBgImage => ({
    blob: null,
    width: 0,
    height: 0,
    removed: false,
    removedFraction: 0,
    reason,
  });
  if (!canRemoveBackground()) return bail('not supported here');
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return bail('could not read image');
  }
  if (!bitmap) return bail('could not read image');
  try {
    const { width, height } = bgWorkSize(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return bail('not supported here');
    ctx.drawImage(bitmap, 0, 0, width, height);
    const pixels = ctx.getImageData(0, 0, width, height);
    const result = removeBackgroundFromPixels(pixels.data, width, height);
    if (!result.removed || !result.alpha) {
      return { ...bail(result.reason), removedFraction: result.removedFraction };
    }
    const flat = flattenOnWhite(pixels.data, width, height, result.alpha);
    const out = new ImageData(Uint8ClampedArray.from(flat), width, height);
    ctx.putImageData(out, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return bail('encode failed');
    return {
      blob,
      width,
      height,
      removed: true,
      removedFraction: result.removedFraction,
      reason: result.reason,
    };
  } finally {
    if (typeof bitmap.close === 'function') bitmap.close();
  }
}
