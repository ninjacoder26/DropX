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
    expect(screen.getAllByText(/Electronic Commerce \(E-Commerce\) Act, 2081/).length).toBeGreaterThan(0);
    // No timers, no privileged escape hatches — the only buttons are FAQ toggles.
    for (const b of screen.getAllByRole('button')) {
      expect(b.textContent ?? '').toMatch(/Can I|What happens|Is my|When will/i);
    }
  });

  it('shows what runs and what rests, plus a way to reach out', () => {
    renderPage();
    expect(screen.getByText('Browsing')).toBeInTheDocument();
    expect(screen.getByText('Checkout')).toBeInTheDocument();
    expect(screen.getByText('Payments')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /talk to us/i })).toHaveAttribute('href', 'mailto:dropx.nepal@gmail.com');
    expect(screen.getByText(/why is ordering restricted/i)).toBeInTheDocument();
    expect(screen.getByText(/when do we reopen/i)).toBeInTheDocument();
  });

  it('answers common questions in place', () => {
    renderPage();
    expect(screen.getByText('Can I still look around?')).toBeInTheDocument();
    expect(screen.getByText('Is my account and data safe?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /read the privacy policy/i })).toHaveAttribute('href', '/privacy');
  });
});

describe('commerce gate', () => {
  it('replaces storefront routes with the pause page — no chrome, no browsing', () => {
    renderGate('/shop');
    expect(screen.queryByText('shop content')).toBeNull();
    expect(screen.getAllByText(/until further notice/i).length).toBeGreaterThan(0);
  });

  it('stays quiet on admin and staff shells', () => {
    const { unmount } = renderGate('/admin/orders');
    expect(screen.getByText('shop content')).toBeInTheDocument();
    expect(screen.queryByText(/until further notice/i)).toBeNull();
    unmount();
    renderGate('/staff');
    expect(screen.getByText('shop content')).toBeInTheDocument();
    expect(screen.queryByText(/until further notice/i)).toBeNull();
  });
});
