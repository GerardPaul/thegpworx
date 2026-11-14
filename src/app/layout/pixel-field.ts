import { Component, DestroyRef, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';

const CELL = 32;               // px, grows on huge screens so the cell count stays under MAX_CELLS
const MAX_CELLS = 4000;
const MAX_DPR = 2;
const GRID_ALPHA = 0.03;       // fg alpha of every tile
const LEVELS = 4;

// Glow: grid lines light up around a point that eases after the cursor.
const LINE_ALPHA = 0.8;
const GLOW_RADIUS = 3.5;       // tiles
const FOLLOW_MS = 90;          // how far the glow lags behind the cursor
const GLOW_FADE_MS = 300;      // fade in / out
const IDLE_AFTER_MS = 500;     // cursor still this long = idle, the glow starts to pulse
const PULSE_MS = 2000;         // one pulse
const PULSE_MIN = 0.35;        // glow strength at the dip of a pulse
const IDLE_FRAME_MS = 1000 / 30; // a slow pulse looks smooth at 30 fps
// Dust: random tiles near the cursor flash while it moves.
const DUST_ALPHA = 0.35;
const DUST_RADIUS = 3;         // tiles
const DUST_EVERY_PX = 10;      // one speck per this many px of cursor travel
const DUST_LIFE_MS = [400, 1000];

/** 1 at the centre, 0 at `radius` and beyond. */
export const falloff = (d: number, radius: number) => Math.max(0, 1 - d / radius);

/** Glow strength `idleMs` into an idle pulse: starts full, dips to PULSE_MIN, back to full every PULSE_MS. */
export const pulse = (idleMs: number) => PULSE_MIN + (1 - PULSE_MIN) * (0.5 + 0.5 * Math.cos((idleMs / PULSE_MS) * Math.PI * 2));

/** Step 0..LEVELS for a 0..1 value, so colour changes in pixel-y jumps instead of a smooth fade. */
const level = (v: number) => Math.ceil(Math.min(1, Math.max(0, v)) * LEVELS);

export const cellSize = (w: number, h: number) => Math.max(CELL, Math.ceil(Math.sqrt((w * h) / MAX_CELLS)));

const rgbVar = (name: string) => `rgb(${getComputedStyle(document.documentElement).getPropertyValue(name).trim()})`;

/**
 * Pixel background: a faint tile grid. Around the cursor the grid lines glow, moving sprinkles pixel
 * dust, and a resting cursor keeps the glow pulsing. Under prefers-reduced-motion the grid stays still.
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

      let w = 0, h = 0, cell = CELL, cols = 0, rows = 0;
      let dust = new Float32Array(0);  // 0..1 per tile
      let decay = new Float32Array(0); // per-tile fade speed, 1/ms
      let fg = '', accent = '';
      let frame = 0, prevT = 0, lastDraw = 0, lastKey = '';
      // hovering: a mouse is over the page, so the glow stays (and pulses) until it leaves.
      const pointer = { x: 0, y: 0, t: -Infinity, hovering: false };
      const glow = { x: 0, y: 0, i: 0, strength: 0 };
      let lastDust: { x: number; y: number } | null = null, dustCarry = 0, dustLit = false;

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
        dust = new Float32Array(cols * rows);
        decay = new Float32Array(cols * rows);
      };

      // Tiles grouped by brightness step, so each step is one path + one fill/stroke.
      const buckets = Array.from({ length: LEVELS + 1 }, () => [] as number[]);
      const paint = (alpha: number, outline: boolean) => {
        ctx.fillStyle = ctx.strokeStyle = accent;
        ctx.lineWidth = 1;
        for (let l = 1; l <= LEVELS; l++) {
          const cells = buckets[l];
          if (!cells.length) continue;
          ctx.globalAlpha = (l / LEVELS) * alpha;
          ctx.beginPath();
          for (const i of cells) {
            const x = (i % cols) * cell, y = Math.floor(i / cols) * cell;
            // An outline sits on the 1px gap between tiles, i.e. on the grid line itself.
            if (outline) ctx.rect(x + 0.5, y + 0.5, cell, cell);
            else ctx.rect(x + 1, y + 1, cell - 1, cell - 1);
          }
          if (outline) ctx.stroke(); else ctx.fill();
          cells.length = 0;
        }
        ctx.globalAlpha = 1;
      };

      const draw = () => {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = fg;
        ctx.globalAlpha = GRID_ALPHA;
        ctx.beginPath();
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) ctx.rect(c * cell + 1, r * cell + 1, cell - 1, cell - 1);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (dustLit) {
          for (let i = 0; i < dust.length; i++) if (dust[i] > 0) buckets[level(dust[i])].push(i);
          paint(DUST_ALPHA, false);
        }

        if (glow.strength > 0) {
          const reach = GLOW_RADIUS * cell;
          const c0 = Math.max(0, Math.floor((glow.x - reach) / cell)), c1 = Math.min(cols - 1, Math.floor((glow.x + reach) / cell));
          const r0 = Math.max(0, Math.floor((glow.y - reach) / cell)), r1 = Math.min(rows - 1, Math.floor((glow.y + reach) / cell));
          for (let r = r0; r <= r1; r++) {
            for (let c = c0; c <= c1; c++) {
              const l = level(falloff(Math.hypot((c + 0.5) * cell - glow.x, (r + 0.5) * cell - glow.y), reach));
              if (l) buckets[l].push(r * cols + c);
            }
          }
          // The rings stay stepped (pixel look); fade and pulse scale their alpha smoothly.
          paint(LINE_ALPHA * glow.strength, true);
        }
      };

      /** Advances everything by dt ms; returns whether anything still needs frames. */
      const update = (t: number, dt: number): boolean => {
        const sinceMove = t - pointer.t;
        const resting = pointer.hovering && sinceMove > IDLE_AFTER_MS;
        // At rest the glow settles on the centre of the cursor's tile, so the lit area is symmetric.
        const tx = resting ? (Math.floor(pointer.x / cell) + 0.5) * cell : pointer.x;
        const ty = resting ? (Math.floor(pointer.y / cell) + 0.5) * cell : pointer.y;
        const k = 1 - Math.exp(-dt / FOLLOW_MS);
        glow.x += (tx - glow.x) * k;
        glow.y += (ty - glow.y) * k;
        const on = pointer.hovering || sinceMove < IDLE_AFTER_MS;
        const step = dt / GLOW_FADE_MS;
        glow.i = on ? Math.min(1, glow.i + step) : Math.max(0, glow.i - step);
        glow.strength = glow.i * (resting ? pulse(sinceMove - IDLE_AFTER_MS) : 1);

        dustLit = false;
        for (let i = 0; i < dust.length; i++) {
          if (dust[i] > 0) { dust[i] = Math.max(0, dust[i] - dt * decay[i]); dustLit ||= dust[i] > 0; }
        }
        return on || glow.i > 0 || dustLit;
      };

      const tick = (t: number) => {
        frame = 0;
        // rAF's timestamp can be slightly before the performance.now() taken in start().
        const dt = Math.max(0, t - prevT);
        const idle = !dustLit && t - pointer.t > IDLE_AFTER_MS + GLOW_FADE_MS;
        if (idle && t - lastDraw < IDLE_FRAME_MS) { frame = requestAnimationFrame(tick); return; }
        prevT = t;
        const live = update(t, dt);
        // Skip frames that would look the same (glow settled, strength change too small to see).
        const key = `${Math.round(glow.x)},${Math.round(glow.y)},${Math.round(glow.strength * 100)}`;
        if (dustLit || key !== lastKey) { draw(); lastKey = key; }
        lastDraw = t;
        if (live) frame = requestAnimationFrame(tick);
      };
      const start = () => {
        if (frame || motion.matches || document.hidden) return;
        prevT = performance.now();
        frame = requestAnimationFrame(tick);
      };
      const stop = () => { cancelAnimationFrame(frame); frame = 0; };

      const tileAt = (c: number, r: number) => (c >= 0 && c < cols && r >= 0 && r < rows ? r * cols + c : -1);
      const sprinkle = (x: number, y: number) => {
        dustCarry += lastDust ? Math.hypot(x - lastDust.x, y - lastDust.y) : DUST_EVERY_PX;
        lastDust = { x, y };
        for (; dustCarry >= DUST_EVERY_PX; dustCarry -= DUST_EVERY_PX) {
          const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * DUST_RADIUS * cell;
          const i = tileAt(Math.floor((x + Math.cos(a) * d) / cell), Math.floor((y + Math.sin(a) * d) / cell));
          const v = 0.5 + Math.random() * 0.5, [lo, hi] = DUST_LIFE_MS;
          if (i >= 0 && v > dust[i]) { dust[i] = v; decay[i] = v / (lo + Math.random() * (hi - lo)); dustLit = true; }
        }
      };

      const onPointer = (e: PointerEvent) => {
        if (motion.matches) return;
        if (glow.i === 0) { glow.x = e.clientX; glow.y = e.clientY; }
        pointer.x = e.clientX; pointer.y = e.clientY; pointer.t = performance.now();
        // A touch has no resting cursor, so after a tap the glow fades instead of pulsing.
        pointer.hovering = e.pointerType !== 'touch';
        sprinkle(e.clientX, e.clientY);
        start();
      };
      // On touch, pointermove means scrolling, so only a tap reacts.
      const onMove = (e: PointerEvent) => { if (e.pointerType !== 'touch') onPointer(e); };
      const onDown = (e: PointerEvent) => { if (e.pointerType === 'touch') lastDust = null; onPointer(e); };
      const onLeave = () => { pointer.hovering = false; lastDust = null; };
      const onResize = () => { resize(); draw(); };
      const onTheme = () => { readColors(); draw(); };
      const onVisibility = () => { if (document.hidden) stop(); else start(); };
      const onMotion = () => { if (motion.matches) { stop(); dust.fill(0); dustLit = false; glow.i = glow.strength = 0; draw(); } };

      readColors();
      resize();
      draw();

      const themeObserver = new MutationObserver(onTheme);
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      addEventListener('pointermove', onMove, { passive: true });
      addEventListener('pointerdown', onDown, { passive: true });
      document.documentElement.addEventListener('pointerleave', onLeave);
      addEventListener('blur', onLeave);
      addEventListener('resize', onResize);
      document.addEventListener('visibilitychange', onVisibility);
      motion.addEventListener('change', onMotion);

      destroyRef.onDestroy(() => {
        stop();
        themeObserver.disconnect();
        removeEventListener('pointermove', onMove);
        removeEventListener('pointerdown', onDown);
        document.documentElement.removeEventListener('pointerleave', onLeave);
        removeEventListener('blur', onLeave);
        removeEventListener('resize', onResize);
        document.removeEventListener('visibilitychange', onVisibility);
        motion.removeEventListener('change', onMotion);
      });
    });
  }
}
