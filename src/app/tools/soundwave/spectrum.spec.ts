import { FPS, animate, fft, spectrum } from './spectrum';

const RATE = 48000;
const BARS = 64;
const tone = (hz: number, seconds: number) =>
  Float32Array.from({ length: RATE * seconds }, (_, i) => Math.sin((2 * Math.PI * hz * i) / RATE));
const frame = (levels: Float32Array, f: number, bars = BARS) => Array.from(levels.subarray(f * bars, (f + 1) * bars));
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
  it('gives one row of bars per video frame, for any bar count', () => {
    expect(spectrum([tone(440, 1)], RATE, BARS).length).toBe(FPS * BARS);
    expect(spectrum([tone(440, 1)], RATE, 16).length).toBe(FPS * 16);
  });

  it('puts bass on the left and treble on the right, scaled so the loudest bar is 1', () => {
    const bass = frame(spectrum([tone(100, 1)], RATE, BARS), 15);
    const treble = frame(spectrum([tone(6000, 1)], RATE, BARS), 15);
    expect(loudestBar(bass)).toBeLessThan(BARS / 3);
    expect(loudestBar(treble)).toBeGreaterThan((2 * BARS) / 3);
    expect(Math.max(...bass)).toBeCloseTo(1, 1);
  });

  it('returns zeros for silence and nothing for empty audio', () => {
    expect(spectrum([new Float32Array(RATE / 10)], RATE, BARS).every(v => v === 0)).toBeTrue();
    expect(spectrum([new Float32Array(0)], RATE, BARS).length).toBe(0);
  });
});

describe('animate', () => {
  // 2 bars, 4 frames: loud, then silence.
  const raw = Float32Array.from([1, 0.5, 0, 0, 0, 0, 0, 0]);

  it('drops bars at most `fall` per frame, and caps more slowly', () => {
    const { levels, caps } = animate(raw, 2, 1, 0.25);
    expect(Array.from(levels.filter((_, i) => i % 2 === 0))).toEqual([1, 0.75, 0.5, 0.25]);
    expect(caps[6]).toBeGreaterThan(levels[6]);
    expect(caps[6]).toBeLessThan(1);
  });

  it('scales by sensitivity but never above 1', () => {
    const { levels } = animate(raw, 2, 2, 1);
    expect(levels[0]).toBe(1);
    expect(levels[1]).toBe(1);
    expect(animate(raw, 2, 0.5, 1).levels[1]).toBe(0.25);
  });
});
