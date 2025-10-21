import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface CreateCertificateDto {
  name: string;
  type: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate: string;
  description?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CertificateService {
  private apiUrl = `${environment.apiUrl}/certificate`;

  constructor(private http: HttpClient) {}

  // Create Certificate (with files)
  createCertificate(userId: number, data: CreateCertificateDto, files: File[]): Observable<any> {
    const formData = new FormData();

    // Append form fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    // Append uploaded files
    files.forEach((file) => formData.append('files', file));

    // POST to backend
    return this.http.post(`${this.apiUrl}/${userId}`, formData);
  }

  getCertificatesByUser(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${userId}`);
  }
}
