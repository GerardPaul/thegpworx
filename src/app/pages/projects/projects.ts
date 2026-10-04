import { Component } from '@angular/core';
import { ProjectStory } from '../../shared/project-story';

@Component({
  selector: 'app-projects',
  imports: [ProjectStory],
  template: `
    <app-project-story belowHeader>
      <h1 class="text-4xl font-semibold sm:text-6xl">Projects<span class="text-error">.</span></h1>
    </app-project-story>
  `,
})
export class Projects {}
