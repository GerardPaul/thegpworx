import { Animated } from './spectrum';

export type Layout = 'mirror' | 'bottom' | 'circle';
export type Shape = 'pixel' | 'solid' | 'rounded';
export type ColorMode = 'solid' | 'gradient' | 'rainbow';

export interface Look {
  layout: Layout;
  shape: Shape;
  colorMode: ColorMode;
  bar: string; // #rrggbb
  bar2: string; // gradient end colour
  bg: string;
  glow: boolean;
  caps: boolean;
  title: string;
  image?: ImageBitmap;
  imageSize: number; // 1 = covers the frame
  imageX: number; // offset as a fraction of frame width, 0 = centred
  imageY: number; // offset as a fraction of frame height, 0 = centred
  vizSize: number; // 1 = default bar size
  vizX: number; // offset as a fraction of frame width, 0 = centred
  vizY: number; // offset as a fraction of frame height, 0 = centred
}

export const TITLE_FONT = '"Pixelify Sans", sans-serif';

const rgb = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));

/** Colour of bar b of n: one colour, a blend from `bar` to `bar2`, or a rainbow sweep. */
export function barColor(look: Look, b: number, n: number): string {
  const t = n > 1 ? b / (n - 1) : 0;
  if (look.colorMode === 'rainbow') return `hsl(${Math.round(t * 300)} 90% 60%)`;
  if (look.colorMode === 'solid') return look.bar;
  const [a, c] = [rgb(look.bar), rgb(look.bar2)];
  return `rgb(${a.map((v, i) => Math.round(v + (c[i] - v) * t)).join(' ')})`;
}

const CIRCLE_TILT = (25 * Math.PI) / 180;

let glowLayer: OffscreenCanvasRenderingContext2D | undefined;

/** Draws one video frame (background, title, bars, caps) on ctx's canvas, whatever its size. */
export function drawFrame(ctx: CanvasRenderingContext2D, anim: Animated | undefined, frame: number, look: Look) {
  const { width, height } = ctx.canvas;
  const min = Math.min(width, height);
  ctx.resetTransform();
  ctx.fillStyle = look.bg;
  ctx.fillRect(0, 0, width, height);
  if (look.image) {
    const { width: iw, height: ih } = look.image;
    const scale = Math.max(width / iw, height / ih) * look.imageSize; // 1 = cover
    const x = (width - iw * scale) / 2 + look.imageX * width;
    const y = (height - ih * scale) / 2 + look.imageY * height;
    ctx.drawImage(look.image, x, y, iw * scale, ih * scale);
  }

  if (!look.glow) return drawForeground(ctx, anim, frame, look, width, height);
  // Glow: draw bars once on a transparent layer, then paint it blurred and sharp. One blur per
  // frame instead of a shadow per bar, which was slower than real time for rounded bars.
  if (glowLayer?.canvas.width !== width || glowLayer.canvas.height !== height) {
    glowLayer = new OffscreenCanvas(width, height).getContext('2d')!;
  }
  glowLayer.clearRect(0, 0, width, height);
  drawForeground(glowLayer, anim, frame, look, width, height);
  ctx.filter = `blur(${Math.round(min * 0.015)}px)`;
  ctx.drawImage(glowLayer.canvas, 0, 0);
  ctx.filter = 'none';
  ctx.drawImage(glowLayer.canvas, 0, 0);
}

function drawForeground(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  anim: Animated | undefined, frame: number, look: Look, width: number, height: number,
) {
  const min = Math.min(width, height);
  const paint = (color: string) => (ctx.fillStyle = color);
  ctx.resetTransform();

  if (look.title) {
    paint(barColor(look, 0, 1));
    ctx.font = `600 ${Math.round(min * 0.07)}px ${TITLE_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(look.title, width / 2, min * 0.06, width * 0.9);
  }

  // Bars only (not the title) move and scale around the frame centre; the next frame resets the transform.
  ctx.translate(width / 2 + look.vizX * width, height / 2 + look.vizY * height);
  ctx.scale(look.vizSize, look.vizSize);
  ctx.translate(-width / 2, -height / 2);

  const bars = anim?.bars ?? 64;
  const level = (b: number) => anim?.levels[frame * bars + b] ?? 0;
  const cap = (b: number) => anim?.caps[frame * bars + b] ?? 0;

  // 'pixel' snaps lengths to blocks (matches the site's pixel theme); the others are smooth.
  const block = Math.max(2, Math.round(min / 90));
  const size = (v: number, max: number) =>
    look.shape === 'pixel' ? Math.max(1, Math.round((v * max) / block)) * block : Math.max(block, v * max);
  const rect = (x: number, y: number, w: number, h: number) => {
    ctx.beginPath();
    if (look.shape === 'rounded') ctx.roundRect(x, y, w, h, w / 2);
    else ctx.rect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    ctx.fill();
  };
  // Title sits at the top, so leave room for it.
  const top = look.title ? min * 0.18 : min * 0.06;

  if (look.layout === 'circle') {
    const cy = (height + top) / 2;
    const room = Math.min(width / 2, height - cy, cy - top);
    const radius = room * 0.45;
    const maxLen = room * 0.5;
    const barWidth = Math.max(2, ((Math.PI * radius) / bars) * 0.6);
    for (let b = 0; b < bars; b++) {
      paint(barColor(look, b, bars));
      const len = size(level(b), maxLen);
      const capAt = size(cap(b), maxLen) + block;
      // Right half runs bass (top) to treble (bottom); the left half is the same sweep turned 180°,
      // so its bass sits at the bottom. The whole ring is tilted 25° because it looked better.
      const a = ((b + 0.5) * Math.PI) / bars + CIRCLE_TILT;
      for (const angle of [a, a + Math.PI]) {
        ctx.save();
        ctx.translate(width / 2, cy);
        ctx.rotate(angle);
        rect(-barWidth / 2, -radius - len, barWidth, len);
        if (look.caps) rect(-barWidth / 2, -radius - capAt - block, barWidth, block);
        ctx.restore();
      }
    }
    return;
  }

  const pad = width * 0.05;
  const slot = (width - 2 * pad) / bars;
  const barWidth = Math.max(1, slot * 0.6);
  for (let b = 0; b < bars; b++) {
    paint(barColor(look, b, bars));
    const x = pad + b * slot + (slot - barWidth) / 2;
    if (look.layout === 'bottom') {
      const base = height * 0.9;
      const max = (base - top) * 0.9;
      const h = size(level(b), max);
      rect(x, base - h, barWidth, h);
      if (look.caps) rect(x, base - size(cap(b), max) - 2 * block, barWidth, block);
    } else {
      const mid = (height + top) / 2;
      const max = (height - mid) * 0.8;
      const half = size(level(b), max);
      rect(x, mid - half, barWidth, half * 2);
      if (look.caps) {
        const c = size(cap(b), max) + block;
        rect(x, mid - c - block, barWidth, block);
        rect(x, mid + c, barWidth, block);
      }
    }
  }
}
