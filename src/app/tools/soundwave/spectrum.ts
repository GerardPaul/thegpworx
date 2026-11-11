export const FPS = 30;
const FFT_SIZE = 2048; // ~23 Hz per bin at 48 kHz, enough to separate bass bars
const MIN_HZ = 50;
const MAX_HZ = 16000;
const RANGE_DB = 50; // levels this far below the recording's loudest point show as zero
const CAP_FALL = 0.008; // peak caps drift down much slower than bars

/** In-place iterative radix-2 FFT; length must be a power of two. */
export function fft(re: Float64Array, im: Float64Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let t = re[i]; re[i] = re[j]; re[j] = t;
      t = im[i]; im[i] = im[j]; im[j] = t;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1;
    const wr = Math.cos(-2 * Math.PI / len);
    const wi = Math.sin(-2 * Math.PI / len);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < half; k++) {
        const a = i + k, b = a + half;
        const tr = re[b] * cr - im[b] * ci;
        const ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti;
        re[a] += tr; im[a] += ti;
        const next = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = next;
      }
    }
  }
}

/**
 * Raw bar levels (0..1) for every video frame: frame f's bars are at [f * bars, (f + 1) * bars),
 * bass on the left. Bars are log-spaced in frequency so each covers a similar musical range.
 * This is the slow step (one FFT per frame); `animate` turns it into what's drawn.
 */
export function spectrum(channels: Float32Array[], sampleRate: number, bars: number, fps = FPS): Float32Array {
  const length = channels[0]?.length ?? 0;
  const frames = Math.ceil(length / (sampleRate / fps));
  const out = new Float32Array(frames * bars);
  const nyquistBin = FFT_SIZE / 2;
  const binHz = sampleRate / FFT_SIZE;
  const maxHz = Math.min(MAX_HZ, sampleRate / 2);

  const edges = Array.from({ length: bars + 1 }, (_, b) => Math.round((MIN_HZ * (maxHz / MIN_HZ) ** (b / bars)) / binHz));
  for (let b = 1; b <= bars; b++) edges[b] = Math.max(edges[b], edges[b - 1] + 1); // at least one bin per bar
  // +3 dB per octave above 1 kHz (and less below) so treble, which is naturally quieter, still moves.
  const tilt = edges.slice(0, bars).map((e, b) => 3 * Math.log2((((e + edges[b + 1]) / 2) * binHz) / 1000));

  const hann = Float64Array.from({ length: FFT_SIZE }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (FFT_SIZE - 1)));
  const re = new Float64Array(FFT_SIZE);
  const im = new Float64Array(FFT_SIZE);
  let peak = -Infinity;
  for (let f = 0; f < frames; f++) {
    const start = Math.round((f * sampleRate) / fps) - FFT_SIZE / 2; // window centred on the frame's time
    for (let i = 0; i < FFT_SIZE; i++) {
      const s = start + i;
      let v = 0;
      if (s >= 0 && s < length) for (const ch of channels) v += ch[s];
      re[i] = (v / channels.length) * hann[i];
      im[i] = 0;
    }
    fft(re, im);
    for (let b = 0; b < bars; b++) {
      let power = 0;
      for (let k = edges[b]; k < Math.min(edges[b + 1], nyquistBin); k++) power = Math.max(power, re[k] * re[k] + im[k] * im[k]);
      const db = 10 * Math.log10(power) + tilt[b];
      out[f * bars + b] = db;
      if (db > peak) peak = db;
    }
  }

  if (!Number.isFinite(peak)) return out.fill(0);
  const floor = peak - RANGE_DB;
  for (let i = 0; i < out.length; i++) out[i] = Math.min(1, Math.max(0, (out[i] - floor) / RANGE_DB));
  return out;
}

export interface Animated {
  bars: number;
  levels: Float32Array; // bar heights 0..1, same layout as `spectrum`
  caps: Float32Array; // peak cap heights 0..1
}

/**
 * Applies sensitivity (gain) and smoothing: bars jump up instantly but drop at most `fall` per frame,
 * and peak caps sit on the highest recent level and drift down slowly. Cheap, so it reruns on every slider move.
 */
export function animate(raw: Float32Array, bars: number, gain: number, fall: number): Animated {
  const levels = new Float32Array(raw.length);
  const caps = new Float32Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    const level = Math.min(1, raw[i] * gain);
    levels[i] = i >= bars ? Math.max(level, levels[i - bars] - fall) : level;
    caps[i] = i >= bars ? Math.max(levels[i], caps[i - bars] - CAP_FALL) : levels[i];
  }
  return { bars, levels, caps };
}
