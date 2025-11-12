import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { jwtDecode } from 'jwt-decode'; // ✅ FIXED import

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  role?: string;
  profileImage?: string;
  profileImageID?: string;
  skills?: string[];
}

interface JwtPayload {
  id: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/user`;

  constructor(private http: HttpClient) {}

  // ✅ Fetch all users from backend
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  // ✅ Decode current user directly from JWT token (no /me needed)
  getCurrentUser(): User | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        first_name: '',
        last_name: ''
      };
    } catch (error) {
      console.error('Error decoding JWT token:', error);
      return null;
    }
  }

  // ✅ Optional helper — if you want to inspect payload
  getDecodedToken(): JwtPayload | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      return jwtDecode<JwtPayload>(token);
    } catch {
      return null;
    }
  }
}
