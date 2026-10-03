import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../data/projects';
import { ProjectImage } from './project-image';
import { TechLogos } from './tech-logos';

@Component({
  selector: 'app-project-showcase',
  imports: [RouterLink, ProjectImage, TechLogos],
  templateUrl: './project-showcase.html',
  host: { class: 'block' },
})
export class ProjectShowcase {
  project = input.required<Project>();
  reverse = input(false); // image on the right on wide screens
}
