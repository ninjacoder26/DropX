import { afterEach, describe, expect, it, vi } from 'vitest';
import { isRealtimeAvailable } from '../src/lib/realtime';

describe('realtime availability gate', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is unavailable without WebSocket support', () => {
    vi.stubGlobal('WebSocket', undefined);
    expect(isRealtimeAvailable()).toBe(false);
  });

  it('is unavailable on insecure origins', () => {
    vi.stubGlobal('WebSocket', class {});
    Object.defineProperty(window, 'location', {
      value: { protocol: 'http:', hostname: 'example.com' },
      writable: true,
      configurable: true,
    });
    expect(isRealtimeAvailable()).toBe(false);
  });

  it('is available on https with WebSocket support', () => {
    vi.stubGlobal('WebSocket', class {});
    Object.defineProperty(window, 'location', {
      value: { protocol: 'https:', hostname: 'dropx.vercel.app' },
      writable: true,
      configurable: true,
    });
    expect(isRealtimeAvailable()).toBe(true);
  });
});
