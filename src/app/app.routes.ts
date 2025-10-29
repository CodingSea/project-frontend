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
import { ServicesComponent } from './services.component/services.component';
import { IssuePage } from './issue-page/issue-page';

export const routes: Routes = [
  { path: "", redirectTo: 'auth/signup', pathMatch: "full" },
  { path: 'projects', component: ProjectManagement, canActivate: [AuthGuard], data: { onlyAdmin: true } },
  { path: 'projects/:projectId/services', component: ServicesComponent, canActivate: [AuthGuard], data: { onlyAdmin: true } },
  { path: 'projects/:projectId/services/new', component: ServiceFormComponent, canActivate: [AuthGuard], data: { onlyAdmin: true } },
  { path: 'projects/:projectId/services/:serviceId/edit', component: ServiceFormComponent, canActivate: [AuthGuard], data: { onlyAdmin: true } },
  { path: "auth/:mode", component: UserComponent },
  { path: 'dashboard', component: Dashboard, canActivate: [AuthGuard], data: { onlyAdmin: true } },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'profile/user/:userId', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'profile/edit', component: ProfileEditComponent, canActivate: [AuthGuard] },
  { path: 'certificate/new', component: CertificateCreateComponent, canActivate: [AuthGuard] },
  { path: 'certificate/edit/:id', component: CertificateCreateComponent, canActivate: [AuthGuard] },
  { path: 'developers', component: DevelopersSearchComponent, canActivate: [AuthGuard], data: { onlyAdmin: true } },
  { path: 'services/:serviceId/taskboard/:taskBoardId', component: ServiceTasksComponent, canActivate: [AuthGuard] },
{ path: 'issues', component: IssuePage },
  { path: '**', component: UserComponent }

];

@NgModule({
  imports: [BrowserModule, RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class RoutingModule { }
