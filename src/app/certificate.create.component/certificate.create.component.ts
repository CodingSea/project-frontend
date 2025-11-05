import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { jwtDecode } from 'jwt-decode';
import { CertificateService, CreateCertificateDto } from '@app/services/certificate.service';
import { environment } from '@environments/environment';
import { HttpClient } from '@angular/common/http';
import { Sidebar } from '@app/sidebar/sidebar';
import { HeaderComponent } from '@app/header/header';

interface ExistingFile {
  name: string;
  url: string;
}

@Component({
  selector: 'app-certificate-create',
  standalone: true,
  imports: [Sidebar, RouterLink, ReactiveFormsModule, CommonModule,HeaderComponent],
  templateUrl: './certificate.create.component.html',
  styleUrls: ['./certificate.create.component.css'],
})
export class CertificateCreateComponent implements OnInit {
  certificateForm: FormGroup;
  decodedToken: any | null = null;
  isSubmitting = false;
  isEditMode = false;
  certId: number | null = null;

  files: File[] = [];
  existingFiles: ExistingFile[] = [];
  filesToDelete: ExistingFile[] = [];

  isDragging = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private certificateService: CertificateService,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {
    this.certificateForm = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      issuingOrganization: ['', Validators.required],
      issueDate: ['', Validators.required],
      expiryDate: [''],
      description: [''],
    });
  }

  ngOnInit(): void {
    this.certId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.certId) {
      this.isEditMode = true;
      this.loadCertificateData(this.certId);
    }
  }

  // 🔹 Load existing certificate
  loadCertificateData(id: number) {
    this.http.get<any>(`${environment.apiUrl}/certificate/item/${id}`).subscribe({
      next: (data) => {
        this.certificateForm.patchValue({
          name: data.name,
          type: data.type,
          issuingOrganization: data.issuingOrganization,
          issueDate: data.issueDate?.substring(0, 10),
          expiryDate: data.expiryDate?.substring(0, 10),
          description: data.description,
        });

        this.existingFiles = data.certificateFile
          ? data.certificateFile.map((f: any) => ({
              name: f.name,
              url: f.url,
            }))
          : [];
      },
      error: (err) => console.error('❌ Failed to load certificate', err),
    });
  }

  // 🔹 File handling
  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    this.addFileList(input.files);
    input.value = '';
  }

  addFileList(list: FileList) {
    Array.from(list).forEach((f) => this.files.push(f));
  }

  markFileForDeletion(file: ExistingFile) {
    this.existingFiles = this.existingFiles.filter((f) => f !== file);
    this.filesToDelete.push(file);
  }

  removeNewFile(file: File) {
    this.files = this.files.filter((f) => f !== file);
  }

  // 🔹 Drag & drop
  @HostListener('dragover', ['$event']) onDragOver(ev: DragEvent) {
    ev.preventDefault();
    this.isDragging = true;
  }
  @HostListener('dragleave', ['$event']) onDragLeave(ev: DragEvent) {
    ev.preventDefault();
    this.isDragging = false;
  }
  @HostListener('drop', ['$event']) onDrop(ev: DragEvent) {
    ev.preventDefault();
    this.isDragging = false;
    if (ev.dataTransfer?.files?.length) this.addFileList(ev.dataTransfer.files);
  }

  // 🔹 Submit
  onSubmit(): void {
    if (this.certificateForm.invalid) {
      this.certificateForm.markAllAsTouched();
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return alert('User not logged in!');
    this.decodedToken = jwtDecode(token);
    const userId = this.decodedToken?.sub;
    if (!userId) return alert('Invalid user token.');

    const payload: CreateCertificateDto = this.certificateForm.value;
    this.isSubmitting = true;

    if (this.isEditMode && this.certId) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, val]) => {
        if (val !== null && val !== undefined) formData.append(key, val.toString());
      });

      // 🔹 Use correct field names
      formData.append('certificateFile', JSON.stringify(this.existingFiles));
      formData.append('filesToDelete', JSON.stringify(this.filesToDelete));
      this.files.forEach((f) => formData.append('newFiles', f));

      this.http.patch(`${environment.apiUrl}/certificate/${this.certId}`, formData).subscribe({
        next: () => {
          alert('✅ Certificate updated successfully!');
          this.router.navigate(['/profile']);
        },
        error: (err) => {
          console.error('❌ Update failed:', err);
          this.isSubmitting = false;
        },
        complete: () => (this.isSubmitting = false),
      });
    } else {
      this.certificateService.createCertificate(userId, payload, this.files).subscribe({
        next: () => {
          alert('✅ Certificate created successfully!');
          this.router.navigate(['/profile']);
        },
        error: (err) => {
          console.error('❌ Upload failed:', err);
          this.isSubmitting = false;
        },
        complete: () => (this.isSubmitting = false),
      });
    }
  }
}
