import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
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

import { MaintenanceGate, MaintenancePage } from '../src/components/MaintenancePage';
import { AuthProvider } from '../src/store/AuthContext';
import { clearMaintenanceBypass, setMaintenanceBypass } from '../src/lib/maintenance';

function renderPage(onContinue = () => undefined) {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <MaintenancePage onContinue={onContinue} />
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  clearMaintenanceBypass();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('maintenance page', () => {
  it('shows the DropX message with a locked continue button', () => {
    renderPage();
    expect(screen.getByText(/tuning/)).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /continue anyway/i });
    expect(btn).toBeDisabled();
    // Admin bypass stays invisible to regular visitors.
    expect(screen.queryByRole('button', { name: /enter site as admin/i })).toBeNull();
  });

  it('counts down 6s, then unlocks and remembers the choice', () => {
    let continued = false;
    renderPage(() => {
      continued = true;
    });
    act(() => {
      vi.advanceTimersByTime(6_000);
    });
    const btn = screen.getByRole('button', { name: /continue anyway/i });
    expect(btn).toBeEnabled();
    expect(btn.textContent).not.toMatch(/\(/);
    fireEvent.click(btn);
    expect(continued).toBe(true);
  });

  it('shows remaining seconds while locked', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /\(6s\)/ })).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(3_000);
    });
    expect(screen.getByRole('button', { name: /\(3s\)/ })).toBeInTheDocument();
  });
});

describe('maintenance gate', () => {
  function renderGate(path: string) {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <MaintenanceGate>
            <p>shop content</p>
          </MaintenanceGate>
        </AuthProvider>
      </MemoryRouter>
    );
  }

  it('blocks customer routes but never admin routes', () => {
    const { unmount } = renderGate('/shop');
    expect(screen.queryByText('shop content')).toBeNull();
    expect(screen.getByText(/tuning/)).toBeInTheDocument();
    unmount();
    renderGate('/admin/orders');
    expect(screen.getByText('shop content')).toBeInTheDocument();
  });

  it('lets opted-in sessions straight through', () => {
    setMaintenanceBypass();
    renderGate('/shop');
    expect(screen.getByText('shop content')).toBeInTheDocument();
    expect(screen.queryByText(/tuning/)).toBeNull();
  });

  it('honors custom copy and a zero-second timer', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <MaintenancePage
            onContinue={() => undefined}
            overrides={{ maintenanceTitle: 'Back in a flash', maintenanceCountdown: 0 }}
          />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('Back in a flash')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^continue anyway$/i })).toBeEnabled();
  });
});
