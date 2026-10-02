import { Component, computed, effect, inject, input } from '@angular/core';
import { Title } from '@angular/platform-browser';
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
    effect(() => title.setTitle(`${this.project()?.title ?? 'Project not found'} — TheGPWorx`));
  }
}
