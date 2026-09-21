/**
 * Render smoke tests — the "blank page" regression net.
 * Forces the UNCONFIGURED state (empty config) regardless of what the
 * developer has in their local src/config.ts, asserting every public
 * route renders real content instead of a blank screen.
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../src/config', () => ({
  APP_CONFIG: {
    appName: 'DropX',
    supabaseUrl: '',
    supabaseAnonKey: '',
    cloudinaryCloudName: '',
    cloudinaryUploadPreset: '',
  },
  isSupabaseConfigured: false,
  isCloudinaryConfigured: false,
}));

import App from '../src/App';
import { AuthProvider } from '../src/store/AuthContext';
import { CartProvider } from '../src/store/CartContext';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('unconfigured storefront renders (never blank)', () => {
  it('/ shows the homepage hero and sections', async () => {
    renderAt('/');
    expect(await screen.findByText(/Shop the collection/)).toBeInTheDocument();
    expect(await screen.findByText('Pay your way')).toBeInTheDocument();
    expect(await screen.findByText(/Backend not connected/)).toBeInTheDocument();
  });

  it('/ collapses empty shelves instead of rendering hollow sections', async () => {
    renderAt('/');
    await screen.findByText(/Shop the collection/);
    // No catalog data in this mode → no hollow "Trending"/"New arrivals" blocks.
    expect(screen.queryByText('Trending now')).toBeNull();
    expect(screen.queryByText('New arrivals')).toBeNull();
  });

  it('/shop shows filters plus setup guidance', async () => {
    renderAt('/shop');
    expect(await screen.findByText(/Backend not connected/)).toBeInTheDocument();
    expect(await screen.findByText(/No products found/)).toBeInTheDocument();
  });

  it('/cart shows the empty state with a CTA', async () => {
    renderAt('/cart');
    expect(await screen.findByText(/Your bag is empty/)).toBeInTheDocument();
    expect(await screen.findByText(/Start shopping/)).toBeInTheDocument();
  });

  it('/drops explains there is nothing published yet', async () => {
    renderAt('/drops');
    expect(await screen.findByRole('heading', { name: 'Drops' })).toBeInTheDocument();
    expect(await screen.findByText(/No published drops yet/)).toBeInTheDocument();
  });

  it('/login renders the login form', async () => {
    renderAt('/login');
    expect(await screen.findByText(/Welcome back/)).toBeInTheDocument();
  });

  it('/admin without a session redirects to login', async () => {
    renderAt('/admin');
    expect(await screen.findByText(/Welcome back/)).toBeInTheDocument();
  });

  it('unknown product slug shows not-found, not blank', async () => {
    renderAt('/product/no-such-product');
    expect(await screen.findByText(/Product not found/)).toBeInTheDocument();
  });

  it('/terms and /privacy render legal content', async () => {
    renderAt('/terms');
    expect(await screen.findByText('Terms of Service')).toBeInTheDocument();
    renderAt('/privacy');
    expect(await screen.findByText('Privacy Policy')).toBeInTheDocument();
  });

  it('/checkout redirects to login while preserving intent', async () => {
    renderAt('/checkout');
    expect(await screen.findByText(/Welcome back/)).toBeInTheDocument();
    expect(await screen.findByText(/finish checking out/)).toBeInTheDocument();
  });
});
