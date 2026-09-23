import { afterEach, describe, expect, it, vi } from 'vitest';
import { uploadToCloudinary } from '../src/lib/cloudinary';

const payload = {
  public_id: 'dropx/products/x',
  secure_url: 'https://res.cloudinary.com/demo/image/upload/x.jpg',
  width: 800,
  height: 800,
  bytes: 12345,
  format: 'webp',
};

function mockFetch(handler: (url: string, init?: RequestInit) => unknown) {
  const calls: { url: string; init?: RequestInit }[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return handler(url, init);
    })
  );
  return calls;
}

const okJson = (body: unknown) => ({ ok: true, json: async () => body }) as Response;
const fail = { ok: false, status: 500, text: async () => 'nope' } as Response;

const file = () => new File(['x'.repeat(5000)], 'photo.png', { type: 'image/png' });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('cloudinary upload routing', () => {
  it('uses the unsigned preset when no session token is given', async () => {
    const calls = mockFetch(() => okJson(payload));
    const out = await uploadToCloudinary(file());
    expect(out.public_id).toBe(payload.public_id);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain('api.cloudinary.com');
    expect((calls[0].init?.body as FormData).get('upload_preset')).toBeTruthy();
  });

  it('prefers signed upload with the admin token', async () => {
    const calls = mockFetch((url) => {
      if (url === '/api/cloudinary-sign') {
        return okJson({ signature: 'sig', timestamp: 1, apiKey: 'key', cloudName: 'demo', folder: 'dropx/products' });
      }
      return okJson(payload);
    });
    await uploadToCloudinary(file(), 'tok-123');
    expect(calls).toHaveLength(2);
    expect(calls[0].url).toBe('/api/cloudinary-sign');
    expect(calls[0].init?.headers).toMatchObject({ Authorization: 'Bearer tok-123' });
    const body = calls[1].init?.body as FormData;
    expect(body.get('signature')).toBe('sig');
    expect(body.get('upload_preset')).toBeNull();
  });

  it('falls back to unsigned when signing fails', async () => {
    const calls = mockFetch((url) => (url === '/api/cloudinary-sign' ? fail : okJson(payload)));
    const out = await uploadToCloudinary(file(), 'tok-123');
    expect(out.public_id).toBe(payload.public_id);
    expect(calls).toHaveLength(2);
    expect((calls[1].init?.body as FormData).get('upload_preset')).toBeTruthy();
  });

  it('throws on hard upload failure', async () => {
    mockFetch(() => fail);
    await expect(uploadToCloudinary(file())).rejects.toThrow(/Cloudinary upload failed/);
  });
});
