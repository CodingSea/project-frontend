import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

/** User model */
export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  profileImage?: string;
}

/** Comment model */
export interface Comment {
  id?: number;
  content: string;
  createdAt?: string;
  user: User;
}

/** Feedback model */
export interface Feedback {
  id?: number;
  content: string;
  createdAt?: string;
  user?: User;
  comments?: Comment[];
}

/** Issue model (expanded to match backend) */
export interface Issue {
  id?: number;
  title: string;
  description: string;
  status?: string;
  category?: string;
  codeSnippet?: string;
  attachments?: { name: string; url: string }[];
  createdById?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: User;
  feedbacks?: Feedback[];
}

@Injectable({
  providedIn: 'root',
})
export class IssueService {
  private apiUrl = `${environment.apiUrl}/issue`;

  constructor(private http: HttpClient) {}

  /** ✅ Create issue with file upload */
  createIssue(data: any, files: File[]): Observable<Issue> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    if (data.category) formData.append('category', data.category);
    if (data.codeSnippet) formData.append('codeSnippet', data.codeSnippet);
    if (data.createdById) formData.append('createdById', String(data.createdById));

    files.forEach((file) => formData.append('attachments', file));

    console.log('🚀 Uploading issue with files:', files.map((f) => f.name));
    return this.http.post<Issue>(this.apiUrl, formData);
  }

  /** ✅ Get all issues */
  getAllIssues(): Observable<Issue[]> {
    return this.http.get<Issue[]>(this.apiUrl);
  }

  /** ✅ Get single issue with signed S3 URLs */
  getIssueById(id: number): Observable<Issue> {
    return this.http.get<Issue>(`${this.apiUrl}/${id}`);
  }
}
