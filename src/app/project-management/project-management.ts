import { AfterViewInit, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ProjectService } from '@app/services/project.service';
import { Sidebar } from '@app/sidebar/sidebar';
import { Router } from '@angular/router';
import { Project } from '@app/project';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { ExcelImporter } from '@app/excel-importer/excel-importer';
import { HeaderComponent } from '@app/header/header';

@Component({
  selector: 'app-project-management',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, ExcelImporter, HeaderComponent],
  templateUrl: './project-management.html',
  styleUrls: ['./project-management.scss'],
})
export class ProjectManagement implements OnInit, AfterViewInit {
  projects: Project[] = [];
  currentPage = 1;
  pageSize = 11;
  totalProjects = 0;
  pageNumbers: number[] = [];
  searchQuery = '';
  selectedFilter: 'all' | 'active' | 'on hold' = 'all';
  selectedFile: File | null = null;

  showNewProject = false;
  showEditProject = false;
  newProject: Partial<Project> = this.blankNewProject();
  editProject: Partial<Project> = this.blankNewProject();
  lastEditProject: Partial<Project> = this.blankNewProject();

  openMenuId: number | null = null;
  projectsInfo = { totalProjects: 0 };

  showMembersModal = false;
  selectedMembers: { id?: number; name: string; role: string; image: string }[] = [];

  constructor(
    private projectService: ProjectService,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    document.addEventListener('click', () => (this.openMenuId = null));
  }

  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.loadProjects();
  }

  /** ===== Excel Upload ===== */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) this.selectedFile = file;
  }

  /** ===== Load Projects ===== */
  loadProjects(): void {
    const options = this.buildQueryOptions();
    this.projectService
      .getProjectsCount({ status: options.status, search: options.search })
      .subscribe((count) => {
        this.totalProjects = count;
        this.projectsInfo.totalProjects = count;
        this.updatePageNumbers();

        this.projectService.getProjects(options).subscribe((data) => {
          this.projects = data.map((p) => {
            let totalCardsCount = 0;
            let completedCardsCount = 0;
            const uniqueMembers = new Set<number>();
            let closestDeadline: Date | null = null;

            (p.services || []).forEach((s: any) => {
              if (s.chief) uniqueMembers.add(s.chief.id);
              if (s.projectManager) uniqueMembers.add(s.projectManager.id);
              (s.assignedResources || []).forEach((r: any) => uniqueMembers.add(r.id));
              (s.backup || []).forEach((b: any) => uniqueMembers.add(b.id));

              if (s.taskBoard?.cards) {
                totalCardsCount += s.taskBoard.cards.length;
                completedCardsCount += s.taskBoard.cards.filter(
                  (card: any) => card.column === 'done'
                ).length;
              }

              if (s.deadline) {
                const d = new Date(s.deadline);
                if (!closestDeadline || d < closestDeadline) closestDeadline = d;
              }
            });

            const progress =
              totalCardsCount > 0 ? (completedCardsCount / totalCardsCount) * 100 : 0;

            return {
              ...p,
              members: uniqueMembers.size,
              deadline: closestDeadline || null,
              progress,
            } as any;
          });
        });
      });
  }

  private getSelectedStatusForApi(): string {
    switch (this.selectedFilter) {
      case 'active':
        return 'Active';
      case 'on hold':
        return 'On Hold';
      default:
        return 'all';
    }
  }

  private buildQueryOptions() {
    const status = this.getSelectedStatusForApi();
    const search =
      this.searchQuery && this.searchQuery.trim().length ? this.searchQuery.trim() : undefined;
    return { page: this.currentPage, limit: this.pageSize, status, search };
  }

  /** ===== Pagination ===== */
  onFilterChange(): void {
    this.currentPage = 1;
    this.loadProjects();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.getTotalPages()) return;
    this.currentPage = page;
    this.loadProjects();
  }

  jumpToPage(first: boolean): void {
    this.currentPage = first ? 1 : this.getTotalPages();
    this.loadProjects();
  }

  getTotalPages(): number {
    return Math.ceil(this.totalProjects / this.pageSize) || 1;
  }

  updatePageNumbers(): void {
    const total = this.getTotalPages();
    const curr = this.currentPage;
    this.pageNumbers = [];

    let start = Math.max(1, curr - 2);
    let end = Math.min(total, curr + 2);
    if (end - start < 4) {
      if (curr <= 3) end = Math.min(5, total);
      else start = Math.max(1, end - 4);
    }
    for (let i = start; i <= end; i++) this.pageNumbers.push(i);
  }

  /** ===== Card Actions ===== */
  onCardClick(p: Project): void {
    if (!p.projectID) return;
    this.router.navigate([`/projects/${p.projectID}/services`]);
  }

  /** ===== Modals ===== */
  openNewProject(): void {
    this.showNewProject = true;
    this.newProject = this.blankNewProject();
  }

  closeNewProject(): void {
    this.showNewProject = false;
  }

  private blankNewProject(): Partial<Project> {
    return { name: '', status: 'Active', progress: 0 };
  }

  saveNewProject(form: NgForm): void {
    if (form.invalid) return;
    this.projectService.createProject(this.newProject).subscribe(() => {
      this.closeNewProject();
      this.currentPage = 1;
      this.loadProjects();
    });
  }

  openEditProject(): void {
    this.showEditProject = true;
    this.editProject = this.blankNewProject();
  }

  closeEditProject(): void {
    this.editProject = { ...this.lastEditProject };
    this.showEditProject = false;
    this.loadProjects();
  }

  toggleMenu(id: number, event: Event): void {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  goToEdit(p: Project, event: Event): void {
    event.stopPropagation();
    this.lastEditProject = { ...p };
    this.openEditProject();
    this.editProject = { ...p };
  }

  updateProject(form: NgForm): void {
    if (!this.editProject.projectID) return;
    const payload: Partial<Project> = {
      name: this.editProject.name,
      description: this.editProject.description,
      status: this.editProject.status,
    };
    this.lastEditProject = { ...payload };
    this.http
      .patch(`${environment.apiUrl}/project/${this.editProject.projectID}`, payload)
      .subscribe(
        () => this.closeEditProject(),
        (err) => console.error(err)
      );
  }

  deleteProject(p: Project): void {
    if (!p.projectID) return;
    this.http
      .delete(`${environment.apiUrl}/project/${p.projectID}`)
      .subscribe(
        () => this.loadProjects(),
        (err) => console.error(err)
      );
  }

openMembersModal(p: Project, event: Event): void {
  event.stopPropagation();

  const memberMap = new Map<number | string, any>();

  const addMember = (user: any, role: string) => {
    if (!user) return;
    const key = user.id || user.email || `${user.first_name}${user.last_name}`;
    const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    const image =
      user.profileImage ||
      user.image ||
      user.profile_img ||
      user.profile_image ||
      user.profileImageURL ||
      '';

    if (!memberMap.has(key)) {
      memberMap.set(key, { id: user.id, name, roles: new Set([role]), image });
    } else {
      memberMap.get(key).roles.add(role);
    }
  };

  // collect members from project’s services
  (p.services || []).forEach((s: any) => {
    addMember(s.chief, 'Chief');
    addMember(s.projectManager, 'Project Manager');
    (s.assignedResources || []).forEach((r: any) => addMember(r, 'Developer'));
    (s.backup || []).forEach((b: any) => addMember(b, 'Backup'));
  });

  const members = Array.from(memberMap.values());

  // ✅ Like header: use cache + refresh if missing
  Promise.all(
    members.map(async (m) => {
      if (!m.id) return m;

      const cacheKey = `profileImage_${m.id}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        // Load instantly from cache
        m.image = cached;
        return m;
      }

      // Otherwise, call user API once and cache
      try {
        const updated = await this.http
          .get<any>(`${environment.apiUrl}/user/${m.id}`)
          .toPromise();

        if (updated?.profileImage) {
          const img = updated.profileImage.startsWith('http')
            ? updated.profileImage
            : `${environment.apiUrl.replace('/api', '')}/${updated.profileImage}`;
          m.image = img;
          localStorage.setItem(cacheKey, img); // ✅ cache it
        }
      } catch (err) {
        console.warn(`Failed to fetch user ${m.id}`, err);
      }

      return m;

    })
  ).then((freshMembers) => {
    this.selectedMembers = freshMembers.map((m) => ({
      id: m.id,
      name: m.name,
      role: Array.from(m.roles).join(', '),
      image: m.image,
    }));

    this.showMembersModal = true;
    this.cdr.detectChanges();
  });
}



  private refreshMembers(memberMap: Map<any, any>) {
    this.selectedMembers = Array.from(memberMap.values()).map((m) => ({
      id: m.id,
      name: m.name,
      role: Array.from(m.roles).join(', '),
      image: m.image,
    }));
  }

  closeMembersModal(): void {
    this.showMembersModal = false;
  }

  /** ===== Image Helpers ===== */

  /**
   * Build the correct URL for member avatar:
   * - If it's a full http/https URL (signed from backend) => use as-is.
   * - If it's an S3 key like "profile-images/..." => map to your S3 bucket.
   * - If it's a relative path => map via environment.apiUrl.
   * - Fallback to default avatar.
   */
  getMemberAvatar(image?: string | null): string {
    if (!image || !image.trim()) {
      return 'images/user.png';
    }

    const trimmed = image.trim();

    // Already full URL (e.g., signed URL from backend)
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    // S3 key patterns
    if (
      trimmed.startsWith('profile-images/') ||
      trimmed.startsWith('uploads/')
    ) {
      return `https://iga-project-files.s3.me-south-1.amazonaws.com/${trimmed}`;
    }

    // Relative path served by backend API
    const base = environment.apiUrl.replace(/\/+$/, '');
    if (trimmed.startsWith('/')) {
      return `${base}${trimmed}`;
    }
    return `${base}/${trimmed}`;
  }

  onMemberImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'images/user.png';
  }

  /** ===== Utilities ===== */
  formatDecimal(num: number | undefined): string {
    const n = num || 0;
    const roundedNum = Math.round(n * 10) / 10;
    return roundedNum.toString().replace(/\.0$/, '');
  }

  getLimitedString(input: string, max: number): string {
    if (!input) return '';
    return input.length <= max ? input : input.slice(0, max) + '...';
  }
}
