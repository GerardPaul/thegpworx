import { Component, DestroyRef, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';

const CELL = 32;               // px, grows on huge screens so the cell count stays under MAX_CELLS
const MAX_CELLS = 4000;
const MAX_DPR = 2;
const BREATH_MIN = 0.015;      // fg alpha range of the breathing tiles
const BREATH_MAX = 0.045;
const BREATH_MS = 5000;        // one breath
const WAVE_ALPHA = 0.14;       // accent alpha at the crest of a ripple
const WIDTH = 40;              // px, thickness of a ripple ring / idle band
const RIPPLE_SPEED = 0.4;      // px per ms
const RIPPLE_LIFE = 2000;      // ms
const MAX_RIPPLES = 12;
const IDLE_AFTER = 4000;       // ms without pointer movement before the idle wave starts
const IDLE_EVERY = 6000;       // ms from one idle sweep to the next
const IDLE_SWEEP = 3000;       // ms for one sweep to cross the screen
const LEVELS = 4;
const FRAME_MS = 1000 / 30;    // 30 fps: the motion is slow and stepped, 60 would only double the cost

export interface Ripple { x: number; y: number; t0: number }

/** Brightness of a band centred at `front`, for a point `d` px along the same axis. */
export const band = (d: number, front: number) => Math.exp(-(((d - front) / WIDTH) ** 2));

/** A ripple's expanding ring at distance d: peaks on the ring, fades out over its life. */
export function ring(d: number, age: number): number {
  if (age < 0 || age > RIPPLE_LIFE) return 0;
  return band(d, age * RIPPLE_SPEED) * (1 - age / RIPPLE_LIFE);
}

/** Front position of the idle sweep along the top-left → bottom-right diagonal, or null between sweeps. */
export function idleFront(idleMs: number, diagonal: number): number | null {
  if (idleMs < IDLE_AFTER) return null;
  const t = (idleMs - IDLE_AFTER) % IDLE_EVERY;
  return t > IDLE_SWEEP ? null : (t / IDLE_SWEEP) * (diagonal + 2 * WIDTH) - WIDTH;
}

/** Step 0..LEVELS for a 0..1 value, so colour changes in pixel-y jumps instead of a smooth fade. */
const level = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * LEVELS);
export const quantize = (v: number) => level(v) / LEVELS;

export const cellSize = (w: number, h: number) => Math.max(CELL, Math.ceil(Math.sqrt((w * h) / MAX_CELLS)));

const rgbVar = (name: string) => `rgb(${getComputedStyle(document.documentElement).getPropertyValue(name).trim()})`;

/**
 * Animated pixel background: tiles breathe, the pointer sends accent ripples through them, and an
 * idle wave sweeps top-left to bottom-right. Under prefers-reduced-motion it draws one static frame.
 */
@Component({
  selector: 'app-pixel-field',
  template: `<canvas #canvas aria-hidden="true" class="pointer-events-none fixed inset-0 -z-10 h-full w-full"></canvas>`,
})
export class PixelField {
  private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const canvas = this.canvas().nativeElement;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const motion = matchMedia('(prefers-reduced-motion: reduce)');
      // Touch devices skip the always-on breathing to save battery; taps and the idle wave still animate.
      const coarse = matchMedia('(pointer: coarse)');

      let w = 0, h = 0, cell = CELL, cols = 0, rows = 0;
      let phases = new Float32Array(0);
      let fg = '', accent = '';
      let ripples: Ripple[] = [];
      let lastMove = performance.now();
      let frame = 0;

      const readColors = () => { fg = rgbVar('--fg'); accent = rgbVar('--accent'); };

      const resize = () => {
        const dpr = Math.min(devicePixelRatio || 1, MAX_DPR);
        w = canvas.clientWidth;
        h = canvas.clientHeight;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cell = cellSize(w, h);
        cols = Math.ceil(w / cell);
        rows = Math.ceil(h / cell);
        phases = Float32Array.from({ length: cols * rows }, () => Math.random() * Math.PI * 2);
      };

      // Cells grouped by brightness step, so each step is one path + one fill instead of a fill per cell.
      const buckets = Array.from({ length: LEVELS + 1 }, () => [] as number[]);
      const fillBuckets = (color: string, alphaAt: (q: number) => number, from: number) => {
        const size = cell - 1; // 1px gap between tiles reads as the grid
        ctx.fillStyle = color;
        for (let l = from; l <= LEVELS; l++) {
          const cells = buckets[l];
          if (!cells.length) continue;
          ctx.globalAlpha = alphaAt(l / LEVELS);
          ctx.beginPath();
          for (const i of cells) ctx.rect((i % cols) * cell + 1, Math.floor(i / cols) * cell + 1, size, size);
          ctx.fill();
          cells.length = 0;
        }
        ctx.globalAlpha = 1;
      };

      const draw = (t: number, animated: boolean) => {
        ctx.clearRect(0, 0, w, h);
        ripples = ripples.filter(r => t - r.t0 <= RIPPLE_LIFE);
        const front = animated ? idleFront(t - lastMove, (w + h) / Math.SQRT2) : null;
        const breathe = animated && !coarse.matches;
        const breath = (t / BREATH_MS) * Math.PI * 2;

        for (let i = 0; i < cols * rows; i++) {
          buckets[breathe ? level(0.5 + 0.5 * Math.sin(breath + phases[i])) : LEVELS / 2].push(i);
        }
        fillBuckets(fg, q => BREATH_MIN + q * (BREATH_MAX - BREATH_MIN), 0);

        if (animated && (ripples.length || front !== null)) {
          for (let r = 0, i = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++, i++) {
              const x = (c + 0.5) * cell, y = (r + 0.5) * cell;
              let v = front === null ? 0 : band((x + y) / Math.SQRT2, front);
              for (const p of ripples) v += ring(Math.hypot(x - p.x, y - p.y), t - p.t0);
              const l = level(v);
              if (l) buckets[l].push(i);
            }
          }
          fillBuckets(accent, q => q * WAVE_ALPHA, 1);
        }
      };

      let lastDraw = -Infinity;
      let wasLive = true;
      const tick = (t: number) => {
        frame = requestAnimationFrame(tick);
        if (t - lastDraw < FRAME_MS - 2) return; // small slack so 60Hz screens land on every 2nd frame
        // Without breathing (touch), nothing moves between ripples and sweeps; skip those frames.
        const live = !coarse.matches || ripples.length > 0 || idleFront(t - lastMove, (w + h) / Math.SQRT2) !== null;
        if (live || wasLive) { draw(t, true); lastDraw = t; }
        wasLive = live;
      };
      const stop = () => { cancelAnimationFrame(frame); frame = 0; };
      const sync = () => {
        stop();
        wasLive = true;
        if (motion.matches || document.hidden) draw(performance.now(), false);
        else frame = requestAnimationFrame(tick);
      };
      const redraw = () => { if (!frame) draw(performance.now(), false); };

      const addRipple = (e: PointerEvent) => {
        const t = performance.now();
        lastMove = t;
        const last = ripples.at(-1);
        // Throttle so a fast drag leaves a wake of rings, not hundreds of them.
        if (last && t - last.t0 < 80 && Math.hypot(e.clientX - last.x, e.clientY - last.y) < cell * 1.5) return;
        ripples.push({ x: e.clientX, y: e.clientY, t0: t });
        if (ripples.length > MAX_RIPPLES) ripples.shift();
      };
      // On touch, pointermove means scrolling, so only a tap makes a ripple.
      const onMove = (e: PointerEvent) => { if (e.pointerType !== 'touch') addRipple(e); };
      const onResize = () => { resize(); redraw(); };
      const onTheme = () => { readColors(); redraw(); };

      readColors();
      resize();
      sync();

      const themeObserver = new MutationObserver(onTheme);
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      addEventListener('pointermove', onMove, { passive: true });
      addEventListener('pointerdown', addRipple, { passive: true });
      addEventListener('resize', onResize);
      document.addEventListener('visibilitychange', sync);
      motion.addEventListener('change', sync);
      coarse.addEventListener('change', sync);

      destroyRef.onDestroy(() => {
        stop();
        themeObserver.disconnect();
        removeEventListener('pointermove', onMove);
        removeEventListener('pointerdown', addRipple);
        removeEventListener('resize', onResize);
        document.removeEventListener('visibilitychange', sync);
        motion.removeEventListener('change', sync);
        coarse.removeEventListener('change', sync);
      });
    });
  }
}
