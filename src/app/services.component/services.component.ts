import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Service } from '@app/service';
import { ServiceService } from '@app/services/service.service';
import { Sidebar } from '@app/sidebar/sidebar';

@Component({
  selector: 'app-services.component',
  imports: [ CommonModule, FormsModule, Sidebar ],
  templateUrl: './services.component.html',
  styleUrl: './services.component.css'
})
export class ServicesComponent
{
  services: Service[] = []; // Updated variable name

  // New Service Modal
  showNewService = false; // Updated variable name
  newService: Partial<Service> = this.blankNewService(); // Updated variable type

  // Filters
  showFilter = false;
  selectedFilter: 'all' | 'active' | 'in-review' | 'urgent' = 'all';
  filterState = { active: true, inReview: true, urgent: true };

  constructor(private serviceService: ServiceService) { } // Updated service

  ngOnInit()
  {
    this.serviceService.getAllServices().subscribe((data: any) => // Updated method
    {
      // ensure dueDate is a yyyy-mm-dd string for the date pipe
      this.services = (data ?? []).map((s: any) => ({ // Updated variable name
        ...s,
        dueDate: s.dueDate ? String(s.dueDate) : undefined
      }));
    });
  }

  // card click from template
  onCardClick(s: Service) // Updated parameter type
  {
    // Do whatever you want here (navigate, open details, etc.)
    // For now just avoid the TS error:
    console.log('Open service', s.serviceID); // Updated log
  }

  // New service modal handlers
  openNewService() { this.showNewService = true; this.newService = this.blankNewService(); } // Updated method
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

    // Automatically set due date (e.g., 14 days from now)
    // if (!this.newService.dueDate)
    // {
    //   const d = new Date();
    //   d.setDate(d.getDate() + 1);
    //   this.newService.dueDate = d.toISOString().slice(0, 10);
    // }

    // this.serviceService.createService(this.newService).subscribe((created: any) => // Updated method
    // {
    //   this.services = [ created, ...this.services ]; // Updated variable name
    //   this.closeNewService(); // Updated method
    // });
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
