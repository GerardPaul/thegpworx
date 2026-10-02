import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../data/projects';
import { ProjectImage } from './project-image';

@Component({
  selector: 'app-project-showcase',
  imports: [RouterLink, ProjectImage],
  templateUrl: './project-showcase.html',
})
export class ProjectShowcase {
  project = input.required<Project>();
  reverse = input(false); // image on the right on wide screens
}
