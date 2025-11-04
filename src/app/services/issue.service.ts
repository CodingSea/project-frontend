import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  profileImage?: string;
}

export interface Comment {
  id?: number;
  content: string;
  createdAt?: string;
  user: User;
}

export interface Feedback {
  id?: number;
  content: string;
  createdAt?: string;
  user?: User;
  isAccepted?: boolean;
  comments?: Comment[];
  attachments?: { name: string; url: string }[];
}

export interface Issue {
  id?: number;
  title: string;
  description: string;
  descriptionHtml?: string;
  status?: string;
  category?: string;
  attachments?: { name: string; url: string }[];
  createdById?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: User;
  feedbacks?: Feedback[];
previewDescription?: string;
}

@Injectable({
  providedIn: 'root',
})
export class IssueService {
  private apiUrl = `${environment.apiUrl}/issue`;

  constructor(private http: HttpClient) {}

  createIssue(data: any, files: File[]) {
    const form = new FormData();
    form.append('title', data.title);
    form.append('description', data.description);
    if (data.category) form.append('category', data.category);
    form.append('createdById', data.createdById);
    files.forEach(f => form.append('attachments', f));
    return this.http.post<Issue>(this.apiUrl, form);
  }

  getIssueById(id: number): Observable<Issue> {
    return this.http.get<Issue>(`${this.apiUrl}/${id}`);
  }

  addFeedback(issueId: number, formData: FormData) {
    return this.http.post(`${this.apiUrl}/${issueId}/feedback`, formData);
  }

  addComment(feedbackId: number, content: string) {
    const token = localStorage.getItem('token');
    const decoded: any = token ? JSON.parse(atob(token.split('.')[1])) : null;
    const userId = decoded?.sub;

    return this.http.post(`${environment.apiUrl}/comment`, {
      feedbackId,
      content,
      userId,
    });
  }

  toggleFeedbackAccepted(feedbackId: number, issueOwnerId: number) {
    return this.http.post(`${this.apiUrl}/feedback/${feedbackId}/toggle`, { issueOwnerId });
  }

  downloadFile(key: string) {
    return this.http.get(`${this.apiUrl}/file/download?key=${encodeURIComponent(key)}`, {
      responseType: 'blob'
    });
  }
}
