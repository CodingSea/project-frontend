import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UserComponent } from './user.component/user.component';
import { Dashboard } from './dashboard/dashboard';
import { AuthGuard } from './auth/auth-guard';
import { ProfileComponent } from './profile.component/profile.component';
import { ProfileEditComponent } from './profile.edit.component/profile.edit.component';
import { CertificateCreateComponent } from './certificate.create.component/certificate.create.component';
import { DevelopersSearchComponent } from './developers.search.component/developers.search.component';

export const routes: Routes = [
    { path: "", redirectTo: 'auth/signup', pathMatch: "full" },
    { path: "auth/:mode", component: UserComponent },
    { path: 'dashboard', component: Dashboard, canActivate: [AuthGuard] },
    { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
    { path: 'profile/user/:userId', component: ProfileComponent, canActivate: [AuthGuard] },
    { path: 'profile/edit', component: ProfileEditComponent, canActivate: [AuthGuard] },
    { path: 'certificate/new', component: CertificateCreateComponent, canActivate: [AuthGuard] },
    { path: 'developers', component: DevelopersSearchComponent, canActivate: [AuthGuard] },
    { path: '**', component: UserComponent }
];

@NgModule({
    imports: [ BrowserModule, RouterModule.forRoot(routes) ],
    exports: [ RouterModule ],
})
export class RoutingModule { }