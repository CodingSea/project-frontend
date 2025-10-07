import { Component, signal } from '@angular/core';
import { Router, RouterLinkActive, RouterOutlet } from '@angular/router';
import { RouterLink } from '@angular/router';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { JwtInterceptor } from './auth/jwt-interceptor';
import { Sidebar } from './sidebar/sidebar';
import { HeaderComponent } from './header/header';

@Component({
  selector: 'app-root',
  imports: [ CommonModule, RouterOutlet,Sidebar,HeaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  providers: [
    AuthService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true
    }
  ]
})
export class App
{

}
