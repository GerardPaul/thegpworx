export const FPS = 30;
const BARS = 64;

export interface Palette {
  bg: string;
  played: string;
  upcoming: string;
}

/** Loudness (RMS over all channels) of each video frame, scaled so the loudest frame is 1. */
export function envelope(channels: Float32Array[], sampleRate: number, fps = FPS): Float32Array {
  const length = channels[0]?.length ?? 0;
  const hop = sampleRate / fps;
  const out = new Float32Array(Math.ceil(length / hop));
  let max = 0;
  for (let i = 0; i < out.length; i++) {
    const start = Math.floor(i * hop);
    const end = Math.min(length, Math.floor((i + 1) * hop));
    let sum = 0;
    for (const ch of channels) for (let s = start; s < end; s++) sum += ch[s] * ch[s];
    const n = (end - start) * channels.length;
    out[i] = n ? Math.sqrt(sum / n) : 0;
    max = Math.max(max, out[i]);
  }
  if (max > 0) for (let i = 0; i < out.length; i++) out[i] /= max;
  return out;
}

/**
 * Scrolling bar waveform centred on `frame`: one bar per video frame, so it moves one bar per frame.
 * Bars left of centre are already played; heights snap to pixel blocks to match the site's pixel theme.
 */
export function drawFrame(ctx: CanvasRenderingContext2D, env: Float32Array, frame: number, colors: Palette) {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, width, height);

  const slot = width / BARS;
  const barWidth = Math.max(1, Math.floor(slot * 0.6));
  const block = Math.max(2, Math.round(height / 90));
  const mid = height / 2;
  for (let j = 0; j < BARS; j++) {
    const i = frame - BARS / 2 + j;
    if (i < 0 || i >= env.length) continue;
    const half = Math.max(1, Math.round((env[i] * height * 0.4) / block)) * block;
    ctx.fillStyle = i <= frame ? colors.played : colors.upcoming;
    ctx.fillRect(Math.round(j * slot + (slot - barWidth) / 2), Math.round(mid - half), barWidth, half * 2);
  }
}
