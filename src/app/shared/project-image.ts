import { Component, input } from '@angular/core';

/** A project screenshot, or a styled placeholder until one is provided. */
@Component({
  selector: 'app-project-image',
  template: `
    @if (src(); as src) {
      <img [src]="src" [alt]="alt()" loading="lazy" class="h-full w-full object-contain p-4 sm:p-8">
    } @else {
      <div class="flex h-full w-full items-center justify-center bg-gradient-to-br from-fg/10 to-transparent p-6 text-center">
        <span class="text-lg font-semibold text-muted">{{ alt() }}</span>
      </div>
    }
  `,
  host: { class: 'block aspect-video overflow-hidden rounded-2xl border border-line bg-surface' },
})
export class ProjectImage {
  src = input<string>();
  alt = input.required<string>();
}
