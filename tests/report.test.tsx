import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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

import { AuthProvider } from '../src/store/AuthContext';
import { ReportProduct } from '../src/components/ReportProduct';
import type { Product } from '../src/types';

const product = {
  id: 'p1',
  name: 'Test Hoodie',
  slug: 'test-hoodie',
  description: '',
  category_id: null,
  base_price: 100,
  compare_at_price: null,
  cost_price: 80,
  use_custom_price: false,
  currency: 'NPR',
  is_active: true,
  is_featured: false,
  is_trending: false,
  is_new: false,
  rating_avg: 0,
  rating_count: 0,
  total_sold: 0,
  tags: [],
  brand: '',
  specs: {},
  created_at: '',
  images: [
    {
      id: 'im1', product_id: 'p1', variant_id: null,
      cloudinary_public_id: 'x', secure_url: 'https://example.com/a.jpg',
      alt_text: '', width: null, height: null, sort_order: 0, is_primary: true,
    },
  ],
} as unknown as Product;

describe('report menu', () => {
  it('opens discreetly and shows the image-rights form', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <ReportProduct product={product} />
        </AuthProvider>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /more actions/i }));
    fireEvent.click(screen.getByRole('button', { name: /report image issue/i }));
    expect(screen.getByText('Image ownership report')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/acme/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit report/i })).toBeInTheDocument();
  });

  it('validates before sending anything', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <ReportProduct product={product} />
        </AuthProvider>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /more actions/i }));
    fireEvent.click(screen.getByRole('button', { name: /report image issue/i }));
    fireEvent.click(screen.getByRole('button', { name: /submit report/i }));
    expect(screen.getByText(/brand\/company name must be/i)).toBeInTheDocument();
  });
});
