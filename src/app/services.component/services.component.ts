import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Project } from '@app/project';
import { Service } from '@app/service';
import { ServiceInfo } from '@app/service-info';
import { CreateServiceDto, ServiceService } from '@app/services/service.service';
import { Sidebar } from '@app/sidebar/sidebar';
import { environment } from '@environments/environment';
import { ServiceFormComponent } from '@app/service-form/service-form.component';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [ CommonModule, FormsModule, Sidebar, ServiceFormComponent ],
  templateUrl: './services.component.html',
  styleUrls: [ './services.component.css' ],
})
export class ServicesComponent implements AfterViewInit
{
  services: Service[] = [];
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
  selectedFilter: 'all' | 'active' | 'in-review' | 'urgent' = 'all';
  filterState = { active: true, inReview: true, urgent: true };

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private serviceService: ServiceService,
    private router: Router,
    private location: Location
  ) { }

  ngOnInit()
  {
    this.route.paramMap.subscribe((params) =>
    {
      this.projectId = params.get('projectId');
      this.projectIdNum = this.projectId ? +this.projectId : undefined;
      this.loadServices();
    });
  }

  loadServices()
  {
    if (!this.projectId) return;

    this.http.get<Project>(`${environment.apiUrl}/project/${this.projectId}`).subscribe(
      (res) =>
      {
        this.services = res.services ?? [];
        this.servicesInfo.totalServices = this.services.length;

        let totalTasksCount = 0;
        const uniqueMembers = new Set<number>();

        this.servicesInfo.completedTasks = 0;
        this.servicesInfo.backloggedTasks = 0;
        this.servicesInfo.activeTasks = 0;

        this.servicesInfo.totalMembers = this.services.reduce((total, service) =>
        {

          const serviceUniqueMembers = new Set<number>();

          if (service.chief)
          {
            uniqueMembers.add(service.chief.id);
            serviceUniqueMembers.add(service.chief.id);
          }
          if (service.projectManager)
          {
            uniqueMembers.add(service.projectManager.id);
            serviceUniqueMembers.add(service.projectManager.id);
          }
          if (service.assignedResources) 
          {
            service.assignedResources.forEach((r) => uniqueMembers.add(r.id));
            service.assignedResources.forEach((r) => serviceUniqueMembers.add(r.id));
          }
          if (service.backup)
          {
            service.backup.forEach((b) => uniqueMembers.add(b.id));
            service.backup.forEach((b) => serviceUniqueMembers.add(b.id));
          }

          service.memberCount = serviceUniqueMembers.size;
          service.completionRate = 0;

          let serviceCompletedTasksCount = 0;
          let serviceTotalTasksCount = 0;

          if (service.taskBoard?.cards)
          {
            service.taskBoard.cards.forEach((task) =>
            {
              totalTasksCount++;
              serviceTotalTasksCount++;

              if (task.column === 'new')
              {
                this.servicesInfo.backloggedTasks++;
              } else if (task.column === 'work')
              {
                this.servicesInfo.activeTasks++;
              } else if (task.column === 'done')
              {
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

        this.servicesInfo.completionRate = totalTasksCount > 0
          ? (this.servicesInfo.completedTasks / totalTasksCount) * 100
          : 0;
      },
      (error) => console.error('❌ Failed to load project services:', error)
    );
  }

  onCardClick(s: Service)
  {
    this.router.navigate([ `services/${s.serviceID}/taskboard/${s.taskBoard?.id}` ]);
  }

  openNewService()
  {
    this.showNewService = true;
  }
  closeNewService()
  {
    this.showNewService = false;
  }

  openFilter()
  {
    this.showFilter = true;
  }
  closeFilter()
  {
    this.showFilter = false;
  }

  applyFilters() { }

  matchesStatus(status?: string): boolean
  {
    if (!status) return false;
    const s = status.toLowerCase();
    if (this.selectedFilter !== 'all')
    {
      return (
        (this.selectedFilter === 'active' && s === 'active') ||
        (this.selectedFilter === 'in-review' && s === 'in review') ||
        (this.selectedFilter === 'urgent' && s === 'urgent')
      );
    }
    return (
      (s === 'active' && this.filterState.active) ||
      (s === 'in review' && this.filterState.inReview) ||
      (s === 'urgent' && this.filterState.urgent)
    );
  }

  formatDecimal(num: number): string
  {
    const roundedNum = Math.round(num * 10) / 10;
    let result = String(roundedNum);
    if (result.endsWith('.0'))
    {
      result = result.substring(0, result.length - 2);
    }
    return result;
  }

  getProgress(service: Service): string
  {
    return this.formatDecimal(service.completionRate!);
  }

  toggleMenu(id: number, event: Event)
  {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  goToEdit(s: Service, event: Event)
  {
    event.stopPropagation();
    window.scroll(0, 0);
    const projectId = this.projectId ?? this.route.snapshot.paramMap.get('projectId');
    this.router.navigate([ `/projects/${projectId}/services/${s.serviceID}/edit` ]);
  }

  async deleteService(s: Service)
  {
    try
    {
      const response = await this.http.delete(`${environment.apiUrl}/service/${s.serviceID}`).toPromise();

      this.loadServices();
    }
    catch (error)
    {
      console.error('Error deleting service:', error);
    }
  }

  ngAfterViewInit()
  {
    document.addEventListener('click', () =>
    {
      this.openMenuId = null;
    });
  }

  onServiceCreated()
  {
    this.closeNewService();
    this.loadServices();
  }

  getLimitedString(inputString: string, letterAmount: number): string
  {
    return inputString.slice(0, letterAmount) + "...";
  }

  goBack()
  {
    this.location.back();
  }
}
