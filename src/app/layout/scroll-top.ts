import { Component, DestroyRef, afterNextRender, inject, signal } from '@angular/core';

/** Floating "back to top" arrow, shown once the page is scrolled half a screen down. */
@Component({
  selector: 'app-scroll-top',
  template: `
    <button type="button" (click)="toTop()" aria-label="Back to top"
            class="btn btn-secondary fixed bottom-6 right-6 z-30 px-3 py-3 transition-opacity duration-300"
            [class.invisible]="!visible()" [class.opacity-0]="!visible()">
      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
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
