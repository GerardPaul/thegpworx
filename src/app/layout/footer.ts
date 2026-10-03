import { Component } from '@angular/core';
import { SocialLinks } from '../shared/social-links';

@Component({
  selector: 'app-footer',
  imports: [SocialLinks],
  template: `
    <footer class="border-t border-fg/10 px-4 py-10 text-center text-sm text-muted">
      <app-social-links class="mb-4 justify-center" size="h-5" />
      <p>© {{ year }} TheGPWorx. All rights reserved.</p>
    </footer>
  `,
})
export class Footer {
  year = new Date().getFullYear();
}
