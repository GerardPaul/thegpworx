import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { AdminLayoutComponent } from './shared/layouts/admin/admin-layout/admin-layout.component';
import { AdminHeaderComponent } from './shared/layouts/admin/admin-header/admin-header.component';
import { AdminFooterComponent } from './shared/layouts/admin/admin-footer/admin-footer.component';
import { AdminSidebarComponent } from './shared/layouts/admin/admin-sidebar/admin-sidebar.component';
import { MainLayoutComponent } from './shared/layouts/main/main-layout/main-layout.component';
import { MainHeaderComponent } from './shared/layouts/main/main-header/main-header.component';
import { MainFooterComponent } from './shared/layouts/main/main-footer/main-footer.component';
import { DashboardComponent } from './views/admin/dashboard/dashboard.component';
import { LoginComponent } from './views/components/login/login.component';
import { AboutComponent } from './views/main/about/about.component';
import { ContactComponent } from './views/main/contact/contact.component';
import { HomeComponent } from './views/main/home/home.component';
import { ProjectsComponent } from './views/main/projects/projects.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [
    AppComponent,
    AdminLayoutComponent,
    AdminHeaderComponent,
    AdminFooterComponent,
    AdminSidebarComponent,
    MainLayoutComponent,
    MainHeaderComponent,
    MainFooterComponent,
    DashboardComponent,
    LoginComponent,
    AboutComponent,
    ContactComponent,
    HomeComponent,
    ProjectsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule.forRoot([]),
    BrowserAnimationsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
