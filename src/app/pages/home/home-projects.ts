import { Component, DestroyRef, ElementRef, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Project, projects } from '../../data/projects';
import { TechLogos } from '../../shared/tech-logos';

type Platform = Project['platform'];

/**
 * Home "Projects" section. A Web/Mobile toggle picks the list; the panel stays pinned while
 * each project gets one screen of scroll (one snap stop each). The active project's
 * screenshot cross-fades inside a laptop or phone frame and its text fades in/out.
 */
@Component({
  selector: 'app-home-projects',
  imports: [RouterLink, TechLogos, NgTemplateOutlet],
  templateUrl: './home-projects.html',
})
export class HomeProjects {
  platforms: { value: Platform; label: string }[] = [
    { value: 'web', label: 'Web' },
    { value: 'mobile', label: 'Mobile' },
  ];
  platform = signal<Platform>('web');
  list = computed(() => projects.filter(p => p.platform === this.platform()));
  active = signal(0);

  private section = viewChild.required<ElementRef<HTMLElement>>('section');

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      let frame = 0;
      const update = () => {
        // Each project owns one screen of scroll; round so the switch happens halfway.
        const i = Math.round(-this.section().nativeElement.getBoundingClientRect().top / innerHeight);
        this.active.set(Math.min(this.list().length - 1, Math.max(0, i)));
      };
      const onScroll = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(update);
      };
      addEventListener('scroll', onScroll, { passive: true });
      destroyRef.onDestroy(() => {
        removeEventListener('scroll', onScroll);
        cancelAnimationFrame(frame);
      });
      update();
    });
  }

  select(platform: Platform) {
    if (platform === this.platform()) return;
    this.platform.set(platform);
    this.active.set(0);
    // If we're partway through the section, jump back to its first project.
    const top = this.section().nativeElement.getBoundingClientRect().top;
    if (top < 0) scrollTo({ top: scrollY + top, behavior: 'instant' });
  }

  pad = (n: number) => String(n).padStart(2, '0');
}
