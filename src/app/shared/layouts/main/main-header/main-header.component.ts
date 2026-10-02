import { Component, HostBinding, effect, signal, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-main-header',
    templateUrl: './main-header.component.html',
    styleUrls: ['./main-header.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class MainHeaderComponent {
  darkMode = signal<boolean>(
    JSON.parse(window.localStorage.getItem('darkMode') ?? 'false')
  );

  showMenu: boolean = false;

  @HostBinding('class.dark') get mode() {
    return this.darkMode();
  }

  constructor() {
    effect(() => {
      window.localStorage.setItem('darkMode', JSON.stringify(this.darkMode()));
    });
  }
}
