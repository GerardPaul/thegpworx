import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
})
export class Header {
  // Hobbies and Life get added here once designed.
  links = [
    { label: 'Home', path: '/' },
    { label: 'Projects', path: '/projects' },
  ];

  // Initial theme is set on <html> by the inline script in index.html (avoids a flash).
  dark = signal(document.documentElement.classList.contains('dark'));

  toggleTheme() {
    this.dark.update(d => !d);
    document.documentElement.classList.toggle('dark', this.dark());
    try { localStorage.setItem('theme', this.dark() ? 'dark' : 'light'); } catch {}
  }
}
