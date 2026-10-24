import { Component, DestroyRef, afterNextRender, inject, signal } from '@angular/core';

/** Floating "back to top" arrow, shown once the page is scrolled half a screen down. */
@Component({
  selector: 'app-scroll-top',
  template: `
    <button type="button" (click)="toTop()" aria-label="Back to top"
            class="btn btn-secondary fixed bottom-6 right-6 z-30 px-3 py-3 transition-opacity duration-300"
            [class.invisible]="!visible()" [class.opacity-0]="!visible()">
      <!-- Arrow: Pixelarticons (MIT, Gerrit Halfmann) -->
      <svg class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M11 20h2V4h-2zm2-12h2V6h-2zm2 2h2V8h-2zm2 2h2v-2h-2zm-6-4H9V6h2z" /><path d="M15 10H7V8h8zm2 2H5v-2h12z" />
      </svg>
    </button>
  `,
})
export class ScrollTop {
  visible = signal(false);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const update = () => this.visible.set(scrollY > innerHeight / 2);
      addEventListener('scroll', update, { passive: true });
      destroyRef.onDestroy(() => removeEventListener('scroll', update));
      update();
    });
  }

  // Smooth unless the visitor prefers reduced motion (html scroll-behavior in styles.css).
  toTop() {
    scrollTo({ top: 0 });
  }
}
