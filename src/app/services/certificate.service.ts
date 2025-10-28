import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface CertificateFile {
  name: string;
  url: string;
}

export interface Certificate {
  certificateID: number;
  name: string;
  type: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate: string;
  description?: string;
  certificateFile?: CertificateFile[];
}

export interface CreateCertificateDto {
  name: string;
  type: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class CertificateService {
  private apiUrl = `${environment.apiUrl}/certificate`;

  constructor(private http: HttpClient) {}

  createCertificate(userId: number, data: CreateCertificateDto, files: File[]): Observable<any> {
    const formData = new FormData();
    Object.entries(data).forEach(([key, val]) => {
      if (val !== null && val !== undefined) formData.append(key, val.toString());
    });
    files.forEach((file) => formData.append('files', file));
    return this.http.post(`${this.apiUrl}/${userId}`, formData);
  }

  getCertificatesByUser(userId: number): Observable<Certificate[]> {
    return this.http.get<Certificate[]>(`${this.apiUrl}/${userId}`);
  }

  getCertificateById(id: number): Observable<Certificate> {
    return this.http.get<Certificate>(`${this.apiUrl}/item/${id}`);
  }

  updateCertificate(id: number, formData: FormData): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, formData);
  }
}
