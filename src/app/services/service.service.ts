import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

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
  private apiUrl = `${environment.apiUrl}/services`;

  constructor(private http: HttpClient) {}

  createService(data: CreateServiceDto, files: File[]): Observable<any> {
    const formData = new FormData();

    // Append normal fields
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => formData.append(key, v.toString()));
      } else if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    // Append files
    files.forEach(file => formData.append('files', file));

    return this.http.post(this.apiUrl, formData);
  }


  // ✅ GET: all services (optional for listing later)
  getAllServices(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}
