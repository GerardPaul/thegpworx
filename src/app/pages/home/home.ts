import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { profile } from '../../data/profile';
import { techLogos } from '../../data/tech';
import { ProjectRail } from './project-rail';
import { SocialLinks } from '../../shared/social-links';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ProjectRail, SocialLinks],
  templateUrl: './home.html',
})
export class Home {
  profile = profile;
  logos = techLogos;
}
