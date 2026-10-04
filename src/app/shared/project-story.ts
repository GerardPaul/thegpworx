import { Component, DestroyRef, booleanAttribute, ElementRef, afterNextRender, computed, inject, input, signal, viewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Project, projects } from '../data/projects';
import { TechLogos } from './tech-logos';

type Platform = Project['platform'];

/**
 * Projects "scroll story" (home + /projects). A Web/Mobile toggle picks the list; the panel stays
 * pinned while each project gets one screen of scroll (one snap stop each). The active project's
 * screenshot cross-fades inside a laptop or phone frame and its text fades in/out. The page
 * supplies the heading via content projection.
 */
@Component({
  selector: 'app-project-story',
  imports: [RouterLink, TechLogos, NgTemplateOutlet],
  templateUrl: './project-story.html',
})
export class ProjectStory {
  // True when the header sits directly above this section (/projects): the first snap stop is
  // pulled up by the header height so the page doesn't load scrolled past the header.
  belowHeader = input(false, { transform: booleanAttribute });

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
    if (this.section().nativeElement.getBoundingClientRect().top < 0) this.go(0, 'instant');
  }

  // Scroll to project i's snap stop (honours its scroll-margin).
  go(i: number, behavior: ScrollBehavior = 'auto') {
    this.section().nativeElement.querySelectorAll('[data-stop]')[i]?.scrollIntoView({ behavior });
  }
}
