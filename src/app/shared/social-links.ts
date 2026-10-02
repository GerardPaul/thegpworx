import { Component, input } from '@angular/core';
import { profile } from '../data/profile';

@Component({
  selector: 'app-social-links',
  templateUrl: './social-links.html',
  host: { class: 'flex flex-wrap items-center gap-5' },
})
export class SocialLinks {
  size = input('h-6'); // Tailwind height class for the icons
  profile = profile;
}
