import { BARS, FPS, Layout, Shape, drawFrame, fft, spectrum } from './spectrum';

const RATE = 48000;
const tone = (hz: number, seconds: number) =>
  Float32Array.from({ length: RATE * seconds }, (_, i) => Math.sin((2 * Math.PI * hz * i) / RATE));
const frame = (levels: Float32Array, f: number) => Array.from(levels.subarray(f * BARS, (f + 1) * BARS));
const loudestBar = (bars: number[]) => bars.indexOf(Math.max(...bars));

describe('fft', () => {
  it('puts a pure cosine in its frequency bin', () => {
    const n = 16;
    const re = Float64Array.from({ length: n }, (_, i) => Math.cos((2 * Math.PI * 3 * i) / n));
    const im = new Float64Array(n);
    fft(re, im);
    const mags = Array.from(re, (r, k) => Math.hypot(r, im[k]));
    expect(mags[3]).toBeCloseTo(n / 2);
    expect(mags[13]).toBeCloseTo(n / 2);
    mags.forEach((m, k) => { if (k !== 3 && k !== 13) expect(m).toBeCloseTo(0); });
  });
});

describe('spectrum', () => {
  it('gives one row of bars per video frame', () => {
    expect(spectrum([tone(440, 1)], RATE).length).toBe(FPS * BARS);
  });

  it('puts bass on the left and treble on the right, scaled so the loudest bar is 1', () => {
    const bass = frame(spectrum([tone(100, 1)], RATE), 15);
    const treble = frame(spectrum([tone(6000, 1)], RATE), 15);
    expect(loudestBar(bass)).toBeLessThan(BARS / 3);
    expect(loudestBar(treble)).toBeGreaterThan((2 * BARS) / 3);
    expect(Math.max(...bass)).toBeCloseTo(1, 1);
  });

  it('lets bars fall gradually when the sound stops', () => {
    const samples = new Float32Array(RATE); // 1 s: tone for the first half, then silence
    samples.set(tone(1000, 0.5));
    const levels = spectrum([samples], RATE);
    const bar = loudestBar(frame(levels, 10));
    const after = [16, 17, 18].map(f => levels[f * BARS + bar]);
    expect(after[0]).toBeGreaterThan(0);
    expect(after[1]).toBeLessThan(after[0]);
    expect(after[2]).toBeLessThan(after[1]);
  });

  it('returns zeros for silence and nothing for empty audio', () => {
    expect(spectrum([new Float32Array(RATE / 10)], RATE).every(v => v === 0)).toBeTrue();
    expect(spectrum([new Float32Array(0)], RATE).length).toBe(0);
  });
});

describe('drawFrame', () => {
  const layouts: Layout[] = ['mirror', 'bottom', 'circle'];
  const shapes: Shape[] = ['pixel', 'solid', 'rounded'];

  it('fills the background with the exact colour (green screen) and draws bars in the bar colour', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 180;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    const levels = new Float32Array(BARS).fill(1);
    for (const layout of layouts) {
      for (const shape of shapes) {
        drawFrame(ctx, levels, 0, { layout, shape, bar: '#ff0000', bg: '#00ff00' });
        const px = Array.from(ctx.getImageData(0, 0, 320, 180).data);
        const count = (r: number, g: number) => px.filter((_, i) => i % 4 === 0 && px[i] === r && px[i + 1] === g).length;
        const label = `${layout}/${shape}`;
        expect(Array.from(ctx.getImageData(0, 0, 1, 1).data)).withContext(label).toEqual([0, 255, 0, 255]);
        expect(count(255, 0)).withContext(label).toBeGreaterThan(1000);
      }
    }
  });
});
