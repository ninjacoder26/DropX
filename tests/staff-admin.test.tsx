import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
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

vi.mock('../src/store/AuthContext', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: { id: 'staff-1', email: 'photo@staff.dropx.internal' },
    session: null,
    profile: { id: 'staff-1', email: 'photo@staff.dropx.internal', role: 'subadmin', username: 'photo-team' },
    role: 'subadmin',
    loading: false,
    ready: true,
    isAdmin: false,
    isSubadmin: true,
    isStaff: true,
    configured: false,
    signUp: async () => ({ error: null }),
    signIn: async () => ({ error: null }),
    signInWithGoogle: async () => ({ error: null }),
    signInSubadmin: async () => ({ error: null }),
    signOut: async () => undefined,
    resetPassword: async () => ({ error: null }),
    refreshProfile: async () => undefined,
  }),
}));

import App from '../src/App';
import { CartProvider } from '../src/store/CartContext';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CartProvider>
        <App />
      </CartProvider>
    </MemoryRouter>
  );
}

describe('subadmin read-only admin shell', () => {
  it('enters /admin with a view-only banner and no privileged tabs', async () => {
    renderAt('/admin/products');
    expect(await screen.findByText(/view only/i, {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Staff' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Customers' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Activity' })).toBeNull();
    expect(screen.queryByRole('button', { name: /new product/i })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Products' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Orders' })).toBeInTheDocument();
  });

  it('reaches the separate staff portal too', async () => {
    renderAt('/staff/login');
    expect(await screen.findByText(/staff sign in/i, {}, { timeout: 5000 })).toBeInTheDocument();
  });
});
