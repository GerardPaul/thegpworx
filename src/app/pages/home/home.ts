import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { profile } from '../../data/profile';
import { projects } from '../../data/projects';
import { techLogos } from '../../data/tech';
import { ProjectShowcase } from '../../shared/project-showcase';
import { SocialLinks } from '../../shared/social-links';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ProjectShowcase, SocialLinks],
  templateUrl: './home.html',
})
export class Home {
  profile = profile;
  projects = projects;
  logos = techLogos;
}
