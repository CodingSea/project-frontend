import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '@app/auth';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate
{
  jwtHelper = new JwtHelperService();

  constructor(private authService: AuthService, private router: Router) { }

  canActivate(): boolean
  {
    const token = localStorage.getItem('token');

    if (token && !this.jwtHelper.isTokenExpired(token))
    {
      return true;
    }
    this.router.navigate([ '/auth/login' ]);
    return false;
  }
}
