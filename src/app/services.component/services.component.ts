import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Project } from '@app/project';
import { Service } from '@app/service';
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

  // Filters
  showFilter = false;
  selectedFilter: 'all' | 'active' | 'in-review' | 'urgent' = 'all';
  filterState = { active: true, inReview: true, urgent: true };

  constructor(private http: HttpClient, private route: ActivatedRoute, private serviceService: ServiceService, private router : Router) { }

  ngOnInit()
  {
    this.projectId = this.route.snapshot.paramMap.get('projectId');

    this.http.get<Project>(`${environment.apiUrl}/project/${this.projectId}`).subscribe(
      (res) =>
      {
        this.services = res.services; // Assuming res has a 'services' property
        console.log(res.services)
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

    this.router.navigate([`services/${s.serviceID}/taskboard/${s.taskBoard?.id}`])
  }

  // New service modal handlers
  openNewService() { this.router.navigate([`${this.router.url}/new`]); } // Updated method
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
}
