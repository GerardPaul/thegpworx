import { cellSize, idleFront, quantize, ring } from './pixel-field';

describe('pixel field', () => {
  it('ripple ring is brightest on the expanding ring and gone after its life', () => {
    const age = 500; // ring radius = 500ms * 0.4px/ms = 200px
    expect(ring(200, age)).toBeGreaterThan(ring(100, age));
    expect(ring(200, age)).toBeGreaterThan(ring(300, age));
    expect(ring(200, age)).toBeGreaterThan(ring(400, 1000)); // same spot on the ring, but older
    expect(ring(0, 2001)).toBe(0);
    expect(ring(0, -1)).toBe(0);
  });

  it('idle wave waits, sweeps the diagonal, then pauses', () => {
    expect(idleFront(3999, 1000)).toBeNull();
    const start = idleFront(4000, 1000)!;
    const middle = idleFront(5500, 1000)!;
    expect(start).toBeLessThan(0);
    expect(middle).toBeGreaterThan(start);
    expect(idleFront(4000 + 3500, 1000)).toBeNull(); // between sweeps
    expect(idleFront(4000 + 6000, 1000)).toBe(start); // next sweep restarts
  });

  it('quantize clamps and snaps to steps', () => {
    expect(quantize(-1)).toBe(0);
    expect(quantize(0.3)).toBe(0.25);
    expect(quantize(5)).toBe(1);
  });

  it('cell size stays 32px normally and grows on huge screens', () => {
    expect(cellSize(1920, 1080)).toBe(32);
    const big = cellSize(7680, 4320);
    expect(Math.ceil(7680 / big) * Math.ceil(4320 / big)).toBeLessThanOrEqual(4000 * 1.1);
  });
});
