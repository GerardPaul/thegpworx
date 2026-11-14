import { cellSize, falloff, pulse } from './pixel-field';

describe('pixel field', () => {
  it('falloff is full at the centre and gone at the radius', () => {
    expect(falloff(0, 100)).toBe(1);
    expect(falloff(50, 100)).toBe(0.5);
    expect(falloff(100, 100)).toBe(0);
    expect(falloff(150, 100)).toBe(0);
  });

  it('idle pulse starts full, dips halfway through, and repeats', () => {
    expect(pulse(0)).toBeCloseTo(1);
    expect(pulse(1000)).toBeCloseTo(0.35);
    expect(pulse(2000)).toBeCloseTo(1);
    expect(pulse(500)).toBeGreaterThan(pulse(1000));
  });

  it('cell size stays 32px normally and grows on huge screens', () => {
    expect(cellSize(1920, 1080)).toBe(32);
    const big = cellSize(7680, 4320);
    expect(Math.ceil(7680 / big) * Math.ceil(4320 / big)).toBeLessThanOrEqual(4000 * 1.1);
  });
});
