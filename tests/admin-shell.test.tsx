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
    user: { id: 'admin-1', email: 'admin@dropx.test' },
    session: null,
    profile: { id: 'admin-1', email: 'admin@dropx.test', role: 'admin' },
    role: 'admin',
    loading: false,
    ready: true,
    isAdmin: true,
    isSubadmin: false,
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

function renderAdmin(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CartProvider>
        <App />
      </CartProvider>
    </MemoryRouter>
  );
}

describe('admin shell', () => {
  it('renders the dashboard without storefront header/footer', async () => {
    renderAdmin('/admin');
    expect(await screen.findByText('DropX Admin', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.queryByRole('banner')).toBeNull();
    expect(screen.queryByRole('contentinfo')).toBeNull();
  });

  it('storefront keeps its chrome on shop routes', async () => {
    renderAdmin('/shop');
    expect(await screen.findByText('Shop all', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});
