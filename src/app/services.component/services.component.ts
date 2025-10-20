import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Project } from '@app/project';
import { Service } from '@app/service';
import { ServiceInfo } from '@app/service-info';
import { CreateServiceDto, ServiceService } from '@app/services/service.service';
import { Sidebar } from '@app/sidebar/sidebar';
import { environment } from '@environments/environment';
@Component({
  selector: 'app-services.component',
  imports: [ CommonModule, FormsModule, Sidebar ],
  templateUrl: './services.component.html',
  styleUrl: './services.component.css'
})
export class ServicesComponent
{
  services: Service[] = [];

  showNewService = false;
  newService: Partial<Service> = this.blankNewService();

  projectId: string | null = null;

  servicesInfo: ServiceInfo = {
    totalServices: 0,
    backloggedTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
    totalMembers: 0,
    completionRate: 0.0
  }

  // Filters
  showFilter = false;
  selectedFilter: 'all' | 'active' | 'in-review' | 'urgent' = 'all';
  filterState = { active: true, inReview: true, urgent: true };

  constructor(private http: HttpClient,
    private route: ActivatedRoute,
    private serviceService: ServiceService,
    private router: Router,
    private location: Location) { }

  ngOnInit()
  {
    this.projectId = this.route.snapshot.paramMap.get('projectId');

    this.http.get<Project>(`${environment.apiUrl}/project/${this.projectId}`).subscribe(
      (res) =>
      {
        this.services = res.services; // Assuming res has a 'services' property
        this.servicesInfo.totalServices = this.services.length;

        let totalTasksCount = 0;
        const uniqueMembers = new Set<number>(); // Create a Set to track unique member IDs

        this.servicesInfo.totalMembers = this.services.reduce((total, service) =>
        {
          // Add unique members to the Set
          if (service.chief) uniqueMembers.add(service.chief.id);
          if (service.projectManager) uniqueMembers.add(service.projectManager.id);
          if (service.assignedResources)
          {
            service.assignedResources.forEach(resource => uniqueMembers.add(resource.id));
          }
          if (service.backup)
          {
            service.backup.forEach(b => uniqueMembers.add(b.id));
          }

          service.memberCount = uniqueMembers.size; // Update service member count

          service.completionRate = 0;

          let serviceBackloggedTasksCount = 0;
          let serviceActiveTasksCount = 0;
          let serviceCompletedTasksCount = 0;
          let serviceTotalTasksCount = 0;

          // Count tasks based on their status
          if (service.taskBoard && service.taskBoard.cards)
          {
            service.taskBoard.cards.forEach(task =>
            {
              totalTasksCount++;
              serviceTotalTasksCount++; // Count every task

              if (task.column === 'new')
              {
                serviceBackloggedTasksCount++;
                this.servicesInfo.backloggedTasks++;
              } else if (task.column === 'work')
              {
                serviceActiveTasksCount++;
                this.servicesInfo.activeTasks++;
              } else if (task.column === 'done')
              {
                serviceCompletedTasksCount++;
                this.servicesInfo.completedTasks++;
              }
            });
            service.completionRate = serviceTotalTasksCount > 0
              ? (serviceCompletedTasksCount / serviceTotalTasksCount) * 100
              : 0;
          }

          // Return the accumulated total
          return total + service.memberCount; // This will not be used directly now
        }, 0);

        // Set the totalMembers from the uniqueMembers Set
        this.servicesInfo.totalMembers = uniqueMembers.size;

        this.servicesInfo.completionRate = totalTasksCount > 0
          ? (this.servicesInfo.completedTasks / totalTasksCount) * 100
          : 0;
      },
      (error) =>
      {
        console.log(error);
      }
    );
  }

  // card click from template
  onCardClick(s: Service) // Updated parameter type
  {
    // Do whatever you want here (navigate, open details, etc.)
    // For now just avoid the TS error:
    console.log('Open service', s.serviceID); // Updated log

    this.router.navigate([ `services/${s.serviceID}/taskboard/${s.taskBoard?.id}` ])
  }

  // New service modal handlers
  openNewService() { this.router.navigate([ `${this.router.url}/new` ]); } // Updated method
  closeNewService() { this.showNewService = false; } // Updated method

  private blankNewService(): Partial<Service> // Updated method
  {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    const yyyyMmDd = d.toISOString().slice(0, 10);
    return { name: '' }; // Adjust fields as necessary
  }

  saveNewService(form: any) // Updated method
  {
    if (form.invalid) return;

    if (!this.newService.deadline)
    {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      this.newService.deadline = d;
    }
  }

  // Filter panel
  openFilter() { this.showFilter = true; }
  closeFilter() { this.showFilter = false; }
  applyFilters() { }

  matchesStatus(status?: string): boolean
  {
    if (!status) return false;
    const s = status.toLowerCase();
    if (this.selectedFilter !== 'all')
    {
      return (this.selectedFilter === 'active' && s === 'active')
        || (this.selectedFilter === 'in-review' && s === 'in review')
        || (this.selectedFilter === 'urgent' && s === 'urgent');
    }
    return (s === 'active' && this.filterState.active)
      || (s === 'in review' && this.filterState.inReview)
      || (s === 'urgent' && this.filterState.urgent);
  }

  formatDecimal(num: number): string
  {
    // Round to one decimal place to handle cases like 1.123 -> 1.1 or 1.987 -> 2.0
    const roundedNum = Math.round(num * 10) / 10;

    // Convert to string
    let result = String(roundedNum);

    // Remove trailing .0 if present
    if (result.endsWith(".0"))
    {
      result = result.substring(0, result.length - 2);
    }

    return result;
  }

  getProgress(service: Service): string
  {
    let result = "";

    result = this.formatDecimal(service.completionRate!);

    return result;
  }

  goBack()
  {
    this.location.back();
  }
}
