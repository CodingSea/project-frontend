import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ✅ Define TypeScript interface (matches backend DTO)
export interface CreateServiceDto {
  name: string;
  deadline: string;
  description: string;
  projectId: number;   // ✅ <— this was missing
  chiefId: number;
  managerId: number;
  resources: number[];
}


@Injectable({
  providedIn: 'root',
})
export class ServiceService {
  private apiUrl = 'http://localhost:3000/services'; // ✅ backend base URL

  constructor(private http: HttpClient) {}

  // ✅ POST: create new service
  createService(data: CreateServiceDto): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  // ✅ GET: all services (optional for listing later)
  getAllServices(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}
