import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { profile } from '../../data/profile';
import { techLogos } from '../../data/tech';
import { ProjectStory } from '../../shared/project-story';
import { SocialLinks } from '../../shared/social-links';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ProjectStory, SocialLinks],
  templateUrl: './home.html',
})
export class Home {
  profile = profile;
  logos = techLogos;
}
