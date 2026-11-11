import { ColorMode, Layout, Shape } from './draw';

export type Format = 'landscape' | 'portrait' | 'square';

export const FORMATS: Record<Format, { label: string; width: number; height: number }> = {
  landscape: { label: '16:9', width: 1280, height: 720 },
  portrait: { label: '9:16', width: 720, height: 1280 },
  square: { label: '1:1', width: 1080, height: 1080 },
};

export const GREEN_SCREEN = '#00ff00';

export const OPTIONS = {
  format: (Object.keys(FORMATS) as Format[]).map(value => ({ value, label: FORMATS[value].label })),
  layout: [
    { value: 'mirror', label: 'Mirrored' },
    { value: 'bottom', label: 'Bottom' },
    { value: 'circle', label: 'Circle' },
  ] as { value: Layout; label: string }[],
  shape: [
    { value: 'pixel', label: 'Pixel' },
    { value: 'solid', label: 'Solid' },
    { value: 'rounded', label: 'Rounded' },
  ] as { value: Shape; label: string }[],
  colorMode: [
    { value: 'solid', label: 'One color' },
    { value: 'gradient', label: 'Gradient' },
    { value: 'rainbow', label: 'Rainbow' },
  ] as { value: ColorMode; label: string }[],
  bars: [16, 32, 48, 64, 96, 128],
};

/** Everything the user can pick that's worth remembering between visits (not the file, title or trim). */
export interface Settings {
  format: Format;
  layout: Layout;
  shape: Shape;
  colorMode: ColorMode;
  bar: string;
  bar2: string;
  bg: string;
  bars: number;
  sensitivity: number; // gain, 0.5..2
  smoothness: number; // 0 (snappy) .. 1 (slow fall)
  glow: boolean;
  caps: boolean;
  imageSize: number; // 0.25..3, 1 = covers the frame
  imageX: number; // -0.5..0.5 of frame width
  imageY: number; // -0.5..0.5 of frame height
  vizSize: number; // 0.25..1.5
  vizX: number; // -0.5..0.5 of frame width
  vizY: number; // -0.5..0.5 of frame height
}

export const RANGES = {
  imageSize: [0.25, 3],
  imageX: [-0.5, 0.5],
  imageY: [-0.5, 0.5],
  vizSize: [0.25, 1.5],
  vizX: [-0.5, 0.5],
  vizY: [-0.5, 0.5],
} as const;

// Video colours are the user's content, not site theme, so they're plain hex (what <input type="color"> needs).
export const DEFAULTS: Settings = {
  format: 'landscape',
  layout: 'mirror',
  shape: 'pixel',
  colorMode: 'solid',
  bar: '#38bdf8',
  bar2: '#a3e635',
  bg: '#0a0d14',
  bars: 64,
  sensitivity: 1,
  smoothness: 0.75,
  glow: false,
  caps: false,
  imageSize: 1,
  imageX: 0,
  imageY: 0,
  vizSize: 1,
  vizX: 0,
  vizY: 0,
};

/** Max drop per frame for a smoothness value (0.75 ≈ 0.06, the original feel). */
export const fallFor = (smoothness: number) => 0.2 - 0.185 * smoothness;

const HEX = /^#[0-9a-f]{6}$/i;
const between = (v: unknown, lo: number, hi: number) => typeof v === 'number' && v >= lo && v <= hi;
const oneOf = <T>(v: unknown, list: { value: T }[]) => list.some(o => o.value === v);

/** Keeps only valid stored values, so a stale or edited localStorage entry can't break the page. */
export function sanitize(stored: unknown): Settings {
  const s = (stored && typeof stored === 'object' ? stored : {}) as Record<string, unknown>;
  const pick = <K extends keyof Settings>(key: K, valid: boolean) => (valid ? (s[key] as Settings[K]) : DEFAULTS[key]);
  return {
    format: pick('format', oneOf(s['format'], OPTIONS.format)),
    layout: pick('layout', oneOf(s['layout'], OPTIONS.layout)),
    shape: pick('shape', oneOf(s['shape'], OPTIONS.shape)),
    colorMode: pick('colorMode', oneOf(s['colorMode'], OPTIONS.colorMode)),
    bar: pick('bar', typeof s['bar'] === 'string' && HEX.test(s['bar'])),
    bar2: pick('bar2', typeof s['bar2'] === 'string' && HEX.test(s['bar2'])),
    bg: pick('bg', typeof s['bg'] === 'string' && HEX.test(s['bg'])),
    bars: pick('bars', OPTIONS.bars.includes(s['bars'] as number)),
    sensitivity: pick('sensitivity', between(s['sensitivity'], 0.5, 2)),
    smoothness: pick('smoothness', between(s['smoothness'], 0, 1)),
    glow: pick('glow', typeof s['glow'] === 'boolean'),
    caps: pick('caps', typeof s['caps'] === 'boolean'),
    imageSize: pick('imageSize', between(s['imageSize'], ...RANGES.imageSize)),
    imageX: pick('imageX', between(s['imageX'], ...RANGES.imageX)),
    imageY: pick('imageY', between(s['imageY'], ...RANGES.imageY)),
    vizSize: pick('vizSize', between(s['vizSize'], ...RANGES.vizSize)),
    vizX: pick('vizX', between(s['vizX'], ...RANGES.vizX)),
    vizY: pick('vizY', between(s['vizY'], ...RANGES.vizY)),
  };
}
