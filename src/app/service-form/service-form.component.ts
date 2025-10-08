import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ServiceService, CreateServiceDto } from '../services/service.service';
import { UserService, User } from '@app/services/user.service';

@Component({
  selector: 'app-service-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './service-form.component.html',
  styleUrls: ['./service-form.component.scss'],
})
export class ServiceFormComponent implements OnInit {
  form!: FormGroup;
  files: File[] = [];
  isDragging = false;
  isSubmitting = false;

  chiefs: User[] = [];
  managers: User[] = [];
  allResources: User[] = [];

  // ✅ projectId can be dynamic (from route)
  projectId!: number;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private serviceService: ServiceService,
    private userService: UserService
  ) {
    this.form = this.fb.group({
      // ✅ Service name: letters, numbers, spaces only (3–50 chars)
      name: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[A-Za-z0-9 ]{3,50}$/),
        ],
      ],

      // ✅ Deadline (required)
      deadline: ['', Validators.required],

      // ✅ Description (optional): allows letters, numbers, punctuation, spaces
      description: [
        '',
        [
          Validators.pattern(/^$|^[A-Za-z0-9.,!?()\s-]{1,300}$/),
          Validators.maxLength(300),
        ],
      ],

      // ✅ Dropdowns
      chiefId: [null, Validators.required],
      managerId: [null, Validators.required],
      resources: this.fb.array<number>([] as number[]),
    });

  }

  ngOnInit() {
    // ✅ If projectId is passed via route (e.g. /projects/:id/create-service)
    this.projectId = Number(this.route.snapshot.paramMap.get('id')) || 1; // fallback for now

    // ✅ Fetch users for dropdowns
    this.loadUsers();
  }

  // ======================
  // 🔹 Load all users
  // ======================
  loadUsers() {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        console.log('✅ Users loaded:', users);
        this.chiefs = users;
        this.managers = users;
        this.allResources = users;
      },
      error: (err) => {
        console.error('❌ Error loading users:', err);
      },
    });
  }

  // ======================
  // 🔹 Helpers for resources
  // ======================
  get resourcesFA(): FormArray<FormControl<number | null>> {
    return this.form.get('resources') as FormArray<FormControl<number | null>>;
  }

  getResourceName(resourceId: number | null | undefined): string {
    if (!resourceId) return '';
    const found = this.allResources.find((r) => r.id === resourceId);
    return found ? `${found.first_name} ${found.last_name}` : String(resourceId);
  }

  addResource(selectEl: HTMLSelectElement) {
    const id = Number(selectEl.value);
    if (!id) return;
    if (!this.resourcesFA.value?.includes(id)) {
      this.resourcesFA.push(new FormControl(id));
    }
    selectEl.value = '';
  }

  removeResource(id: number) {
    const idx = this.resourcesFA.value.findIndex((v) => v === id);
    if (idx > -1) this.resourcesFA.removeAt(idx);
  }

  // ======================
  // 🔹 File handling
  // ======================
  onFilesSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files) return;
    this.addFileList(input.files);
    input.value = '';
  }

  addFileList(list: FileList) {
    Array.from(list).forEach((f) => this.files.push(f));
  }

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

  // ======================
  // 🔹 Navigation
  // ======================
  goBack() {
    this.router.navigateByUrl('/project-management');
  }

  cancel() {
    this.router.navigateByUrl('/project-management');
  }

  // ======================
  // 🔹 Submit form to backend
  // ======================
  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // ✅ Ensure a valid projectId is sent (fallback to 1)
    const projectId = this.projectId || 1;

    const payload: CreateServiceDto = {
      ...this.form.value,
      projectId, // ✅ added
      resources: this.resourcesFA.value.filter((v): v is number => !!v),
    };

    this.isSubmitting = true;
    console.log('🚀 Sending payload:', payload);

    this.serviceService.createService(payload).subscribe({
      next: (res) => {
        console.log('✅ Service created successfully:', res);
        alert('Service created successfully!');
        this.router.navigateByUrl('/project-management');
      },
      error: (err) => {
        console.error('❌ Error creating service:', err);
        alert('Failed to create service. Check console for details.');
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }
}
