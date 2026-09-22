import { describe, expect, it } from 'vitest';
import { GRID_COMFORTABLE, GRID_COMPACT } from '../src/components/product';

describe('product grids', () => {
  it('always stretch edge to edge, however many items remain', () => {
    expect(GRID_COMPACT).toContain('auto-fit');
    expect(GRID_COMFORTABLE).toContain('auto-fit');
  });

  it('keeps a strict 2-column floor on phones', () => {
    expect(GRID_COMPACT).toContain('grid-cols-2');
    expect(GRID_COMFORTABLE).toContain('grid-cols-2');
  });
});
