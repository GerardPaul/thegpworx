import { Component, DestroyRef, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';
import { projects } from '../../data/projects';
import { ProjectShowcase } from '../../shared/project-showcase';

/**
 * Home "Projects" section: a full-screen panel pinned to the top of the screen while the row of
 * projects slides left as you scroll down. The section is made exactly as tall as the
 * horizontal travel, so vertical scroll distance maps 1:1 to horizontal movement.
 */
@Component({
  selector: 'app-project-rail',
  imports: [ProjectShowcase],
  template: `
    <section #section id="projects" class="relative">
      <div class="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
        <div class="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <h2 class="text-4xl font-semibold sm:text-6xl">Things I've built<span class="text-error">.</span></h2>
        </div>
        <!-- side padding lines the first/last card up with the max-w-6xl content column -->
        <div #track (focusin)="reveal($event)"
             class="mt-10 flex w-max items-center gap-6 sm:gap-16 px-[max(1rem,calc((100vw-72rem)/2+1.5rem))] will-change-transform">
          @for (project of projects; track project.slug) {
            <app-project-showcase class="w-[80vw] max-w-5xl shrink-0 sm:w-[85vw]" [project]="project" />
          }
        </div>
      </div>
    </section>
  `,
})
export class ProjectRail {
  projects = projects;
  private section = viewChild.required<ElementRef<HTMLElement>>('section');
  private track = viewChild.required<ElementRef<HTMLElement>>('track');
  private travel = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const section = this.section().nativeElement;
      const track = this.track().nativeElement;
      let frame = 0;

      const layout = () => {
        this.travel = Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
        section.style.height = `${innerHeight + this.travel}px`;
        position();
      };
      const position = () => {
        const progress = this.travel ? Math.min(1, Math.max(0, -section.getBoundingClientRect().top / this.travel)) : 0;
        track.style.transform = `translateX(${-progress * this.travel}px)`;
      };
      const onScroll = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(position);
      };

      const resize = new ResizeObserver(layout);
      resize.observe(track);
      addEventListener('scroll', onScroll, { passive: true });
      addEventListener('resize', layout);
      destroyRef.onDestroy(() => {
        resize.disconnect();
        removeEventListener('scroll', onScroll);
        removeEventListener('resize', layout);
        cancelAnimationFrame(frame);
      });
    });
  }

  // Keyboard focus on an off-screen card: scroll the page so that card slides into view.
  reveal(e: FocusEvent) {
    const track = this.track().nativeElement;
    track.parentElement!.scrollLeft = 0; // undo the browser's own scroll-into-view; the transform does the moving
    const card = (e.target as HTMLElement).closest('app-project-showcase') as HTMLElement | null;
    if (!card || !this.travel) return;
    const sectionTop = this.section().nativeElement.getBoundingClientRect().top + scrollY;
    const x = Math.min(this.travel, Math.max(0, card.offsetLeft - parseFloat(getComputedStyle(track).paddingLeft)));
    scrollTo({ top: sectionTop + x });
  }
}
