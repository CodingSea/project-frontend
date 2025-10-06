import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '@app/auth';
import { JwtHelperService } from '@auth0/angular-jwt';
import { jwtDecode } from 'jwt-decode';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate
{
  jwtHelper = new JwtHelperService();

  constructor(private authService: AuthService, private router: Router) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean
  {
    const token = localStorage.getItem('token');

    if (token && !this.jwtHelper.isTokenExpired(token))
    {
      if (route.data["onlyAdmin"])
      {
        const decodedToken: any | null = jwtDecode(token);
        return decodedToken.role == "admin";
      }
      else
      {
        return true;
      }
    }

    this.router.navigate([ '/auth/login' ]);
    return false;
  }

  canActivateAuth(): boolean
  {
    const token = localStorage.getItem('token');

    if (token && !this.jwtHelper.isTokenExpired(token))
    {
      const decodedToken: any | null = jwtDecode(token);
      return decodedToken.role == "admin";
    }
    this.router.navigate([ '/auth/login' ]);
    return false;
  }
}
