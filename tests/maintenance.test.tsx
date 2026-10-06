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
    COMMERCE_STATUS: 'PAUSED',
  },
  isSupabaseConfigured: false,
  isCloudinaryConfigured: false,
}));

import { CommerceGate, PausePage } from '../src/components/PausePage';

function renderPage() {
  return render(
    <MemoryRouter>
      <PausePage />
    </MemoryRouter>
  );
}

function renderGate(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CommerceGate>
        <p>shop content</p>
      </CommerceGate>
    </MemoryRouter>
  );
}

describe('commerce pause page', () => {
  it('states the pause plainly with no countdown and no bypass buttons', () => {
    renderPage();
    expect(screen.getByText('DROPX / COMMERCE STATUS', { exact: false })).toBeInTheDocument();
    expect(screen.getAllByText(/paused — until further notice/i).length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        (_, el) => el?.tagName === 'H1' && (el.textContent ?? '').includes('PAUSED')
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Not gone. Just on hold.', { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/Electronic Commerce \(E-Commerce\) Act, 2081/)).toBeInTheDocument();
    // No timers, no privileged escape hatches for anyone.
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows what runs and what rests, plus a way back to browsing', () => {
    renderPage();
    expect(screen.getByText('Browsing')).toBeInTheDocument();
    expect(screen.getByText('Checkout')).toBeInTheDocument();
    expect(screen.getByText('Payments')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /keep browsing/i })).toHaveAttribute('href', '/');
  });
});

describe('commerce gate', () => {
  it('warns on storefront routes but never blocks browsing', () => {
    renderGate('/shop');
    expect(screen.getByText('shop content')).toBeInTheDocument();
    expect(screen.getByText(/service paused/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /why/i })).toHaveAttribute('href', '/pause');
  });

  it('stays quiet on admin and staff shells', () => {
    const { unmount } = renderGate('/admin/orders');
    expect(screen.getByText('shop content')).toBeInTheDocument();
    expect(screen.queryByText(/service paused/i)).toBeNull();
    unmount();
    renderGate('/staff');
    expect(screen.getByText('shop content')).toBeInTheDocument();
    expect(screen.queryByText(/service paused/i)).toBeNull();
  });
});
