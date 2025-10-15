import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Project } from '@app/project';
import { Service } from '@app/service';
import { ServiceService } from '@app/services/service.service';
import { Sidebar } from '@app/sidebar/sidebar';
import { environment } from '@environments/environment';
import { ServiceFormComponent } from '@app/service-form/service-form.component';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, ServiceFormComponent],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css']
})
export class ServicesComponent {
  services: Service[] = [];

  // popup
  showNewService = false;

  // route / stats
  projectId: string | null = null;
  projectIdNum: number | undefined;

  servicesInfo = {
    totalServices: 0,
    backloggedTasks: 0,
    activeTasks: 0,
    totalMembers: 0,
    completionRate: 0.0,
  };

  openMenuId: number | null = null;

  // Filters
  showFilter = false;
  selectedFilter: 'all' | 'active' | 'in-review' | 'urgent' = 'all';
  filterState = { active: true, inReview: true, urgent: true };

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private serviceService: ServiceService,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.projectId = params.get('projectId');
      this.projectIdNum = this.projectId ? +this.projectId : undefined;
      this.loadServices();
    });
  }

  loadServices() {
    if (!this.projectId) return;

    this.http.get<Project>(`${environment.apiUrl}/project/${this.projectId}`).subscribe(
      (res) => {
        this.services = res.services ?? [];
        this.servicesInfo.totalServices = this.services.length;

        let totalTasksCount = 0;
        let completedTasksCount = 0;
        this.servicesInfo.backloggedTasks = 0;
        this.servicesInfo.activeTasks = 0;

        this.servicesInfo.totalMembers = this.services.reduce((total, service) => {
          const chiefCount = service.chief ? 1 : 0;
          const projectManagerCount = service.projectManager ? 1 : 0;
          const backupCount = service.backup ? 1 : 0;
          const assignedResourcesCount = service.assignedResources ? service.assignedResources.length : 0;

          service.memberCount = chiefCount + projectManagerCount + backupCount + assignedResourcesCount;
          service.completionRate = 0;

          let serviceCompletedTasksCount = 0;
          let serviceTotalTasksCount = 0;

          if (service.taskBoard?.cards) {
            service.taskBoard.cards.forEach(task => {
              totalTasksCount++;
              serviceTotalTasksCount++;

              if (task.column === 'new') {
                this.servicesInfo.backloggedTasks++;
              } else if (task.column === 'work') {
                this.servicesInfo.activeTasks++;
              } else if (task.column === 'done') {
                serviceCompletedTasksCount++;
                completedTasksCount++;
              }
            });

            service.completionRate = serviceTotalTasksCount > 0
              ? (serviceCompletedTasksCount / serviceTotalTasksCount) * 100
              : 0;
          }

          return total + chiefCount + projectManagerCount + backupCount + assignedResourcesCount;
        }, 0);

        this.servicesInfo.completionRate = totalTasksCount > 0
          ? (completedTasksCount / totalTasksCount) * 100
          : 0;
      },
      (error) => console.error('❌ Failed to load project services:', error)
    );
  }

  onCardClick(s: Service) {
    this.router.navigate([`services/${s.serviceID}/taskboard/${s.taskBoard?.id}`]);
  }

  openNewService() { this.showNewService = true; }
  closeNewService() { this.showNewService = false; }

  openFilter() { this.showFilter = true; }
  closeFilter() { this.showFilter = false; }
  applyFilters() { }

  matchesStatus(status?: string): boolean {
    if (!status) return false;
    const s = status.toLowerCase();
    if (this.selectedFilter !== 'all') {
      return (this.selectedFilter === 'active' && s === 'active')
        || (this.selectedFilter === 'in-review' && s === 'in review')
        || (this.selectedFilter === 'urgent' && s === 'urgent');
    }
    return (s === 'active' && this.filterState.active)
      || (s === 'in review' && this.filterState.inReview)
      || (s === 'urgent' && this.filterState.urgent);
  }

  toggleMenu(id: number, event: Event) {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  goToEdit(s: Service, event: Event) {
    event.stopPropagation();
    const projectId = this.projectId ?? this.route.snapshot.paramMap.get('projectId');
    this.router.navigate([`/projects/${projectId}/services/${s.serviceID}/edit`]);
  }

  ngAfterViewInit() {
    document.addEventListener('click', () => {
      this.openMenuId = null;
    });
  }
  onServiceCreated() {
  this.closeNewService();   // close popup
  this.loadServices();      // reload from backend ✅
}

}
