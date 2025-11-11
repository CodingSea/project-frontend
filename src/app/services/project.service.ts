import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { Project } from '@app/project';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private apiUrl = `${environment.apiUrl}/project`;

  constructor(private http: HttpClient) {}

  // ✅ Paged + filtered + searchable projects
  getProjects(options?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Observable<Project[]> {
    let url = this.apiUrl;

    if (options) {
      const params = new URLSearchParams();

      if (options.page !== undefined) {
        params.append('page', String(options.page));
      }
      if (options.limit !== undefined) {
        params.append('limit', String(options.limit));
      }
      if (options.status) {
        params.append('status', options.status);
      }
      if (options.search && options.search.trim() !== '') {
        params.append('search', options.search.trim());
      }

      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }

    return this.http.get<Project[]>(url);
  }

  // ✅ Count for pagination
  getProjectsCount(options?: {
    status?: string;
    search?: string;
  }): Observable<number> {
    let url = `${this.apiUrl}/count`;
    if (options) {
      const params = new URLSearchParams();
      if (options.status) params.append('status', options.status);
      if (options.search && options.search.trim() !== '') {
        params.append('search', options.search.trim());
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }
    return this.http.get<number>(url);
  }

  createProject(project: Partial<Project>): Observable<Project> {
    return this.http.post<Project>(this.apiUrl, project);
  }

  getProject(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}`);
  }

  updateProject(id: number, project: Partial<Project>): Observable<Project> {
    return this.http.patch<Project>(`${this.apiUrl}/${id}`, project);
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
