import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Project {
  projectID: number;
  name: string;
  description?: string;
  dueDate?: string;
  status?: string;
  progress?: number;

  members?: Array<{
    name?: string;
    avatar?: string;   // ✅ change to "avatar" instead of "avatarUrl"
    initials?: string;
    color?: string;
  }>;
}


@Injectable({ providedIn: 'root' })
export class ProjectService {
  private apiUrl = 'http://localhost:3000/projects'; // ✅ plural

  constructor(private http: HttpClient) {}

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.apiUrl);
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
