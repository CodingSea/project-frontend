import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UserComponent } from './user.component/user.component';
import { Dashboard } from './dashboard/dashboard';
import { AuthGuard } from './auth/auth-guard';

export const routes: Routes = [
    { path: "", redirectTo: 'auth/signup', pathMatch: "full" },
    { path: "auth/:mode", component: UserComponent },
    { path: 'dashboard', component: Dashboard, canActivate: [AuthGuard] },
    { path: '**', component: UserComponent }
];

@NgModule({
    imports: [ BrowserModule, RouterModule.forRoot(routes) ],
    exports: [ RouterModule ],
})
export class RoutingModule { }