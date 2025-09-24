import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService
{
  isAuthenticated()
  {
    throw new Error("Method not implemented.");
  }
  private apiUrl = 'http://localhost:3000/auth';

  constructor(private http: HttpClient) { }

  login(email: string, password: string)
  {
    return this.http.post<{ access_token: string }>(`${this.apiUrl}/login`, {email, password})
      .pipe(
        tap(response =>
        {
          localStorage.setItem('token', response.access_token);
        })
      );
  }

  logout()
  {
    localStorage.removeItem('token');
  }

  getToken(): string | null
  {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean
  {
    return !!this.getToken();
  }
}
