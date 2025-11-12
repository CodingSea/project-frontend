import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, AfterViewInit, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Project } from '@app/project';
import { Service } from '@app/service';
import { ServiceInfo } from '@app/service-info';
import { ServiceService } from '@app/services/service.service';
import { Sidebar } from '@app/sidebar/sidebar';
import { environment } from '@environments/environment';
import { ServiceFormComponent } from '@app/service-form/service-form.component';
import { HeaderComponent } from '@app/header/header';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, ServiceFormComponent, HeaderComponent],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css'],
})
export class ServicesComponent implements OnInit, AfterViewInit {
  services: Service[] = [];
  filteredServices: Service[] = [];
  showNewService = false;

  projectId: string | null = null;
  projectIdNum: number | undefined;

  servicesInfo: ServiceInfo = {
    totalServices: 0,
    backloggedTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
    totalMembers: 0,
    completionRate: 0.0,
  };

  openMenuId: number | null = null;
  showFilter = false;

  searchTerm = '';
  selectedStatus = '';
  hasTasksFilter = ''; // 🟩 NEW FILTER
  statuses: string[] = [
    'Not Started Yet',
    'Pending Approval',
    'In-Progress',
    'Completed',
    'On Hold',
    'At Risk',
    'Overdue',
  ];

  currentPage = 1;
  pageSize = 7;
  totalPages = 1;
  pages: number[] = [];

  // 🟩 Role control
  currentUser: any = null;
  isAdmin = false;
  userId: number | null = null;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private serviceService: ServiceService,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit() {
    this.loadCurrentUser();
    this.route.paramMap.subscribe((params) => {
      this.projectId = params.get('projectId');
      this.projectIdNum = this.projectId ? +this.projectId : undefined;
      this.loadServices();
    });
  }

  /** ✅ Decode token and set user info */
  private loadCurrentUser(): void {
    try {
      const token =
        localStorage.getItem('access_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('jwt');
      if (!token) return;

      const payload = JSON.parse(atob(token.split('.')[1]));
      this.userId = Number(payload.id || payload.userId || payload.sub);
      const role = (payload.role || payload.userType || '').toLowerCase();
      this.isAdmin = role === 'admin';
      this.currentUser = payload;
    } catch (e) {
      console.warn('⚠️ Failed to decode user token', e);
    }
  }

  /** ===== Load services and compute stats ===== */
  loadServices() {
    if (!this.projectId) return;

    this.http.get<Project>(`${environment.apiUrl}/project/${this.projectId}`).subscribe(
      (res) => {
        this.services = res.services ?? [];
        this.servicesInfo.totalServices = this.services.length;
        this.applySearch();
        this.calculateStats();
      },
      (error) => console.error('❌ Failed to load project services:', error)
    );
  }

  /** ===== Filtering ===== */
  applySearch() {
    let filtered = this.services;

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          (s.description && s.description.toLowerCase().includes(term))
      );
    }

    if (this.selectedStatus) {
      filtered = filtered.filter((s) => s.status === this.selectedStatus);
    }

    if (this.hasTasksFilter === 'true') {
      filtered = filtered.filter((s) => s.taskBoard?.cards && s.taskBoard.cards.length > 0);
    } else if (this.hasTasksFilter === 'false') {
      filtered = filtered.filter((s) => !s.taskBoard?.cards || s.taskBoard.cards.length === 0);
    }

    this.totalPages = Math.ceil(filtered.length / this.pageSize);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.filteredServices = filtered.slice(start, end);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.applySearch();
  }
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applySearch();
    }
  }
  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applySearch();
    }
  }
  goToFirstPage() {
    this.currentPage = 1;
    this.applySearch();
  }
  goToLastPage() {
    this.currentPage = this.totalPages;
    this.applySearch();
  }

  /** ===== Stats ===== */
  calculateStats() {
    let totalTasksCount = 0;
    const uniqueMembers = new Set<number>();

    this.servicesInfo.completedTasks = 0;
    this.servicesInfo.backloggedTasks = 0;
    this.servicesInfo.activeTasks = 0;

    this.servicesInfo.totalMembers = this.services.reduce((total, service) => {
      const serviceUniqueMembers = new Set<number>();

      if (service.chief) {
        uniqueMembers.add(service.chief.id);
        serviceUniqueMembers.add(service.chief.id);
      }
      if (service.projectManager) {
        uniqueMembers.add(service.projectManager.id);
        serviceUniqueMembers.add(service.projectManager.id);
      }
      if (service.assignedResources) {
        service.assignedResources.forEach((r) => uniqueMembers.add(r.id));
        service.assignedResources.forEach((r) => serviceUniqueMembers.add(r.id));
      }
      if (service.backup) {
        service.backup.forEach((b) => uniqueMembers.add(b.id));
        service.backup.forEach((b) => serviceUniqueMembers.add(b.id));
      }

      service.memberCount = serviceUniqueMembers.size;
      service.completionRate = 0;

      let serviceCompletedTasksCount = 0;
      let serviceTotalTasksCount = 0;

      if (service.taskBoard?.cards) {
        service.taskBoard.cards.forEach((task) => {
          totalTasksCount++;
          serviceTotalTasksCount++;

          if (task.column === 'new') {
            this.servicesInfo.backloggedTasks++;
          } else if (task.column === 'work') {
            this.servicesInfo.activeTasks++;
          } else if (task.column === 'done') {
            serviceCompletedTasksCount++;
            this.servicesInfo.completedTasks++;
          }
        });

        service.completionRate =
          serviceTotalTasksCount > 0
            ? (serviceCompletedTasksCount / serviceTotalTasksCount) * 100
            : 0;
      }

      return total + service.memberCount;
    }, 0);

    this.servicesInfo.totalMembers = uniqueMembers.size;
    this.servicesInfo.completionRate =
      totalTasksCount > 0
        ? (this.servicesInfo.completedTasks / totalTasksCount) * 100
        : 0;
  }

  /** ===== UI actions ===== */
  onCardClick(s: Service) {
    this.router.navigate([`services/${s.serviceID}/taskboard/${s.taskBoard?.id}`]);
  }

  openNewService() {
    if (!this.isAdmin) return; // 🔒 Only admin can add
    this.showNewService = true;
  }
  closeNewService() {
    this.showNewService = false;
  }

  toggleMenu(id: number, event: Event) {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  /** ===== Permission logic for Edit/Delete ===== */
  canEditService(service: Service): boolean {
    // Admins always can
    if (this.isAdmin) return true;
    // Chief of that service can edit
    return service.chief && Number(service.chief.id) === this.userId;
  }

  canDeleteService(): boolean {
    // Delete only for admin
    return this.isAdmin;
  }

  goToEdit(s: Service, event: Event) {
    if (!this.canEditService(s)) return; // 🔒 Check permission
    event.stopPropagation();
    window.scroll(0, 0);
    const projectId = this.projectId ?? this.route.snapshot.paramMap.get('projectId');
    this.router.navigate([`/projects/${projectId}/services/${s.serviceID}/edit`]);
  }

  async deleteService(s: Service) {
    if (!this.canDeleteService()) return; // 🔒 Admin only
    try {
      await this.http.delete(`${environment.apiUrl}/service/${s.serviceID}`).toPromise();
      this.loadServices();
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  }

  formatDecimal(num: number): string {
    const roundedNum = Math.round(num * 10) / 10;
    let result = String(roundedNum);
    if (result.endsWith('.0')) result = result.substring(0, result.length - 2);
    return result;
  }

  ngAfterViewInit() {
    document.addEventListener('click', () => {
      this.openMenuId = null;
    });
  }

  onServiceCreated() {
    this.closeNewService();
    this.loadServices();
  }

  getLimitedString(inputString: string, letterAmount: number): string {
    return inputString.slice(0, letterAmount) + '...';
  }

  goBack() {
    this.location.back();
  }
}
