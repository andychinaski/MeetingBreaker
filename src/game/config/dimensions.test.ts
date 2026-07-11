import { describe, expect, it } from 'vitest';
import { calculateViewportHeight } from './dimensions';

describe('calculateViewportHeight', () => {
  it('keeps a 16:9 aspect ratio', () => {
    expect(calculateViewportHeight(1280)).toBe(720);
  });
});
