import { Component, input } from '@angular/core';
import { techLogos } from '../data/tech';

/** Tech stack as logos (brand color on hover); names without a logo render as text. */
@Component({
  selector: 'app-tech-logos',
  template: `
    <ul class="flex flex-wrap items-center gap-4">
      @for (t of techs(); track t) {
        <li>
          @if (logos[t]; as logo) {
            <svg role="img" [attr.aria-label]="t" viewBox="0 0 24 24" fill="currentColor" [style.--brand]="logo.color"
                 class="h-7 w-7 text-fg/70 transition hover:scale-110 hover:text-[color:var(--brand)]">
              <title>{{ t }}</title>
              <path [attr.d]="logo.path" />
            </svg>
          } @else {
            <span class="rounded-full border border-line px-3 py-1 text-xs text-fg/80">{{ t }}</span>
          }
        </li>
      }
    </ul>
  `,
  host: { class: 'block' },
})
export class TechLogos {
  techs = input.required<string[]>();
  logos = techLogos;
}
