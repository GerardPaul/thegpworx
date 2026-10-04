import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', title: 'TheGPWorx', loadComponent: () => import('./pages/home/home').then(m => m.Home) },
  { path: 'projects', title: 'Projects — TheGPWorx', loadComponent: () => import('./pages/projects/projects').then(m => m.Projects) },
  { path: 'projects/:slug', loadComponent: () => import('./pages/project-detail/project-detail').then(m => m.ProjectDetail) },
  // Hobbies and Life pages come later.
  { path: '**', redirectTo: '' },
];
