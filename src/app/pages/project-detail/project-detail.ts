import { Component, computed, effect, inject, input } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { projects } from '../../data/projects';
import { ProjectImage } from '../../shared/project-image';

@Component({
  selector: 'app-project-detail',
  imports: [RouterLink, ProjectImage],
  templateUrl: './project-detail.html',
})
export class ProjectDetail {
  slug = input.required<string>(); // bound from the :slug route param

  private index = computed(() => projects.findIndex(p => p.slug === this.slug()));
  project = computed(() => projects[this.index()]);
  prev = computed(() => projects[this.index() - 1]);
  next = computed(() => projects[this.index() + 1]);

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
