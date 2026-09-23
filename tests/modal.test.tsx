import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Modal } from '../src/components/ui';

describe('modal keyboard behavior', () => {
  it('closes on Escape and focuses the close button on open', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Hello">
        <p>body</p>
      </Modal>
    );
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Close');
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <Modal open={false} onClose={() => undefined} title="Hello">
        <p>body</p>
      </Modal>
    );
    expect(container.textContent).toBe('');
  });
});
