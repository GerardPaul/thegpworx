import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './layout/header';
import { Footer } from './layout/footer';
import { ScrollTop } from './layout/scroll-top';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, ScrollTop],
  template: `
    <app-header />
    <main><router-outlet /></main>
    <app-footer />
    <app-scroll-top />
  `,
})
export class App {}
