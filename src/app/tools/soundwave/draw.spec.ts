import { Layout, Look, Shape, barColor, drawFrame } from './draw';
import { animate } from './spectrum';

const BARS = 32;
const base: Look = {
  layout: 'mirror', shape: 'pixel', colorMode: 'solid', bar: '#ff0000', bar2: '#0000ff', bg: '#00ff00',
  glow: false, caps: false, title: '', imageSize: 1, imageX: 0, imageY: 0, vizSize: 1, vizX: 0, vizY: 0,
};

function canvas(width: number, height: number) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  return c.getContext('2d', { willReadFrequently: true })!;
}

/** Pure-red pixels in the columns [x, x + w). */
const countRed = (ctx: CanvasRenderingContext2D, x = 0, w = ctx.canvas.width) => {
  const px = ctx.getImageData(x, 0, w, ctx.canvas.height).data;
  let n = 0;
  for (let i = 0; i < px.length; i += 4) if (px[i] === 255 && px[i + 1] === 0 && px[i + 2] === 0) n++;
  return n;
};

describe('barColor', () => {
  it('blends a gradient from the first to the second colour', () => {
    const look = { ...base, colorMode: 'gradient' as const };
    expect(barColor(look, 0, 3)).toBe('rgb(255 0 0)');
    expect(barColor(look, 2, 3)).toBe('rgb(0 0 255)');
    expect(barColor(look, 1, 3)).toBe('rgb(128 0 128)');
  });

  it('sweeps hue for rainbow and uses one colour for solid', () => {
    expect(barColor({ ...base, colorMode: 'rainbow' }, 0, 4)).toBe('hsl(0 90% 60%)');
    expect(barColor({ ...base, colorMode: 'rainbow' }, 3, 4)).toBe('hsl(300 90% 60%)');
    expect(barColor(base, 3, 4)).toBe('#ff0000');
  });
});

describe('drawFrame', () => {
  const layouts: Layout[] = ['mirror', 'bottom', 'circle'];
  const shapes: Shape[] = ['pixel', 'solid', 'rounded'];
  const loud = animate(new Float32Array(BARS).fill(1), BARS, 1, 0.1);

  it('keeps the background exact (green screen) and draws bars in every layout, shape and format', () => {
    for (const [w, h] of [[320, 180], [180, 320], [240, 240]]) {
      const ctx = canvas(w, h);
      for (const layout of layouts) {
        for (const shape of shapes) {
          drawFrame(ctx, loud, 0, { ...base, layout, shape, caps: true });
          const label = `${w}x${h} ${layout}/${shape}`;
          expect(Array.from(ctx.getImageData(0, 0, 1, 1).data)).withContext(label).toEqual([0, 255, 0, 255]);
          expect(countRed(ctx)).withContext(label).toBeGreaterThan(500);
        }
      }
    }
  });

  it('adds a glow around the bars without losing the sharp bars', () => {
    const plain = canvas(320, 180);
    drawFrame(plain, loud, 0, { ...base, shape: 'rounded' });
    const glowing = canvas(320, 180);
    drawFrame(glowing, loud, 0, { ...base, shape: 'rounded', glow: true });
    const notBackground = (ctx: CanvasRenderingContext2D) => {
      const px = ctx.getImageData(0, 0, 320, 180).data;
      let n = 0;
      for (let i = 0; i < px.length; i += 4) if (!(px[i] === 0 && px[i + 1] === 255 && px[i + 2] === 0)) n++;
      return n;
    };
    expect(notBackground(glowing)).toBeGreaterThan(notBackground(plain)); // halo spreads past the bars
    expect(countRed(glowing)).toBeGreaterThan(countRed(plain) / 2); // bars still drawn sharp on top
  });

  it('draws a flat line of bars before any audio is loaded', () => {
    const idle = canvas(320, 180);
    drawFrame(idle, undefined, 0, base);
    const full = canvas(320, 180);
    drawFrame(full, loud, 0, base);
    expect(countRed(idle)).toBeGreaterThan(0);
    expect(countRed(idle)).toBeLessThan(countRed(full) / 10);
  });

  it('moves and resizes the bars with size and position', () => {
    // Red pixels in the left / right half of the frame.
    const halves = (look: Look) => {
      const ctx = canvas(320, 180);
      drawFrame(ctx, loud, 0, look);
      return [countRed(ctx, 0, 160), countRed(ctx, 160, 160)];
    };
    const [left, right] = halves(base);
    expect(Math.abs(left - right) / right).toBeLessThan(0.1); // centred by default
    const [movedLeft, movedRight] = halves({ ...base, vizSize: 0.4, vizX: 0.25 });
    expect(movedLeft).toBe(0); // all bars now sit in the right half
    expect(movedRight).toBeGreaterThan(0);
    expect(movedRight).toBeLessThan(right); // and they're smaller
  });

  it('shrinks the background image, showing the background colour around it', () => {
    const img = canvas(4, 4);
    img.fillStyle = '#0000ff';
    img.fillRect(0, 0, 4, 4);
    const ctx = canvas(320, 180);
    drawFrame(ctx, undefined, 0, { ...base, image: img.canvas as unknown as ImageBitmap, imageSize: 0.5 });
    expect(Array.from(ctx.getImageData(0, 0, 1, 1).data)).toEqual([0, 255, 0, 255]);
    expect(Array.from(ctx.getImageData(160, 20, 1, 1).data)).toEqual([0, 0, 255, 255]);
  });

  it('moves the background image with its position', () => {
    const img = canvas(4, 4);
    img.fillStyle = '#0000ff';
    img.fillRect(0, 0, 4, 4);
    const ctx = canvas(320, 180);
    // Half-size image (160x160 at x 80..240) shifted right by a quarter of the width -> x 160..320.
    drawFrame(ctx, undefined, 0, { ...base, image: img.canvas as unknown as ImageBitmap, imageSize: 0.5, imageX: 0.25 });
    expect(Array.from(ctx.getImageData(100, 20, 1, 1).data)).toEqual([0, 255, 0, 255]);
    expect(Array.from(ctx.getImageData(300, 20, 1, 1).data)).toEqual([0, 0, 255, 255]);
  });

  it('covers the frame with a background image', () => {
    const img = canvas(4, 4);
    img.fillStyle = '#0000ff';
    img.fillRect(0, 0, 4, 4);
    const ctx = canvas(320, 180);
    drawFrame(ctx, undefined, 0, { ...base, image: img.canvas as unknown as ImageBitmap });
    expect(Array.from(ctx.getImageData(0, 0, 1, 1).data)).toEqual([0, 0, 255, 255]);
    expect(Array.from(ctx.getImageData(319, 179, 1, 1).data)).toEqual([0, 0, 255, 255]);
  });
});
