import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { projectLabel, projects } from '../../data/projects';
import { ProjectImage } from '../../shared/project-image';
import { TechLogos } from '../../shared/tech-logos';

@Component({
  selector: 'app-project-detail',
  imports: [RouterLink, ProjectImage, TechLogos],
  templateUrl: './project-detail.html',
})
export class ProjectDetail {
  slug = input.required<string>(); // bound from the :slug route param

  private index = computed(() => projects.findIndex(p => p.slug === this.slug()));
  project = computed(() => projects[this.index()]);
  prev = computed(() => projects[this.index() - 1]);
  next = computed(() => projects[this.index() + 1]);
  label = projectLabel;

  /** Index of the screenshot open in the viewer. */
  shown = signal(0);
  current = computed(() => this.project()?.screenshots?.[this.shown()]);

  /** Previous / next screenshot in the viewer, wrapping around at either end. */
  step(delta: number) {
    const n = this.project()?.screenshots?.length ?? 0;
    if (n) this.shown.update(i => (i + delta + n) % n);
  }

  constructor() {
    const title = inject(Title);
    const meta = inject(Meta);
    const defaultDescription = meta.getTag('name="description"')?.content ?? '';
    effect(onCleanup => {
      const p = this.project();
      title.setTitle(`${p?.title ?? 'Project not found'} — TheGPWorx`);
      meta.updateTag({ name: 'description', content: p?.tagline ?? defaultDescription });
      onCleanup(() => meta.updateTag({ name: 'description', content: defaultDescription }));
    });
  }
}
