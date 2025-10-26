import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

// ✅ Full Service interface to match backend entity
export interface Service {
  serviceID: number;
  name: string;
  description?: string;
  deadline?: string;
  files?: { name: string; url: string }[]; // ✅ match backend: list of { name, url }
  chief?: any;
  projectManager?: any;
  assignedResources?: any[];
}

// ✅ DTO interface (create/update)
export interface CreateServiceDto {
  name: string;
  deadline: string;
  description?: string;
  projectId: number;
  chiefId: number;
  managerId?: number;
  resources: number[];
}

@Injectable({
  providedIn: 'root',
})
export class ServiceService {
  private apiUrl = `${environment.apiUrl}/service`;

  constructor(private http: HttpClient) {}

  // ✅ Create service with file upload
  createService(data: CreateServiceDto, files: File[]): Observable<any> {
    const formData = new FormData();

    formData.append('name', data.name);
    formData.append('deadline', data.deadline);
    if (data.description) formData.append('description', data.description);

    formData.append('projectId', String(data.projectId));
    formData.append('chiefId', String(data.chiefId));
    if (data.managerId) formData.append('managerId', String(data.managerId));

    data.resources.forEach((r) => formData.append('resources', String(r)));
    files.forEach((file) => formData.append('files', file));

    return this.http.post(this.apiUrl, formData);
  }

  // ✅ Fetch all services
  getAllServices(): Observable<Service[]> {
    return this.http.get<Service[]>(this.apiUrl);
  }

  // ✅ Fetch single service by ID
  getService(id: number): Observable<Service> {
    return this.http.get<Service>(`${this.apiUrl}/${id}`);
  }

  // ✅ Update service
  updateService(id: number, payload: Partial<CreateServiceDto>): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, payload);
  }

  updateServiceWithFiles(id: number, formData: FormData): Observable<any> {
  return this.http.patch(`${this.apiUrl}/${id}`, formData);
}
}
