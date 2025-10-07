import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000/user'; // ✅ Your NestJS user endpoint

  constructor(private http: HttpClient) {}

  // ✅ Fetch all users from backend
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }
}
