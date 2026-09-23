import { beforeEach, describe, expect, it, vi } from 'vitest';
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
    maintenanceMode: true,
  },
  isSupabaseConfigured: false,
  isCloudinaryConfigured: false,
}));

type Role = 'customer' | 'admin' | 'superadmin' | 'subadmin' | null;

const viewer: { role: Role } = { role: null };

vi.mock('../src/store/AuthContext', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: viewer.role ? { id: 'u1', email: 'u@test' } : null,
    session: null,
    profile: viewer.role ? { id: 'u1', email: 'u@test', role: viewer.role } : null,
    role: viewer.role,
    loading: false,
    ready: true,
    isAdmin: viewer.role === 'admin' || viewer.role === 'superadmin',
    isSubadmin: viewer.role === 'subadmin',
    isStaff: viewer.role !== 'customer' && viewer.role !== null,
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

import { MaintenanceGate } from '../src/components/MaintenancePage';

function renderGate() {
  return render(
    <MemoryRouter initialEntries={['/shop']}>
      <MaintenanceGate>
        <p>shop content</p>
      </MaintenanceGate>
    </MemoryRouter>
  );
}

function renderGateAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <MaintenanceGate>
        <p>shop content</p>
      </MaintenanceGate>
    </MemoryRouter>
  );
}

beforeEach(() => {
  viewer.role = null;
});

describe('maintenance auto-bypass (no clicks)', () => {
  it.each(['admin', 'superadmin', 'subadmin'] as const)('%s sees the site immediately', (role) => {
    viewer.role = role;
    renderGate();
    expect(screen.getByText('shop content')).toBeInTheDocument();
    expect(screen.queryByText(/tuning/)).toBeNull();
  });

  it('customers still see the maintenance page', () => {
    viewer.role = 'customer';
    renderGate();
    expect(screen.queryByText('shop content')).toBeNull();
    expect(screen.getByText(/tuning/)).toBeInTheDocument();
  });

  it('visitors still see the maintenance page', () => {
    renderGate();
    expect(screen.queryByText('shop content')).toBeNull();
    expect(screen.getByText(/tuning/)).toBeInTheDocument();
  });

  it.each(['/staff/login', '/get-acc-info'])('team entry %s never sees the page', (path) => {
    renderGateAt(path);
    expect(screen.getByText('shop content')).toBeInTheDocument();
    expect(screen.queryByText(/tuning/)).toBeNull();
  });
});
