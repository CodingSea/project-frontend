import { Component, HostListener, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
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
import { DevelopersSearchComponent } from '@app/developers.search.component/developers.search.component';

@Component({
  selector: 'app-service-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, DevelopersSearchComponent],
  templateUrl: './service-form.component.html',
  styleUrls: ['./service-form.component.scss'],
})
export class ServiceFormComponent implements OnInit {
  @Input() projectId?: number;
  @Output() submitted = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;
  files: File[] = [];
  isDragging = false;
  isSubmitting = false;

  chiefs: User[] = [];
  managers: User[] = [];
  allResources: User[] = [];

  isEditMode = false;
  serviceId!: number;

  // 🔹 Modals + Selected Users
  showDevelopersModal = false;
  showChiefModal = false;
  showManagerModal = false;
  selectedChief: User | null = null;
  selectedManager: User | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private serviceService: ServiceService,
    private userService: UserService,
    private location: Location
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9 ]{3,50}$/)]],
      deadline: ['', Validators.required],
      description: [
        '',
        [Validators.pattern(/^$|^[A-Za-z0-9.,!?()\s-]{1,300}$/), Validators.maxLength(300)],
      ],
      chiefId: [null, Validators.required],
      managerId: [null, Validators.required],
      resources: this.fb.array<number>([] as number[]),
    });
  }

  ngOnInit() {
    if (!this.projectId) {
      this.projectId = Number(this.route.snapshot.paramMap.get('projectId')) || 1;
    }

    const sid = this.route.snapshot.paramMap.get('serviceId');
    this.isEditMode = !!sid;

    if (sid) {
      this.serviceId = Number(sid);
      this.loadServiceForEdit(this.serviceId);
    }

    this.loadUsers();
  }

  private toYmd(dateStr?: string | Date | null): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  private loadServiceForEdit(id: number) {
    this.serviceService.getService(id).subscribe({
      next: (svc) => {
        this.form.patchValue({
          name: svc.name ?? '',
          deadline: this.toYmd(svc.deadline),
          description: svc.description ?? '',
          chiefId: svc.chief?.id ?? null,
          managerId: svc.projectManager?.id ?? null,
        });

        if (svc.chief) {
          this.selectedChief = {
            id: svc.chief.id,
            first_name: svc.chief.first_name,
            last_name: svc.chief.last_name,
          } as User;
        }

        if (svc.projectManager) {
          this.selectedManager = {
            id: svc.projectManager.id,
            first_name: svc.projectManager.first_name,
            last_name: svc.projectManager.last_name,
          } as User;
        }

        this.resourcesFA.clear();
        (svc.assignedResources ?? []).forEach((r) => {
          this.resourcesFA.push(new FormControl(r.id));
        });
      },
      error: (e) => console.error('❌ Failed to load service for edit', e),
    });
  }

  loadUsers() {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.chiefs = users;
        this.managers = users;
        this.allResources = users;
      },
      error: (err) => console.error('❌ Error loading users:', err),
    });
  }

  get resourcesFA(): FormArray<FormControl<number | null>> {
    return this.form.get('resources') as FormArray<FormControl<number | null>>;
  }

  getResourceName(resourceId: number | null | undefined): string {
    if (!resourceId) return '';
    const found = this.allResources.find((r) => r.id === resourceId);
    return found ? `${found.first_name} ${found.last_name}` : String(resourceId);
  }

  removeResource(id: number) {
    const idx = this.resourcesFA.value.findIndex((v) => v === id);
    if (idx > -1) this.resourcesFA.removeAt(idx);
  }

  // ===============================
  // 🔹 FILE HANDLING
  // ===============================
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

  // ===============================
  // 🔹 Navigation
  // ===============================
  goBack() {
    this.location.back();
  }

  cancel() {
    if (this.cancelled.observed) {
      this.cancelled.emit();
    } else {
      this.location.back();
    }
  }

  // ===============================
  // 🔹 SUBMIT
  // ===============================
  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CreateServiceDto = {
      ...this.form.value,
      projectId: this.projectId!,
      resources: this.resourcesFA.value.filter((v): v is number => !!v),
    };

    this.isSubmitting = true;

    if (this.isEditMode) {
      this.serviceService.updateService(this.serviceId, payload).subscribe({
        next: () => {
          alert('Service updated successfully!');
          if (this.submitted.observed) this.submitted.emit();
          else this.router.navigateByUrl(`/projects/${this.projectId}/services`);
        },
        error: (err) => {
          console.error('❌ Error updating service:', err);
          alert('Failed to update service.');
        },
        complete: () => (this.isSubmitting = false),
      });
    } else {
      this.serviceService.createService(payload, this.files).subscribe({
        next: () => {
          alert('Service created successfully!');
          if (this.submitted.observed) this.submitted.emit();
          else this.router.navigateByUrl(`/projects/${this.projectId}/services`);
        },
        error: (err) => {
          console.error('❌ Error creating service:', err);
          alert('Failed to create service.');
        },
        complete: () => (this.isSubmitting = false),
      });
    }
  }

  // ===============================
  // 🔹 RESOURCE MODAL
  // ===============================
  openDevelopersModal(event?: Event) {
    if (event) event.stopPropagation();
    this.showDevelopersModal = true;
  }

  closeDevelopersModal(event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.showDevelopersModal = false;
  }

  onDeveloperSelected(dev: any) {
    if (dev.remove) {
      const idx = this.resourcesFA.value.findIndex((v) => v === dev.id);
      if (idx > -1) this.resourcesFA.removeAt(idx);
    } else {
      if (!this.resourcesFA.value.includes(dev.id)) {
        this.resourcesFA.push(new FormControl(dev.id));
      }
    }
  }

  get selectedResourceIds(): number[] {
    return this.resourcesFA.value.filter((v): v is number => typeof v === 'number');
  }

  // ===============================
  // 🔹 CHIEF + MANAGER MODALS
  // ===============================
  openChiefModal(event?: Event) {
    if (event) event.stopPropagation();
    this.showChiefModal = true;
  }
  closeChiefModal() {
    this.showChiefModal = false;
  }

  openManagerModal(event?: Event) {
    if (event) event.stopPropagation();
    this.showManagerModal = true;
  }
  closeManagerModal() {
    this.showManagerModal = false;
  }

  onChiefSelected(dev: any) {
    if (dev.remove) {
      this.selectedChief = null;
      this.form.patchValue({ chiefId: null });
    } else {
      this.selectedChief = dev;
      this.form.patchValue({ chiefId: dev.id });
    }
  }

  onManagerSelected(dev: any) {
    if (dev.remove) {
      this.selectedManager = null;
      this.form.patchValue({ managerId: null });
    } else {
      this.selectedManager = dev;
      this.form.patchValue({ managerId: dev.id });
    }
  }

  removeChief() {
    this.selectedChief = null;
    this.form.patchValue({ chiefId: null });
  }

  removeManager() {
    this.selectedManager = null;
    this.form.patchValue({ managerId: null });
  }
}
