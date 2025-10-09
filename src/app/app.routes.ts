import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UserComponent } from './user.component/user.component';
import { Dashboard } from './dashboard/dashboard';
import { AuthGuard } from './auth/auth-guard';
import { ProfileComponent } from './profile.component/profile.component';
import { ProfileEditComponent } from './profile.edit.component/profile.edit.component';
import { CertificateCreateComponent } from './certificate.create.component/certificate.create.component';
import { HomePage } from './home-page/home-page';
import { ProjectManagement } from './project-management/project-management';
import { ServiceFormComponent } from './service-form/service-form.component';
import { DevelopersSearchComponent } from './developers.search.component/developers.search.component';
import { ServiceTasksComponent } from './service.tasks.component/service.tasks.component';


export const routes: Routes = [
  { path: "", redirectTo: 'auth/signup', pathMatch: "full" },
  { path: 'home', component: HomePage, title: 'Home', canActivate: [ AuthGuard ] },
  { path: 'project-management', component: ProjectManagement, canActivate: [ AuthGuard ] },
  { path: 'services', component: ServiceFormComponent, canActivate: [ AuthGuard ] },
  { path: "auth/:mode", component: UserComponent },
  { path: 'dashboard', component: Dashboard, canActivate: [ AuthGuard ], data: { onlyAdmin: true } },
  { path: 'profile', component: ProfileComponent, canActivate: [ AuthGuard ] },
  { path: 'profile/user/:userId', component: ProfileComponent, canActivate: [ AuthGuard ] },
  { path: 'profile/edit', component: ProfileEditComponent, canActivate: [ AuthGuard ] },
  { path: 'certificate/new', component: CertificateCreateComponent, canActivate: [ AuthGuard ] },
  { path: 'developers', component: DevelopersSearchComponent, canActivate: [ AuthGuard ], data: { onlyAdmin: true } },
  { path: 'kanban/:id', component: ServiceTasksComponent, canActivate: [ AuthGuard ] },
  { path: '**', component: UserComponent }
];

@NgModule({
  imports: [ BrowserModule, RouterModule.forRoot(routes) ],
  exports: [ RouterModule ],
})
export class RoutingModule { }
