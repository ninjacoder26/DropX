import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { ScrollToTop } from '../src/components/ScrollToTop';

function renderTwo() {
  return render(
    <MemoryRouter initialEntries={['/a']}>
      <ScrollToTop />
      <Routes>
        <Route path="/a" element={<><p>page a</p><Link to="/b">go b</Link></>} />
        <Route path="/b" element={<p>page b</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('scroll consistency', () => {
  it('starts pushed routes at the top', () => {
    const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    try {
      renderTwo();
      expect(spy).toHaveBeenCalledWith(0, 0);
      spy.mockClear();
      fireEvent.click(screen.getByText('go b'));
      expect(screen.getByText('page b')).toBeInTheDocument();
      expect(spy).toHaveBeenCalledWith(0, 0);
    } finally {
      spy.mockRestore();
    }
  });
});
