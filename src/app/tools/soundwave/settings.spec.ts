import { DEFAULTS, fallFor, sanitize, snap } from './settings';

describe('settings', () => {
  it('keeps valid stored values', () => {
    const stored = { ...DEFAULTS, format: 'portrait', layout: 'circle', bar: '#123abc', bars: 128, sensitivity: 1.5, glow: true };
    expect(sanitize(stored)).toEqual(stored as typeof DEFAULTS);
  });

  it('replaces invalid or missing values with defaults', () => {
    const s = sanitize({ format: 'huge', bar: 'red', bars: 7, sensitivity: 99, smoothness: -1, glow: 'yes', extra: 1, vizX: 2, vizSize: 0, imageSize: '1' });
    expect(s).toEqual(DEFAULTS);
    expect(sanitize(null)).toEqual(DEFAULTS);
    expect(sanitize('junk')).toEqual(DEFAULTS);
  });

  it('steps, clamps and rounds numeric settings', () => {
    expect(snap('vizX', 0.1 + 0.2)).toBe(0.3); // no 0.30000000000000004
    expect(snap('vizSize', 1 + 0.05)).toBe(1.05);
    expect(snap('vizSize', 9)).toBe(1.5);
    expect(snap('titleX', -9)).toBe(-0.5);
    expect(snap('sensitivity', 1.03)).toBe(1.05); // snaps to the 0.05 step
  });

  it('keeps a valid title font and rejects unknown ones', () => {
    expect(sanitize({ titleFont: 'serif' }).titleFont).toBe('serif');
    expect(sanitize({ titleFont: 'Comic Sans' }).titleFont).toBe(DEFAULTS.titleFont);
  });

  it('maps smoothness to a fall speed, keeping the original feel as default', () => {
    expect(fallFor(0)).toBeGreaterThan(fallFor(1));
    expect(fallFor(DEFAULTS.smoothness)).toBeCloseTo(0.06, 2);
  });
});
