import { Component } from '@angular/core';
import { projects } from '../../data/projects';
import { ProjectShowcase } from '../../shared/project-showcase';

@Component({
  selector: 'app-projects',
  imports: [ProjectShowcase],
  template: `
    <section class="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 class="text-5xl font-semibold sm:text-7xl">Projects</h1>
      <p class="mt-4 max-w-2xl text-lg text-gray-400">Web platforms, mobile apps and everything in between.</p>
      <div class="mt-16 space-y-24">
        @for (project of projects; track project.slug; let odd = $odd) {
          <app-project-showcase [project]="project" [reverse]="odd" />
        }
      </div>
    </section>
  `,
})
export class Projects {
  projects = projects;
}
