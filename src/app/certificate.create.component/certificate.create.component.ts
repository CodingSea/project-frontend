import { Component, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Sidebar } from "@app/sidebar/sidebar";
import { CommonModule } from '@angular/common';
import { jwtDecode } from 'jwt-decode';
import { CertificateService, CreateCertificateDto } from '@app/services/certificate.service';

@Component({
  selector: 'app-certificate-create',
  standalone: true,
  imports: [Sidebar, RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './certificate.create.component.html',
  styleUrls: ['./certificate.create.component.css']
})
export class CertificateCreateComponent {
  certificateForm: FormGroup;
  decodedToken: any | null = null;
  isSubmitting = false;

  files: File[] = [];
  isDragging = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private certificateService: CertificateService
  ) {
    this.certificateForm = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      issuingOrganization: ['', Validators.required],
      issueDate: ['', Validators.required],
      expiryDate: ['', Validators.required],
      description: ['']
    });
  }

  //  File Upload Handlers
  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    this.addFileList(input.files);
    input.value = '';
  }

  addFileList(list: FileList) {
    Array.from(list).forEach(file => this.files.push(file));
  }

  removeFile(index: number) {
    this.files.splice(index, 1);
  }

  //  Drag & Drop
  @HostListener('dragover', ['$event'])
  onDragOver(ev: DragEvent) {
    ev.preventDefault();
    this.isDragging = true;
  }
  @HostListener('dragleave', ['$event'])
  onDragLeave(ev: DragEvent) {
    ev.preventDefault();
    this.isDragging = false;
  }
  @HostListener('drop', ['$event'])
  onDrop(ev: DragEvent) {
    ev.preventDefault();
    this.isDragging = false;
    if (ev.dataTransfer?.files?.length) {
      this.addFileList(ev.dataTransfer.files);
    }
  }

  //  Submit
  onSubmit(): void {
    const token: string | null = localStorage.getItem('token');
    if (!token) {
      alert('User not logged in!');
      return;
    }

    this.decodedToken = jwtDecode(token);
    const userId = this.decodedToken?.sub;
    if (!userId) {
      alert('Invalid user token.');
      return;
    }

    if (this.certificateForm.invalid) {
      this.certificateForm.markAllAsTouched();
      return;
    }

    const payload: CreateCertificateDto = this.certificateForm.value;
    this.isSubmitting = true;

    this.certificateService.createCertificate(userId, payload, this.files).subscribe({
      next: () => {
        alert('✅ Certificate created successfully!');
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        console.error('❌ Upload failed:', err);
        alert('Upload failed, please try again.');
        this.isSubmitting = false;
      },
      complete: () => (this.isSubmitting = false),
    });
  }
}
