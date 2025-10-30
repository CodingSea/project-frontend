import { Component, HostListener, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import
{
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ServiceService, CreateServiceDto } from '../services/service.service';
import { UserService, User } from '@app/services/user.service';
import { DevelopersSearchComponent } from '@app/developers.search.component/developers.search.component';
import { ServiceStatus, ServiceStatusForEdit } from '@app/service';
import { Service } from '@app/service';

interface ExistingFile
{
  name: string;
  url: string;
}

enum DefaultStatus
{
  Default = "Default",
  OnHold = "On Hold"
}

@Component({
  selector: 'app-service-form',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule, RouterModule, DevelopersSearchComponent, FormsModule ],
  templateUrl: './service-form.component.html',
  styleUrls: [ './service-form.component.scss' ],
})
export class ServiceFormComponent implements OnInit, OnDestroy
{
  @Input() projectId?: number;
  @Output() submitted = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;
  files: File[] = [];
  existingFiles: ExistingFile[] = [];
  filesToDelete: ExistingFile[] = [];
  isDragging = false;
  isSubmitting = false;

  chiefs: User[] = [];
  managers: User[] = [];
  allResources: User[] = [];

  isEditMode = false;
  serviceId!: number;

  showDevelopersModal = false;
  showChiefModal = false;
  showManagerModal = false;
  selectedChief: User | null = null;
  selectedManager: User | null = null;

  status: string[] = Object.values(ServiceStatusForEdit);
  showStatus: boolean = true;


  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private serviceService: ServiceService,
    private userService: UserService,
    private location: Location
  )
  {
    this.form = this.fb.group({
      name: [ '', [ Validators.required, Validators.pattern(/^[A-Za-z0-9 ]{3,50}$/) ] ],
      deadline: [ '', Validators.required ],
      description: [
        '',
        [ Validators.pattern(/^$|^[A-Za-z0-9.,!?()\s-]{1,300}$/), Validators.maxLength(300) ],
      ],
      chiefId: [ null, Validators.required ],
      managerId: [ null ],
      resources: this.fb.array<number>([] as number[]),
      status: [ ServiceStatus.New || DefaultStatus.Default, Validators.required ],
    });
  }

  ngOnInit(): void
  {
    if (!this.projectId)
    {
      this.projectId = Number(this.route.snapshot.paramMap.get('projectId')) || 1;
    }

    const sid = this.route.snapshot.paramMap.get('serviceId');
    this.isEditMode = !!sid;

    if (sid)
    {
      this.serviceId = Number(sid);
      this.loadServiceForEdit(this.serviceId);
    }

    this.loadUsers();
  }

  ngOnDestroy(): void
  {
    this.unlockBodyScroll();
  }

  private toYmd(dateStr?: string | Date | null): string
  {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  private loadServiceForEdit(id: number): void
  {
    this.serviceService.getService(id).subscribe({
      next: (svc: Service) =>
      {

        if (svc.status == "In-Progress" || svc.status == "Not Started Yet")
        {
          // this.showStatus = false;
          this.status = Object.values(DefaultStatus);
          svc.status = DefaultStatus.Default;
        }
        else if (svc.status == "Completed")
        {
          svc.status = ServiceStatus.Completed;
          this.showStatus = true;
        }

        this.form.patchValue({
          name: svc.name ?? '',
          deadline: this.toYmd(svc.deadline),
          description: svc.description ?? '',
          chiefId: svc.chief?.id ?? null,
          managerId: svc.projectManager?.id ?? null,
          status: svc.status
        });

        this.existingFiles = svc.files ? svc.files.map((f) => ({ name: f.name, url: f.url })) : [];

        if (svc.chief) this.selectedChief = svc.chief as User;
        if (svc.projectManager) this.selectedManager = svc.projectManager as User;

        this.resourcesFA.clear();
        (svc.assignedResources ?? []).forEach((r) =>
        {
          this.resourcesFA.push(new FormControl(r.id));
        });
      },
      error: (e) => console.error('❌ Failed to load service for edit', e),
    });
  }

  loadUsers(): void
  {
    this.userService.getAllUsers().subscribe({
      next: (users) =>
      {
        this.chiefs = users;
        this.managers = users;
        this.allResources = users;
      },
      error: (err) => console.error('❌ Error loading users:', err),
    });
  }

  get resourcesFA(): FormArray<FormControl<number | null>>
  {
    return this.form.get('resources') as FormArray<FormControl<number | null>>;
  }

  getResourceName(resourceId: number | null | undefined): string
  {
    if (!resourceId) return '';
    const found = this.allResources.find((r) => r.id === resourceId);
    return found ? `${found.first_name} ${found.last_name}` : String(resourceId);
  }

  removeResource(id: number): void
  {
    const idx = this.resourcesFA.value.findIndex((v) => v === id);
    if (idx > -1) this.resourcesFA.removeAt(idx);
  }

  // ========= FILE HANDLING =========
  onFilesSelected(e: Event): void
  {
    const input = e.target as HTMLInputElement;
    if (!input.files) return;
    this.addFileList(input.files);
    input.value = '';
  }

  addFileList(list: FileList): void
  {
    Array.from(list).forEach((f) => this.files.push(f));
  }

  markFileForDeletion(file: ExistingFile): void
  {
    this.existingFiles = this.existingFiles.filter((f) => f !== file);
    this.filesToDelete.push(file);
  }

  @HostListener('dragover', [ '$event' ])
  onDragOver(ev: DragEvent): void
  {
    ev.preventDefault();
    this.isDragging = true;
  }

  @HostListener('dragleave', [ '$event' ])
  onDragLeave(ev: DragEvent): void
  {
    ev.preventDefault();
    this.isDragging = false;
  }

  @HostListener('drop', [ '$event' ])
  onDrop(ev: DragEvent): void
  {
    ev.preventDefault();
    this.isDragging = false;
    if (ev.dataTransfer?.files?.length) this.addFileList(ev.dataTransfer.files);
  }

  // ========= NAVIGATION =========
  goBack(): void
  {
    this.location.back();
  }

  cancel(): void
  {
    if (this.cancelled.observed) this.cancelled.emit();
    else this.location.back();
  }

  // ========= SUBMIT =========
  submit(): void
  {
    if (this.form.invalid)
    {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CreateServiceDto = {
      ...this.form.value,
      projectId: this.projectId!,
      resources: this.resourcesFA.value.filter((v): v is number => !!v),
    };

    this.isSubmitting = true;

    if (this.isEditMode)
    {
      const updatedFiles = this.existingFiles;

      const formData = new FormData();
      formData.append('name', payload.name);
      formData.append('deadline', payload.deadline);
      if (payload.description) formData.append('description', payload.description);
      formData.append('projectId', String(payload.projectId));
      formData.append('chiefId', String(payload.chiefId));
      if (payload.managerId) formData.append('managerId', String(payload.managerId));
      payload.resources.forEach((r) => formData.append('resources', String(r)));

      formData.append('files', JSON.stringify(updatedFiles));
      this.files.forEach((file) => formData.append('newFiles', file));
      formData.append('filesToDelete', JSON.stringify(this.filesToDelete));


      if (this.form.get("status")?.value != DefaultStatus.Default.valueOf())
      {
        formData.append('status', this.form.get("status")?.value);
      }

      this.serviceService.updateServiceWithFiles(this.serviceId, formData).subscribe({
        next: () =>
        {
          alert('Service updated successfully!');
          if (this.submitted.observed) this.submitted.emit();
          else this.router.navigateByUrl(`/projects/${this.projectId}/services`);
        },
        error: (err) =>
        {
          console.error('❌ Error updating service:', err);
          alert('Failed to update service.');
        },
        complete: () => (this.isSubmitting = false),
      });
    } else
    {
      this.serviceService.createService(payload, this.files).subscribe({
        next: () =>
        {
          alert('Service created successfully!');
          if (this.submitted.observed) this.submitted.emit();
          else this.router.navigateByUrl(`/projects/${this.projectId}/services`);
        },
        error: (err) =>
        {
          console.error('❌ Error creating service:', err);
          alert('Failed to create service.');
        },
        complete: () => (this.isSubmitting = false),
      });
    }
  }

  // ========= MODALS WITH SCROLL LOCK =========
  private lockBodyScroll()
  {
    document.body.style.overflow = 'hidden';
  }
  private unlockBodyScroll()
  {
    document.body.style.overflow = '';
  }
  private updateScrollLock()
  {
    if (this.showDevelopersModal || this.showChiefModal || this.showManagerModal) this.lockBodyScroll();
    else this.unlockBodyScroll();
  }

  openDevelopersModal(event?: Event): void
  {
    if (event) event.stopPropagation();
    this.showDevelopersModal = true;
    this.updateScrollLock();
  }

  closeDevelopersModal(event?: Event): void
  {
    if (event)
    {
      event.stopPropagation();
      event.preventDefault();
    }
    this.showDevelopersModal = false;
    this.updateScrollLock();
  }

  openChiefModal(event?: Event): void
  {
    if (event) event.stopPropagation();
    this.showChiefModal = true;
    this.updateScrollLock();
  }

  closeChiefModal(): void
  {
    this.showChiefModal = false;
    this.updateScrollLock();
  }

  openManagerModal(event?: Event): void
  {
    if (event) event.stopPropagation();
    this.showManagerModal = true;
    this.updateScrollLock();
  }

  closeManagerModal(): void
  {
    this.showManagerModal = false;
    this.updateScrollLock();
  }

  // ========= SELECTION HANDLERS =========
  onDeveloperSelected(dev: any): void
  {
    if (dev.remove)
    {
      const idx = this.resourcesFA.value.findIndex((v) => v === dev.id);
      if (idx > -1) this.resourcesFA.removeAt(idx);
    } else if (!this.resourcesFA.value.includes(dev.id))
    {
      this.resourcesFA.push(new FormControl(dev.id));
    }
  }

  get selectedResourceIds(): number[]
  {
    return this.resourcesFA.value.filter((v): v is number => typeof v === 'number');
  }

  onChiefSelected(dev: any): void
  {
    if (dev.remove)
    {
      this.selectedChief = null;
      this.form.patchValue({ chiefId: null });
    } else
    {
      this.selectedChief = dev;
      this.form.patchValue({ chiefId: dev.id });
    }
  }

  onManagerSelected(dev: any): void
  {
    if (dev.remove)
    {
      this.selectedManager = null;
      this.form.patchValue({ managerId: null });
    } else
    {
      this.selectedManager = dev;
      this.form.patchValue({ managerId: dev.id });
    }
  }

  removeChief(): void
  {
    this.selectedChief = null;
    this.form.patchValue({ chiefId: null });
  }

  removeManager(): void
  {
    this.selectedManager = null;
    this.form.patchValue({ managerId: null });
  }

  removeNewFile(file: File): void
  {
    this.files = this.files.filter((f) => f !== file);
  }
}
