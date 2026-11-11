import { DEFAULTS, fallFor, sanitize } from './settings';

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

  it('maps smoothness to a fall speed, keeping the original feel as default', () => {
    expect(fallFor(0)).toBeGreaterThan(fallFor(1));
    expect(fallFor(DEFAULTS.smoothness)).toBeCloseTo(0.06, 2);
  });
});
